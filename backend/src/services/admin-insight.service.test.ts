import { agentRunRepository } from '../repositories/agent-run.repository';
import { getAdminAnalyticsSummary } from './admin-dashboard.service';
import {
  buildAdminInsightSystemPromptForTest,
  buildAdminInsightUserPromptForTest,
  generateAdminInsights,
  resetAdminInsightModelClientForTest,
  setAdminInsightModelClientForTest,
} from './admin-insight.service';

jest.mock('./admin-dashboard.service', () => ({
  getAdminAnalyticsSummary: jest.fn(),
}));

jest.mock('../repositories/agent-run.repository', () => ({
  agentRunRepository: {
    create: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  appLogger: {
    error: jest.fn(),
  },
}));

const analyticsSummary = {
  range: '7d' as const,
  currency: 'AUD' as const,
  startAt: new Date('2026-09-13T00:00:00.000Z'),
  endAt: new Date('2026-09-20T00:00:00.000Z'),
  revenueCents: 18250,
  orderCount: 12,
  paidOrderCount: 9,
  averageOrderValueCents: 2028,
  categorySales: [
    { category: 'burger', quantitySold: 18, revenueCents: 12600 },
    { category: 'side', quantitySold: 7, revenueCents: 3200 },
    { category: 'drink', quantitySold: 5, revenueCents: 1550 },
    { category: 'dessert', quantitySold: 1, revenueCents: 900 },
    { category: 'combo', quantitySold: 0, revenueCents: 0 },
  ],
  topItems: [
    {
      menuItemId: 'menu-1',
      name: 'Classic Burger',
      quantitySold: 8,
      revenueCents: 9600,
    },
  ],
  underperformingItems: [
    {
      menuItemId: 'menu-2',
      name: 'Chocolate Brownie',
      quantitySold: 1,
      revenueCents: 900,
    },
  ],
  paymentStatusCounts: [
    { status: 'unpaid', count: 0 },
    { status: 'requires_payment', count: 0 },
    { status: 'paid', count: 9 },
    { status: 'failed', count: 1 },
    { status: 'cancelled', count: 2 },
    { status: 'refunded', count: 0 },
  ],
};

describe('admin insight service', () => {
  const actor = { id: '507f1f77bcf86cd799439011' };

  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminInsightModelClientForTest();
    jest.mocked(getAdminAnalyticsSummary).mockResolvedValue(analyticsSummary);
    jest.mocked(agentRunRepository.create).mockResolvedValue({
      _id: 'agent-run-1',
      estimatedCostCents: 0.01,
    } as never);
  });

  test('passes verified analytics summary into the insight model and logs the run', async () => {
    const modelClient = jest.fn().mockResolvedValue({
      content: {
        summary: 'Desserts are the clearest opportunity.',
        insights: [
          {
            type: 'opportunity',
            severity: 'medium',
            title: 'Desserts are underperforming',
            evidence: ['Desserts sold 1 item for $9.00.'],
            suggestedAction: 'Bundle dessert with the top burger.',
            relatedMenuItemIds: ['menu-2'],
          },
        ],
      },
      usage: {
        inputTokens: 1000,
        outputTokens: 200,
      },
      modelUsed: 'gpt-4o-mini',
    });
    setAdminInsightModelClientForTest(modelClient);

    const result = await generateAdminInsights(
      {
        range: '7d',
        question: 'What should we improve this week?',
      },
      actor,
    );

    expect(modelClient).toHaveBeenCalledWith({
      question: 'What should we improve this week?',
      analytics: analyticsSummary,
    });
    expect(agentRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        agentName: 'admin_insight_agent',
        actorId: actor.id,
        prompt: 'What should we improve this week?',
        toolsUsed: ['getAdminAnalyticsSummary'],
        status: 'success',
      }),
    );
    expect(result).toMatchObject({
      summary: 'Desserts are the clearest opportunity.',
      analytics: analyticsSummary,
      run: {
        id: 'agent-run-1',
        agentName: 'admin_insight_agent',
        toolsUsed: ['getAdminAnalyticsSummary'],
        status: 'success',
      },
    });
  });

  test('uses deterministic fallback insights when the model client is not overridden', async () => {
    const result = await generateAdminInsights({ range: '7d' }, actor);

    expect(result.summary).toContain('A$182.50');
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.run.model).toBe('deterministic-fallback');
    expect(agentRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'deterministic-fallback',
        status: 'success',
      }),
    );
  });

  test('logs failed runs when insight generation fails', async () => {
    setAdminInsightModelClientForTest(async () => {
      throw new Error('Model unavailable');
    });

    await expect(generateAdminInsights({ range: '7d' }, actor)).rejects.toThrow(
      'Could not generate admin insights. Please try again later.',
    );

    expect(agentRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failureReason: 'Model unavailable',
      }),
    );
  });

  test('prompts the model to use AUD display values instead of raw cents', () => {
    const systemPrompt = buildAdminInsightSystemPromptForTest();
    const userPrompt = JSON.parse(
      buildAdminInsightUserPromptForTest({
        question: 'What should we improve?',
        analytics: analyticsSummary,
      }),
    ) as {
      currencyInstruction: string;
      displayAnalytics: {
        revenue: string;
        categorySales: Array<{ category: string; revenue: string }>;
      };
    };

    expect(systemPrompt).toContain('Do not write cents');
    expect(userPrompt.currencyInstruction).toContain('Never write cents');
    expect(userPrompt.displayAnalytics.revenue).toBe('A$182.50');
    expect(userPrompt.displayAnalytics.categorySales).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'burger',
          revenue: 'A$126.00',
        }),
      ]),
    );
  });
});
