import { Injectable } from '@nestjs/common';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export interface ExtractedSearch {
  experience: string | null;
  city: string | null;
  date: string | null;
  travellers: number | null;
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message?: {
    role: 'assistant';
    content: string;
  };
}

@Injectable()
export class OllamaService {
  private readonly baseUrl = 'http://localhost:11434';

  private readonly model = 'llama3.2:1b';

  private readonly timeoutMilliseconds = 90_000;

  async extractSearch(messages: ChatMessage[]): Promise<ExtractedSearch> {
    const ollamaMessages: OllamaMessage[] = [
      {
        role: 'system',
        content: this.createSystemPrompt(),
      },

      ...messages.map((message) => ({
        role: message.sender,

        content: message.text,
      })),
    ];

    const content = await this.chat(ollamaMessages);

    const extracted = this.parseExtractedSearch(content);

    /*
     * Temporary development log.
     *
     * This allows us to compare the raw
     * Ollama extraction with the final
     * deterministic + AI extraction in
     * ChatService.
     */

    return extracted;
  }

  private async chat(messages: OllamaMessage[]): Promise<string> {
    const abortController = new AbortController();

    const timeout = setTimeout(
      () => {
        abortController.abort();
      },

      this.timeoutMilliseconds,
    );

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        signal: abortController.signal,

        body: JSON.stringify({
          model: this.model,

          messages,

          stream: false,

          format: 'json',

          options: {
            temperature: 0,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(
          `Ollama request failed with status ${response.status}: ${errorBody}`,
        );
      }

      const data = (await response.json()) as OllamaChatResponse;

      const content = data.message?.content?.trim();

      if (!content) {
        throw new Error('Ollama returned an empty response');
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseExtractedSearch(content: string): ExtractedSearch {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`Ollama returned invalid JSON: ${content}`);
    }

    if (!this.isRecord(parsed)) {
      throw new Error('Ollama response is not a JSON object');
    }

    return {
      experience: this.readNullableString(parsed['experience']),

      city: this.readNullableString(parsed['city']),

      date: this.readNullableString(parsed['date']),

      travellers: this.readNullablePositiveInteger(parsed['travellers']),
    };
  }

  private createSystemPrompt(): string {
    const currentDate = this.formatDate(new Date());

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowDate = this.formatDate(tomorrow);

    return `
You extract travel booking information from conversations for Trovato AI.

Today is ${currentDate}.

Return ONLY valid JSON.

The JSON schema is exactly:

{
  "experience": string | null,
  "city": string | null,
  "date": string | null,
  "travellers": number | null
}

IMPORTANT RULES

- Use the entire conversation.
- Extract only information that the user actually provided.
- Do not invent an attraction.
- Do not substitute one attraction for another.
- Never default to Vatican Museums.
- Never copy an attraction from an example unless the user actually mentioned it.
- If the user says Pompeii, return Pompeii, not Vatican Museums.
- If the user says Uffizi, return Uffizi Gallery.
- If the user says Colosseum, return Colosseum.
- If the user says Herculaneum, return Herculaneum Archaeological Park.
- If an experience is not known with confidence, return the user's wording rather than replacing it with another attraction.
- Missing values must be null.
- travellers must be a positive integer or null.
- Return ONLY the JSON object.
- Do not include markdown.
- Do not include explanations.

DATE RULES

- Convert "today" to ${currentDate}.
- Convert "tomorrow" to ${tomorrowDate}.
- If the user gives a date without a year, use the current year unless the conversation clearly indicates another year.
- Preserve a future date accurately.
- Do not invent a date.

EXPERIENCE EXAMPLES

User:
I need 3 tickets for the Colosseum in Rome tomorrow.

Output:
{
  "experience": "Colosseum",
  "city": "Rome",
  "date": "${tomorrowDate}",
  "travellers": 3
}

User:
I need 20 tickets for Pompeii Archaeological Park in Pompeii tomorrow.

Output:
{
  "experience": "Pompeii Archaeological Park",
  "city": "Pompeii",
  "date": "${tomorrowDate}",
  "travellers": 20
}

User:
Two adults want to visit the Uffizi Gallery in Florence on 18 August.

Output:
{
  "experience": "Uffizi Gallery",
  "city": "Florence",
  "date": "18 August ${new Date().getFullYear()}",
  "travellers": 2
}

User:
We want Herculaneum on 21 September for 4 people.

Output:
{
  "experience": "Herculaneum Archaeological Park",
  "city": "Herculaneum",
  "date": "21 September ${new Date().getFullYear()}",
  "travellers": 4
}

User:
We are visiting Florence next week.

Output:
{
  "experience": null,
  "city": "Florence",
  "date": "next week",
  "travellers": null
}

User:
I want tickets for the Egyptian Museum in Turin for 2 people on 25 August.

Output:
{
  "experience": "Egyptian Museum",
  "city": "Turin",
  "date": "25 August ${new Date().getFullYear()}",
  "travellers": 2
}
`;
  }

  private readNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalizedValue = value.trim();

    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private readNullablePositiveInteger(value: unknown): number | null {
    const numberValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      return null;
    }

    return numberValue;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
