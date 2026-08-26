import { ChatService } from './chat.service';
import { OllamaService } from './ollama.service';

describe('ChatService', () => {
  let service: ChatService;

  let ollamaService: {
    extractSearch: jest.Mock;
  };

  beforeEach(() => {
    ollamaService = {
      extractSearch: jest.fn().mockResolvedValue({
        experience: null,
        city: null,
        date: null,
        travellers: null,
      }),
    };

    service = new ChatService(ollamaService as unknown as OllamaService);
  });

  it('extracts a complete Vatican Museums search', async () => {
    const result = await service.sendMessage([
      {
        sender: 'user',
        text: 'Vatican Museums in Rome tomorrow for 3 people',
      },
    ]);

    expect(result.searchReady).toBe(true);

    expect(result.search).toEqual(
      expect.objectContaining({
        experience: 'Vatican Museums',
        city: 'Rome',
        travellers: 3,
      }),
    );

    expect(result.search?.date).toBeTruthy();
  });

  it('uses the newest attraction correction', async () => {
    const result = await service.sendMessage([
      {
        sender: 'user',
        text: 'Vatican Museums in Rome tomorrow for 2 people',
      },
      {
        sender: 'assistant',
        text: 'Let me check that.',
      },
      {
        sender: 'user',
        text: 'Actually Uffizi Gallery in Florence',
      },
    ]);

    expect(result.searchReady).toBe(true);

    expect(result.search).toEqual(
      expect.objectContaining({
        experience: 'Uffizi Gallery',
        city: 'Florence',
        travellers: 2,
      }),
    );
  });

  it('uses the newest traveller-count correction', async () => {
    const result = await service.sendMessage([
      {
        sender: 'user',
        text: 'Colosseum in Rome tomorrow for 2 people',
      },
      {
        sender: 'user',
        text: 'Actually 4 people',
      },
    ]);

    expect(result.searchReady).toBe(true);

    expect(result.search?.travellers).toBe(4);
  });

  it('recognizes attraction-between-number-and-tickets wording', async () => {
    const result = await service.sendMessage([
      {
        sender: 'user',
        text: '3 Uffizi Gallery tickets in Florence tomorrow',
      },
    ]);

    expect(result.searchReady).toBe(true);

    expect(result.search).toEqual(
      expect.objectContaining({
        experience: 'Uffizi Gallery',
        city: 'Florence',
        travellers: 3,
      }),
    );
  });

  it('asks for the missing city', async () => {
    const result = await service.sendMessage([
      {
        sender: 'user',
        text: 'Vatican Museums tomorrow for 2 people',
      },
    ]);

    expect(result.searchReady).toBe(false);

    expect(result.reply).toBe('Which city are you visiting?');
  });

  it('continues with deterministic extraction when Ollama fails', async () => {
    ollamaService.extractSearch.mockRejectedValue(
      new Error('Ollama unavailable'),
    );

    const result = await service.sendMessage([
      {
        sender: 'user',
        text: 'Pompeii in Naples tomorrow for 4 people',
      },
    ]);

    expect(result.searchReady).toBe(true);

    expect(result.search).toEqual(
      expect.objectContaining({
        experience: 'Pompeii Archaeological Park',
        city: 'Pompeii',
        travellers: 4,
      }),
    );
  });
});
