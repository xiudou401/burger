import { agentRunRepository } from '../repositories/agent-run.repository';
import { orderRepository } from '../repositories/order.repository';
import { getAdminAnalyticsSummary } from './admin-dashboard.service';
import {
  buildAdminInsightSystemPromptForTest,
  buildAdminInsightUserPromptForTest,
  chatWithAdminInsightAgent,
  generateAdminInsights,
  investigateAdminAlert,
  resetAdminInsightModelClientForTest,
  setAdminInsightModelClientForTest,
} from './admin-insight.service';
import { detectAnalyticsAlerts } from './admin-alert.service';

jest.mock('./admin-dashboard.service', () => ({
  getAdminAnalyticsSummary: jest.fn(),
}));

jest.mock('./admin-alert.service', () => ({
  detectAnalyticsAlerts: jest.fn(),
}));

jest.mock('../repositories/agent-run.repository', () => ({
  agentRunRepository: {
    create: jest.fn(),
  },
}));

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    listByStatus: jest.fn(),
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

const activeAlert = {
  id: '7d:high_cancellation_rate',
  type: 'high_cancellation_rate' as const,
  severity: 'medium' as const,
  title: 'High cancellation rate',
  message: '16.7% of orders were cancelled in the current 7d window.',
  evidence: ['2 of 12 orders are cancelled.', 'Alert threshold is 10%.'],
  metricValue: 0.167,
  threshold: 0.1,
  range: '7d' as const,
  createdAt: new Date('2026-09-20T00:00:00.000Z'),
};

