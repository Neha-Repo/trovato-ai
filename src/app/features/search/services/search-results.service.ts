import { Injectable } from '@angular/core';

import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
  SearchResultState,
  SuggestedExperience,
} from '../models/search-result.model';
import {
  Experience,
  ExperienceCatalogService,
} from './experience-catalog.service';
import {
  AvailabilityApiService,
} from './availability-api.service';

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
      experience:
        'Vatican Museums',

      city:
        'Rome',

      requestedDate:
        'tomorrow',

      requestedTicketCount:
        3,
    };

  constructor(
    private readonly experienceCatalogService:
      ExperienceCatalogService,

    private readonly availabilityApiService:
      AvailabilityApiService,
  ) {}

  async search(
    request:
      SearchRequest =
        this.defaultRequest,
  ): Promise<SearchResult> {
    const experience =
      this.resolveExperience(
        request.experience,
      );

    if (!experience) {
      return this
        .createUnsupportedResult(
          request,
        );
    }

    /*
     * The catalog owns canonical
     * experience information.
     *
     * For example:
     * "Uffizi in Rome"
     * still resolves to Florence.
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
      await this
        .evaluateExperienceFromBackend(
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
        ? await this
            .getSuggestedExperiences(
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

  private async evaluateExperienceFromBackend(
    experience: Experience,
    requestedDate: string,
    requestedTicketCount: number,
  ): Promise<ExperienceEvaluation> {
    try {
      const response =
        await this
          .availabilityApiService
          .checkAvailability({
            experienceId:
              experience.id,

            requestedDate,

            travellers:
              requestedTicketCount,
          });

      if (
        response.providerError
      ) {
        return {
          providerError:
            true,

          requestedDate:
            response
              .requestedDate,

          requestedDateSlots:
            [],

          alternateDates:
            [],

          largestAvailableGroupSize:
            0,

          state:
            'provider-error',
        };
      }

      const requestedDateSlots:
        AvailabilitySlot[] =
          response
            .requestedDateSlots
            .map(
              (slot) => ({
                id:
                  slot.id,

                time:
                  slot.time,

                availableTickets:
                  slot
                    .availableTickets,

                pricePerPerson:
                  slot
                    .pricePerPerson,

                bookingUrl:
                  slot.bookingUrl,
              }),
            );

      const alternateDates:
        AvailableDate[] =
          response
            .alternateDates
            .map(
              (
                availableDate,
              ) => ({
                date:
                  availableDate
                    .date,

                slots:
                  availableDate
                    .slots
                    .map(
                      (slot) => ({
                        id:
                          slot.id,

                        time:
                          slot.time,

                        availableTickets:
                          slot
                            .availableTickets,

                        pricePerPerson:
                          slot
                            .pricePerPerson,

                        bookingUrl:
                          slot
                            .bookingUrl,
                      }),
                    ),
              }),
            );

      const state =
        this.determineState({
          requestedDateSlots,

          alternateDates,

          largestAvailableGroupSize:
            response
              .largestAvailableGroupSize,

          requestedTicketCount,
        });

      return {
        providerError:
          false,

        requestedDate:
          response
            .requestedDate,

        requestedDateSlots,

        alternateDates,

        largestAvailableGroupSize:
          response
            .largestAvailableGroupSize,

        state,
      };
    } catch (error) {
      console.error(
        'Backend availability request failed',
        error,
      );

      return {
        providerError:
          true,

        requestedDate,

        requestedDateSlots:
          [],

        alternateDates:
          [],

        largestAvailableGroupSize:
          0,

        state:
          'provider-error',
      };
    }
  }

  private async getSuggestedExperiences(
    requestedExperience:
      Experience,

    request:
      SearchRequest,
  ): Promise<
    SuggestedExperience[]
  > {
    /*
     * Ask for more candidates than
     * we display because some may
     * have no suitable availability.
     */
    const geographicCandidates =
      this.experienceCatalogService
        .getAlternatives(
          requestedExperience.id,

          requestedExperience.city,

          10,
        );

    /*
     * Every suggested experience now
     * checks the SAME backend
     * availability service as the
     * primary result and alert checker.
     */
    const evaluatedCandidates =
      await Promise.all(
        geographicCandidates.map(
          async (
            candidate,
          ) => ({
            candidate,

            evaluation:
              await this
                .evaluateExperienceFromBackend(
                  candidate,

                  request
                    .requestedDate,

                  request
                    .requestedTicketCount,
                ),
          }),
        ),
      );

    const sameDateSuggestions:
      SuggestedExperience[] =
        [];

    const alternateDateSuggestions:
      SuggestedExperience[] =
        [];

    for (
      const {
        candidate,
        evaluation,
      } of evaluatedCandidates
    ) {
      /*
       * Never recommend:
       *
       * - failed providers
       * - experiences that cannot
       *   accommodate the group
       * - experiences with no useful
       *   availability
       */
      if (
        evaluation
          .providerError ||
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
       * Same-date matches rank before
       * experiences that require a
       * different date.
       */
      if (
        evaluation.state ===
        'available'
      ) {
        sameDateSuggestions
          .push(
            suggestion,
          );
      } else {
        alternateDateSuggestions
          .push(
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
    request:
      SearchRequest,
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

      requestedDateSlots:
        [],

      alternateDates:
        [],

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

    if (
      requestedDateSlots.length >
      0
    ) {
      return 'available';
    }

    if (
      alternateDates.length >
      0
    ) {
      return 'alternate-dates';
    }

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
        options
          .errorMessage,

      suggestedExperiences:
        options
          .suggestedExperiences,
    };
  }
}