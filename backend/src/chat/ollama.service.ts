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
  private readonly timeoutMilliseconds = 60_000;

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

    return this.parseExtractedSearch(content);
  }

  private async chat(messages: OllamaMessage[]): Promise<string> {
    const abortController = new AbortController();

    const timeout = setTimeout(() => {
      abortController.abort();
    }, this.timeoutMilliseconds);

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

    return `
You extract booking information from conversations.

Today is ${currentDate}.

Return ONLY valid JSON.

Schema:

{
  "experience": string | null,
  "city": string | null,
  "date": string | null,
  "travellers": number | null
}

Examples

User:
I want Vatican Museum tickets in Rome tomorrow for 3 people.

Output:
{
  "experience":"Vatican Museums",
  "city":"Rome",
  "date":"${this.formatDate(new Date(Date.now() + 86400000))}",
  "travellers":3
}

User:
I'd like to visit the Vatican Museums in Rome on 6 August with my wife and two kids.

Output:
{
  "experience":"Vatican Museums",
  "city":"Rome",
  "date":"6 August 2026",
  "travellers":4
}

User:
We're a family of five visiting Florence for a wine tour next Friday.

Output:
{
  "experience":"Wine tour",
  "city":"Florence",
  "date":"next Friday",
  "travellers":5
}

Rules

- Use the entire conversation.
- Do not invent information.
- Missing values must be null.
- Return ONLY JSON.
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