describe('admin insight service', () => {
  const actor = { id: '507f1f77bcf86cd799439011' };

  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminInsightModelClientForTest();
    jest.mocked(getAdminAnalyticsSummary).mockResolvedValue(analyticsSummary);
    jest.mocked(detectAnalyticsAlerts).mockResolvedValue([activeAlert]);
    jest.mocked(agentRunRepository.create).mockResolvedValue({
      _id: 'agent-run-1',
      estimatedCostCents: 0.01,
    } as never);
    jest.mocked(orderRepository.listByStatus).mockResolvedValue([]);
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

  test('investigates an active analytics alert with alert context and logs both tools', async () => {
    const modelClient = jest.fn().mockResolvedValue({
      content: {
        summary: 'Cancellation rate needs an operations check.',
        insights: [
          {
            type: 'risk',
            severity: 'medium',
            title: 'Cancellation rate is above threshold',
            evidence: ['2 of 12 orders are cancelled.'],
            suggestedAction: 'Review cancelled checkout sessions.',
            relatedMenuItemIds: [],
          },
        ],
      },
      modelUsed: 'gpt-4o-mini',
    });
    setAdminInsightModelClientForTest(modelClient);

    const result = await investigateAdminAlert(
      {
        range: '7d',
        alertId: activeAlert.id,
      },
      actor,
    );

    expect(modelClient).toHaveBeenCalledWith({
      question:
        'Investigate this analytics alert and recommend the next operational check.',
      analytics: analyticsSummary,
      alert: activeAlert,
    });
    expect(agentRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toolsUsed: ['getAdminAnalyticsSummary', 'detectAnalyticsAlerts'],
        status: 'success',
      }),
    );
    expect(result.alert).toEqual(activeAlert);
    expect(result.run.toolsUsed).toEqual([
      'getAdminAnalyticsSummary',
      'detectAnalyticsAlerts',
    ]);
  });

  test('rejects investigation when the alert is no longer active', async () => {
    jest.mocked(detectAnalyticsAlerts).mockResolvedValue([]);

    await expect(
      investigateAdminAlert(
        {
          range: '7d',
          alertId: activeAlert.id,
        },
        actor,
      ),
    ).rejects.toThrow('Analytics alert is no longer active.');
  });

  test('uses getOrdersByStatus tool when a follow-up asks for cancelled orders', async () => {
    jest.mocked(orderRepository.listByStatus).mockResolvedValue([
      {
        _id: '66f000000000000000000001',
        status: 'cancelled',
        totalCents: 3200,
        payment: {
          status: 'cancelled',
        },
        items: [
          {
            nameAtPurchase: 'Classic Burger',
            quantity: 2,
          },
        ],
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
        updatedAt: new Date('2026-09-20T10:05:00.000Z'),
      },
    ] as never);

    const modelClient = jest.fn().mockResolvedValue({
      content: {
        summary: 'One recent cancelled order needs review.',
        insights: [
          {
            type: 'risk',
            severity: 'medium',
            title: 'Cancelled order evidence',
            evidence: ['66f000000000000000000001 is cancelled.'],
            suggestedAction: 'Open the order in the admin order console.',
            relatedMenuItemIds: [],
          },
        ],
        orderEvidence: [
          {
            orderId: '66f000000000000000000001',
            status: 'cancelled',
            paymentStatus: 'cancelled',
            totalCents: 3200,
            itemCount: 2,
            items: ['Classic Burger'],
            createdAt: '2026-09-20T10:00:00.000Z',
            updatedAt: '2026-09-20T10:05:00.000Z',
          },
        ],
      },
      modelUsed: 'gpt-4o-mini',
    });
    setAdminInsightModelClientForTest(modelClient);

    const result = await investigateAdminAlert(
      {
        range: '7d',
        alertId: activeAlert.id,
        question: 'show me the cancelled orders',
      },
      actor,
    );

    expect(orderRepository.listByStatus).toHaveBeenCalledWith('cancelled', 5);
    expect(modelClient).toHaveBeenCalledWith(
      expect.objectContaining({
        orderEvidence: [
          expect.objectContaining({
            orderId: '66f000000000000000000001',
            status: 'cancelled',
            totalCents: 3200,
          }),
        ],
      }),
    );
    expect(agentRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toolsUsed: [
          'getAdminAnalyticsSummary',
          'detectAnalyticsAlerts',
          'getOrdersByStatus',
        ],
      }),
    );
    expect(result.orderEvidence).toHaveLength(1);
  });

  test('selects order evidence tool for admin chat questions about cancelled orders', async () => {
    jest.mocked(orderRepository.listByStatus).mockResolvedValue([
      {
        _id: '66f000000000000000000002',
        status: 'cancelled',
        totalCents: 1800,
        payment: {
          status: 'cancelled',
        },
        items: [
          {
            nameAtPurchase: 'Fries',
            quantity: 1,
          },
        ],
        createdAt: new Date('2026-09-20T11:00:00.000Z'),
        updatedAt: new Date('2026-09-20T11:03:00.000Z'),
      },
    ] as never);

    const modelClient = jest.fn().mockResolvedValue({
      content: {
        summary: 'One cancelled order was found.',
        insights: [
          {
            type: 'risk',
            severity: 'medium',
            title: 'Cancelled order found',
            evidence: ['66f000000000000000000002 is cancelled.'],
            suggestedAction: 'Review the order record.',
            relatedMenuItemIds: [],
          },
        ],
        orderEvidence: [
          {
            orderId: '66f000000000000000000002',
            status: 'cancelled',
            paymentStatus: 'cancelled',
            totalCents: 1800,
            itemCount: 1,
            items: ['Fries'],
            createdAt: '2026-09-20T11:00:00.000Z',
            updatedAt: '2026-09-20T11:03:00.000Z',
          },
        ],
      },
      modelUsed: 'gpt-4o-mini',
    });
    setAdminInsightModelClientForTest(modelClient);

    const result = await chatWithAdminInsightAgent(
      {
        range: '7d',
        question: 'show me the cancelled orders',
      },
      actor,
    );

    expect(orderRepository.listByStatus).toHaveBeenCalledWith('cancelled', 5);
    expect(modelClient).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'show me the cancelled orders',
        selectedTools: ['getPaymentStats', 'getOrdersByStatus'],
        orderEvidence: [
          expect.objectContaining({
            orderId: '66f000000000000000000002',
            status: 'cancelled',
          }),
        ],
      }),
    );
    expect(agentRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toolsUsed: ['getPaymentStats', 'getOrdersByStatus'],
        status: 'success',
      }),
    );
    expect(result.run.toolsUsed).toEqual([
      'getPaymentStats',
      'getOrdersByStatus',
    ]);
    expect(result.orderEvidence).toHaveLength(1);
  });
});
