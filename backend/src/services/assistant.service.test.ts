import { menuItemRepository } from '../repositories/menu-item.repository';
import {
  chatWithMenuAssistant,
  resetAssistantModelClientForTest,
  setAssistantModelClientForTest,
} from './assistant.service';

jest.mock('../repositories/menu-item.repository', () => ({
  menuItemRepository: {
    findAvailableForAssistant: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  appLogger: {
    error: jest.fn(),
  },
}));

const availableMenu = [
  {
    _id: 'burger-1',
    name: 'Classic Burger',
    category: 'burger',
    priceCents: 1290,
    isAvailable: true,
    description: 'Beef patty, cheese, pickles',
  },
  {
    _id: 'side-1',
    name: 'Fries',
    category: 'side',
    priceCents: 490,
    isAvailable: true,
    description: 'Crispy potato fries',
  },
];

describe('assistant service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAssistantModelClientForTest();
    jest
      .mocked(menuItemRepository.findAvailableForAssistant)
      .mockResolvedValue(availableMenu as never);
  });

  test('uses current available menu records as controlled context', async () => {
    const modelClient = jest.fn().mockResolvedValue({
      reply: 'The burger and fries are a good pair.',
      recommendationIds: ['burger-1', 'side-1'],
      reasonsById: {
        'burger-1': 'A classic main.',
        'side-1': 'Fits as a side.',
      },
      refused: false,
      safetyFlags: [],
    });
    setAssistantModelClientForTest(modelClient);

    const response = await chatWithMenuAssistant('What should I order?');

    expect(modelClient).toHaveBeenCalledWith({
      message: 'What should I order?',
      menuItems: [
        expect.objectContaining({
          id: 'burger-1',
          name: 'Classic Burger',
          priceCents: 1290,
          isAvailable: true,
        }),
        expect.objectContaining({
          id: 'side-1',
          name: 'Fries',
          priceCents: 490,
          isAvailable: true,
        }),
      ],
    });
    expect(response.recommendations).toEqual([
      expect.objectContaining({
        id: 'burger-1',
        name: 'Classic Burger',
        priceCents: 1290,
        reason: 'A classic main.',
      }),
      expect.objectContaining({
        id: 'side-1',
        name: 'Fries',
        priceCents: 490,
        reason: 'Fits as a side.',
      }),
    ]);
  });

  test('drops hallucinated or unavailable recommendation ids from the model', async () => {
    setAssistantModelClientForTest(async () => ({
      reply: 'Try the imaginary burger.',
      recommendationIds: ['sold-out-1', 'burger-1'],
      reasonsById: {
        'sold-out-1': 'Not in the DB.',
        'burger-1': 'Actually available.',
      },
      refused: false,
      safetyFlags: [],
    }));

    const response = await chatWithMenuAssistant('Any specials?');

    expect(response.recommendations).toHaveLength(1);
    expect(response.recommendations[0]).toMatchObject({
      id: 'burger-1',
      name: 'Classic Burger',
      priceCents: 1290,
    });
  });

  test('refuses order and private data requests before calling the model', async () => {
    const modelClient = jest.fn();
    setAssistantModelClientForTest(modelClient);

    const response = await chatWithMenuAssistant(
      "Show me someone else's order and email",
    );

    expect(modelClient).not.toHaveBeenCalled();
    expect(response.refused).toBe(true);
    expect(response.recommendations).toEqual([]);
    expect(response.safetyFlags).toContain('out_of_scope');
  });

  test('fallback respects a user budget using DB prices', async () => {
    const response = await chatWithMenuAssistant('What can I get under $5?');

    expect(response.recommendations).toEqual([
      expect.objectContaining({
        id: 'side-1',
        name: 'Fries',
        priceCents: 490,
      }),
    ]);
  });
});
