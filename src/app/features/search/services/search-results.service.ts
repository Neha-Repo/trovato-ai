import { Injectable } from '@angular/core';

import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
  SearchResultState,
  SuggestedExperience,
} from '../models/search-result.model';
import {
  AvailabilityProviderService,
} from '../providers/availability-provider.service';
import {
  Experience,
  ExperienceCatalogService,
} from './experience-catalog.service';

interface SearchRequest {
  experience?: string;
  city?: string;
  requestedDate: string;
  requestedTicketCount: number;
}

interface ExperienceEvaluation {
  providerError: boolean;

  requestedDate: string;
  requestedDateSlots: AvailabilitySlot[];

  alternateDates: AvailableDate[];

  largestAvailableGroupSize: number;

  state: Exclude<
    SearchResultState,
    'unsupported-experience'
  >;
}

@Injectable({
  providedIn: 'root',
})
export class SearchResultsService {
  private readonly defaultRequest:
    SearchRequest = {
      experience: 'Vatican Museums',
      city: 'Rome',
      requestedDate: 'tomorrow',
      requestedTicketCount: 3,
    };

  constructor(
    private readonly experienceCatalogService:
      ExperienceCatalogService,

    private readonly availabilityProviderService:
      AvailabilityProviderService,
  ) {}

  search(
    request:
      SearchRequest =
        this.defaultRequest,
  ): SearchResult {
    const experience =
      this.resolveExperience(
        request.experience,
      );

    if (!experience) {
      return this.createUnsupportedResult(
        request,
      );
    }

    /*
     * The experience catalog owns the
     * canonical location.
     *
     * For example, if somebody asks for
     * "Uffizi in Rome", Uffizi still
     * resolves to Florence.
     */
    const normalizedRequest:
      SearchRequest = {
      ...request,

      experience:
        experience.title,

      city:
        experience.city,
    };

    const evaluation =
      this.evaluateExperience(
        experience,

        normalizedRequest
          .requestedDate,

        normalizedRequest
          .requestedTicketCount,
      );

    normalizedRequest.requestedDate =
      evaluation.requestedDate;

    if (
      evaluation.providerError
    ) {
      return this.createResult({
        experience,

        request:
          normalizedRequest,

        evaluation,

        errorMessage:
          'We could not retrieve live availability right now. Please try again shortly.',
      });
    }

    const shouldSuggestAlternatives =
      evaluation.state ===
        'no-availability' ||
      evaluation.state ===
        'group-too-large';

    const suggestedExperiences =
      shouldSuggestAlternatives
        ? this.getSuggestedExperiences(
            experience,
            normalizedRequest,
          )
        : undefined;

    return this.createResult({
      experience,

      request:
        normalizedRequest,

      evaluation,

      suggestedExperiences,
    });
  }

  private evaluateExperience(
    experience: Experience,
    requestedDate: string,
    requestedTicketCount: number,
  ): ExperienceEvaluation {
    /*
     * SearchResultsService no longer
     * knows how availability is obtained.
     *
     * It asks the provider registry for
     * the provider that supports this
     * experience.
     */
    const provider =
      this.availabilityProviderService
        .getProvider(
          experience,
        );

    /*
     * Every provider returns the same
     * normalized Trovato availability
     * contract.
     */
    const providerAvailability =
      provider.getAvailability({
        experience,
        requestedDate,
      });

    if (
      providerAvailability
        .providerError
    ) {
      return {
        providerError: true,

        requestedDate:
          providerAvailability
            .requestedDate,

        requestedDateSlots: [],

        alternateDates: [],

        largestAvailableGroupSize:
          0,

        state:
          'provider-error',
      };
    }

    /*
     * Provider inventory tells us what
     * exists.
     *
     * Trovato decides which slots are
     * actually usable for this user's
     * requested group size.
     */
    const requestedDateSlots =
      this.filterBookableSlots(
        providerAvailability
          .requestedDateSlots,

        requestedTicketCount,
      );

    const alternateDates =
      providerAvailability
        .alternateDates
        .map(
          (
            availableDate,
          ) => ({
            ...availableDate,

            slots:
              this.filterBookableSlots(
                availableDate.slots,
                requestedTicketCount,
              ),
          }),
        )
        .filter(
          (
            availableDate,
          ) =>
            availableDate
              .slots
              .length > 0,
        );

    /*
     * Keep the unfiltered provider slots
     * when calculating capacity.
     *
     * This lets Trovato distinguish:
     *
     * "nothing is available"
     *
     * from:
     *
     * "availability exists, but the
     * requested group is too large".
     */
    const alternateProviderSlots =
      providerAvailability
        .alternateDates
        .reduce<
          AvailabilitySlot[]
        >(
          (
            slots,
            availableDate,
          ) => [
            ...slots,
            ...availableDate.slots,
          ],
          [],
        );

    const allProviderSlots = [
      ...providerAvailability
        .requestedDateSlots,

      ...alternateProviderSlots,
    ];

    const largestAvailableGroupSize =
      this.getLargestAvailableGroupSize(
        allProviderSlots,
      );

    const state =
      this.determineState({
        requestedDateSlots,

        alternateDates,

        largestAvailableGroupSize,

        requestedTicketCount,
      });

    return {
      providerError: false,

      requestedDate:
        providerAvailability
          .requestedDate,

      requestedDateSlots,

      alternateDates,

      largestAvailableGroupSize,

      state,
    };
  }

  private getSuggestedExperiences(
    requestedExperience:
      Experience,

    request:
      SearchRequest,
  ): SuggestedExperience[] {
    /*
     * Ask the catalog for more
     * alternatives than we intend to
     * display.
     *
     * Some candidates may fail their
     * availability check.
     */
    const geographicCandidates =
      this.experienceCatalogService
        .getAlternatives(
          requestedExperience.id,

          requestedExperience.city,

          10,
        );

    const sameDateSuggestions:
      SuggestedExperience[] = [];

    const alternateDateSuggestions:
      SuggestedExperience[] = [];

    for (
      const candidate of
        geographicCandidates
    ) {
      /*
       * evaluateExperience() goes
       * through the provider registry.
       *
       * This means alternatives can use
       * completely different providers
       * from the originally requested
       * experience.
       */
      const evaluation =
        this.evaluateExperience(
          candidate,

          request.requestedDate,

          request
            .requestedTicketCount,
        );

      /*
       * Never recommend:
       *
       * - provider failures
       * - experiences that cannot fit
       *   the full requested group
       * - experiences with no useful
       *   availability
       */
      if (
        evaluation.providerError ||
        (
          evaluation.state !==
            'available' &&
          evaluation.state !==
            'alternate-dates'
        )
      ) {
        continue;
      }

      const suggestion:
        SuggestedExperience = {
        id:
          candidate.id,

        title:
          candidate.title,

        city:
          candidate.city,

        location:
          candidate.location,

        imageUrl:
          candidate.imageUrl,

        state:
          evaluation.state,

        requestedDate:
          evaluation
            .requestedDate,

        requestedDateSlots:
          evaluation
            .requestedDateSlots,

        alternateDates:
          evaluation
            .alternateDates,
      };

      /*
       * Same-date availability always
       * ranks before an experience that
       * requires changing the date.
       *
       * Geographic priority is already
       * preserved by the catalog's
       * candidate ordering.
       */
      if (
        evaluation.state ===
        'available'
      ) {
        sameDateSuggestions.push(
          suggestion,
        );
      } else {
        alternateDateSuggestions.push(
          suggestion,
        );
      }
    }

    return [
      ...sameDateSuggestions,

      ...alternateDateSuggestions,
    ].slice(
      0,
      3,
    );
  }

  private resolveExperience(
    title?: string,
  ): Experience | null {
    if (
      !title?.trim()
    ) {
      return null;
    }

    return this
      .experienceCatalogService
      .getByTitle(
        title,
      );
  }

  private createUnsupportedResult(
    request: SearchRequest,
  ): SearchResult {
    const requestedTitle =
      request.experience
        ?.trim() ||
      'Requested experience';

    return {
      id:
        'unsupported-experience',

      title:
        requestedTitle,

      city:
        request.city
          ?.trim() ?? '',

      location:
        request.city
          ?.trim() ??
        'Experience not yet supported',

      requestedDate:
        request.requestedDate,

      requestedTicketCount:
        request
          .requestedTicketCount,

      state:
        'unsupported-experience',

      requestedDateSlots: [],

      alternateDates: [],

      errorMessage:
        `We do not currently have booking information for ${requestedTitle}. Try another attraction or return to chat.`,
    };
  }

  private determineState(
    options: {
      requestedDateSlots:
        AvailabilitySlot[];

      alternateDates:
        AvailableDate[];

      largestAvailableGroupSize:
        number;

      requestedTicketCount:
        number;
    },
  ): Exclude<
    SearchResultState,
    | 'provider-error'
    | 'unsupported-experience'
  > {
    const {
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      requestedTicketCount,
    } = options;

    /*
     * Best case:
     * the requested date itself works.
     */
    if (
      requestedDateSlots.length >
      0
    ) {
      return 'available';
    }

    /*
     * Requested date does not work,
     * but another date can accommodate
     * the entire group.
     */
    if (
      alternateDates.length >
      0
    ) {
      return 'alternate-dates';
    }

    /*
     * Inventory exists, but nowhere in
     * the provider result can fit the
     * requested number of travellers.
     */
    if (
      largestAvailableGroupSize >
        0 &&
      largestAvailableGroupSize <
        requestedTicketCount
    ) {
      return 'group-too-large';
    }

    return 'no-availability';
  }

  private createResult(
    options: {
      experience:
        Experience;

      request:
        SearchRequest;

      evaluation:
        ExperienceEvaluation;

      errorMessage?:
        string;

      suggestedExperiences?:
        SuggestedExperience[];
    },
  ): SearchResult {
    return {
      id:
        options
          .experience
          .id,

      title:
        options
          .experience
          .title,

      city:
        options
          .experience
          .city,

      location:
        options
          .experience
          .location,

      imageUrl:
        options
          .experience
          .imageUrl,

      requestedDate:
        options
          .evaluation
          .requestedDate,

      requestedTicketCount:
        options
          .request
          .requestedTicketCount,

      state:
        options
          .evaluation
          .state,

      requestedDateSlots:
        options
          .evaluation
          .requestedDateSlots,

      alternateDates:
        options
          .evaluation
          .alternateDates,

      largestAvailableGroupSize:
        options
          .evaluation
          .largestAvailableGroupSize,

      errorMessage:
        options.errorMessage,

      suggestedExperiences:
        options
          .suggestedExperiences,
    };
  }

  private filterBookableSlots(
    slots:
      AvailabilitySlot[],

    requestedTicketCount:
      number,
  ): AvailabilitySlot[] {
    return slots.filter(
      (slot) =>
        slot.availableTickets >=
        requestedTicketCount,
    );
  }

  private getLargestAvailableGroupSize(
    slots:
      AvailabilitySlot[],
  ): number {
    if (
      slots.length === 0
    ) {
      return 0;
    }

    return Math.max(
      ...slots.map(
        (slot) =>
          slot.availableTickets,
      ),
    );
  }
}