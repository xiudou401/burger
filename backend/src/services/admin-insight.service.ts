import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import { agentRunRepository } from '../repositories/agent-run.repository';
import { orderRepository } from '../repositories/order.repository';
import type { OrderStatus } from '../models/order.model';
import {
  getAdminAnalyticsSummary,
  type AdminAnalyticsSummary,
} from './admin-dashboard.service';
import {
  AdminInsightResponseSchema,
  type AdminAlertInvestigationRequestPayload,
  type AdminInsightChatRequestPayload,
  type AdminInsightRequestPayload,
  type AdminInsightResponsePayload,
} from '../validation/admin-insight.schema';
import type { AuthenticatedUser } from '../types/auth';
import { appLogger } from '../utils/logger';
import {
  detectAnalyticsAlerts,
  type AnalyticsAlert,
} from './admin-alert.service';
import { ServiceError } from '../errors/ServiceError';

const ADMIN_INSIGHT_AGENT = 'admin_insight_agent';
const ADMIN_INSIGHT_TOOL = 'getAdminAnalyticsSummary';
const ADMIN_ALERT_TOOL = 'detectAnalyticsAlerts';
const ADMIN_SALES_SUMMARY_TOOL = 'getSalesSummary';
const ADMIN_CATEGORY_PERFORMANCE_TOOL = 'getCategoryPerformance';
const ADMIN_ITEM_PERFORMANCE_TOOL = 'getItemPerformance';
const ADMIN_PAYMENT_STATS_TOOL = 'getPaymentStats';
const ADMIN_ORDER_STATUS_TOOL = 'getOrdersByStatus';
const FALLBACK_MODEL = 'deterministic-fallback';

interface ModelUsage {
  inputTokens?: number;
  outputTokens?: number;
}

interface InsightModelResult {
  content: AdminInsightResponsePayload;
  usage?: ModelUsage;
  modelUsed: string;
}

type AdminInsightModelClient = (input: {
  question: string;
  analytics: AdminAnalyticsSummary;
  alert?: AnalyticsAlert;
  activeAlerts?: AnalyticsAlert[];
  orderEvidence?: AdminInsightResponsePayload['orderEvidence'];
  selectedTools?: string[];
}) => Promise<InsightModelResult>;

const nowMs = () => Date.now();

const formatCurrency = (valueCents: number) =>
  `A$${(valueCents / 100).toFixed(2)}`;

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const estimateCostCents = (usage?: ModelUsage) => {
  if (!usage?.inputTokens && !usage?.outputTokens) {
    return undefined;
  }

  // Approximate gpt-4o-mini pricing: input $0.15 / 1M, output $0.60 / 1M.
  const inputCost = ((usage.inputTokens ?? 0) / 1_000_000) * 15;
  const outputCost = ((usage.outputTokens ?? 0) / 1_000_000) * 60;

  return Number((inputCost + outputCost).toFixed(4));
};

const getLowestCategory = (analytics: AdminAnalyticsSummary) => {
  return [...analytics.categorySales].sort(
    (a, b) =>
      a.revenueCents - b.revenueCents || a.quantitySold - b.quantitySold,
  )[0];
};

const getHighestCategory = (analytics: AdminAnalyticsSummary) => {
  return [...analytics.categorySales].sort(
    (a, b) =>
      b.revenueCents - a.revenueCents || b.quantitySold - a.quantitySold,
  )[0];
};

const getPaymentCount = (analytics: AdminAnalyticsSummary, status: string) => {
  return (
    analytics.paymentStatusCounts.find((entry) => entry.status === status)
      ?.count ?? 0
  );
};

const includesAny = (value: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(value));

const selectAdminChatTools = (question: string) => {
  const normalized = question.toLowerCase();
  const tools = new Set<string>();

  if (
    includesAny(normalized, [
      /\brevenue\b/,
      /\bsales?\b/,
      /\baov\b/,
      /\baverage order\b/,
      /\bperformance\b/,
      /\bdrop\b/,
      /\btrend\b/,
      /\bweek\b/,
    ])
  ) {
    tools.add(ADMIN_SALES_SUMMARY_TOOL);
  }

  if (includesAny(normalized, [/\bcategory\b/, /\bcategories\b/])) {
    tools.add(ADMIN_CATEGORY_PERFORMANCE_TOOL);
  }

  if (
    includesAny(normalized, [
      /\bitem\b/,
      /\bitems\b/,
      /\bmenu\b/,
      /\bburger\b/,
      /\bworst\b/,
      /\bbest\b/,
      /\btop\b/,
      /\blower\b/,
      /\bunderperform/,
    ])
  ) {
    tools.add(ADMIN_ITEM_PERFORMANCE_TOOL);
  }

  if (
    includesAny(normalized, [
      /\bpayment\b/,
      /\bpayments\b/,
      /\bpaid\b/,
      /\bunpaid\b/,
      /\bfailed\b/,
      /\brefund/,
      /\bcancell?ed\b/,
      /\bcancell?ations?\b/,
    ])
  ) {
    tools.add(ADMIN_PAYMENT_STATS_TOOL);
  }

  if (
    getRequestedOrderStatus(question) ||
    includesAny(normalized, [/\border\b/, /\borders\b/, /\bshow\b/, /\blist\b/])
  ) {
    tools.add(ADMIN_ORDER_STATUS_TOOL);
  }

  if (
    includesAny(normalized, [
      /\balert\b/,
      /\brisk\b/,
      /\banomal/,
      /\bissue\b/,
      /\bcancell?ation rate\b/,
      /\brevenue drop\b/,
    ])
  ) {
    tools.add(ADMIN_ALERT_TOOL);
  }

  if (tools.size === 0) {
    tools.add(ADMIN_SALES_SUMMARY_TOOL);
    tools.add(ADMIN_ITEM_PERFORMANCE_TOOL);
  }

  return [...tools];
};

const buildLogicalAnalyticsToolCalls = (tools: string[], latencyMs: number) =>
  tools
    .filter(
      (tool) => tool !== ADMIN_ORDER_STATUS_TOOL && tool !== ADMIN_ALERT_TOOL,
    )
    .map((name) => ({
      name,
      status: 'success' as const,
      latencyMs,
    }));

const getRequestedOrderStatus = (question: string): OrderStatus | null => {
  const normalized = question.toLowerCase();

  if (
    /\bcancell?ed\b/.test(normalized) ||
    /\bcancell?ations?\b/.test(normalized)
  ) {
    return 'cancelled';
  }

  if (/\bpending\b/.test(normalized) || /\bunpaid\b/.test(normalized)) {
    return 'pending_payment';
  }

  return (
    ORDER_STATUSES.find((status) =>
      normalized.includes(status.replace('_', ' ')),
    ) ?? null
  );
};

const getOrdersByStatusEvidence = async (
  status: OrderStatus,
  limit = 5,
): Promise<AdminInsightResponsePayload['orderEvidence']> => {
  const orders = await orderRepository.listByStatus(status, limit);

  return orders.map((order) => ({
    orderId: String(order._id),
    status: order.status,
    paymentStatus: order.payment?.status,
    totalCents: order.totalCents,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items
      .slice(0, 6)
      .map((item) => item.nameAtPurchase ?? 'Menu item'),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));
};

const buildFallbackInsights = (
  analytics: AdminAnalyticsSummary,
  alert?: AnalyticsAlert,
  orderEvidence?: AdminInsightResponsePayload['orderEvidence'],
): AdminInsightResponsePayload => {
  if (orderEvidence && orderEvidence.length > 0) {
    return {
      summary: `Found ${orderEvidence.length} recent ${orderEvidence[0].status.replace(
        '_',
        ' ',
      )} orders. Review the listed order evidence before deciding whether the issue is operational or payment-related.`,
      insights: [
        {
          type: 'risk',
          severity: alert?.severity ?? 'medium',
          title: `Recent ${orderEvidence[0].status.replace('_', ' ')} orders`,
          evidence: orderEvidence
            .slice(0, 4)
            .map(
              (order) =>
                `${order.orderId} is ${order.status} with ${formatCurrency(
                  order.totalCents,
                )} total and ${order.itemCount} items.`,
            ),
          suggestedAction:
            'Open the affected orders in the admin order console and compare payment status, item mix, and timing before changing menu settings.',
          relatedMenuItemIds: [],
        },
      ],
      orderEvidence,
    };
  }

  if (alert) {
    return {
      summary: `${alert.title}: ${alert.message} The likely next step is to verify the affected operational path before changing menu or payment settings.`,
      insights: [
        {
          type: 'risk',
          severity: alert.severity,
          title: alert.title,
          evidence: alert.evidence,
          suggestedAction:
            alert.type === 'revenue_drop'
              ? 'Compare category and item sales against the previous period, then review whether lower-performing items need placement or bundle changes.'
              : alert.type === 'low_paid_order_rate'
                ? 'Review checkout completion and Stripe payment outcomes before changing promotions.'
                : 'Review cancelled checkout sessions and recent order status changes to identify whether the issue is customer payment flow or operations handling.',
          relatedMenuItemIds: [],
        },
      ],
      orderEvidence,
    };
  }

  const lowestCategory = getLowestCategory(analytics);
  const highestCategory = getHighestCategory(analytics);
  const cancelledCount = getPaymentCount(analytics, 'cancelled');
  const failedCount = getPaymentCount(analytics, 'failed');
  const paymentIssues = cancelledCount + failedCount;
  const lowerItem = analytics.underperformingItems[0];

  const insights: AdminInsightResponsePayload['insights'] = [];

  if (lowestCategory && highestCategory) {
    insights.push({
      type: 'opportunity',
      severity:
        lowestCategory.revenueCents === 0 ||
        lowestCategory.revenueCents * 4 < highestCategory.revenueCents
          ? 'medium'
          : 'low',
      title: `${lowestCategory.category} sales are lagging`,
      evidence: [
        `${lowestCategory.category} revenue is ${formatCurrency(
          lowestCategory.revenueCents,
        )} across ${lowestCategory.quantitySold} items sold.`,
        `${highestCategory.category} is leading with ${formatCurrency(
          highestCategory.revenueCents,
        )} revenue.`,
      ],
      suggestedAction: lowerItem
        ? `Feature ${lowerItem.name} beside a stronger ${highestCategory.category} offer and watch attachment over the next week.`
        : `Bundle a ${lowestCategory.category} item with a stronger ${highestCategory.category} offer and watch attachment over the next week.`,
      relatedMenuItemIds: lowerItem ? [lowerItem.menuItemId] : [],
    });
  }

  if (paymentIssues > 0) {
    insights.push({
      type: 'risk',
      severity: paymentIssues >= 5 ? 'high' : 'medium',
      title: 'Payment issues need monitoring',
      evidence: [
        `${cancelledCount} cancelled payments in the selected range.`,
        `${failedCount} failed payments in the selected range.`,
      ],
      suggestedAction:
        'Review Stripe logs and checkout messaging before changing menu promotions.',
      relatedMenuItemIds: [],
    });
  }

  if (analytics.topItems[0]) {
    insights.push({
      type: 'trend',
      severity: 'low',
      title: `${analytics.topItems[0].name} is carrying demand`,
      evidence: [
        `${analytics.topItems[0].quantitySold} sold for ${formatCurrency(
          analytics.topItems[0].revenueCents,
        )} revenue.`,
      ],
      suggestedAction:
        'Use this item as an anchor for pairings and compare whether sides or drinks attach strongly enough.',
      relatedMenuItemIds: [analytics.topItems[0].menuItemId],
    });
  }

  return {
    summary: `In the selected ${analytics.range} range, paid order revenue is ${formatCurrency(
      analytics.revenueCents,
    )} across ${
      analytics.paidOrderCount
    } paid orders. The clearest action is to protect top-selling demand while improving lower-performing categories with bundles or placement.`,
    insights:
      insights.length > 0
        ? insights.slice(0, 4)
        : [
            {
              type: 'trend',
              severity: 'low',
              title: 'More order data is needed',
              evidence: ['No paid order pattern is strong enough yet.'],
              suggestedAction:
                'Keep collecting orders before making menu changes.',
              relatedMenuItemIds: [],
            },
          ],
  };
};

const buildChatFallbackInsights = ({
  question,
  analytics,
  activeAlerts,
  orderEvidence,
}: {
  question: string;
  analytics: AdminAnalyticsSummary;
  activeAlerts?: AnalyticsAlert[];
  orderEvidence?: AdminInsightResponsePayload['orderEvidence'];
}): AdminInsightResponsePayload => {
  const normalized = question.toLowerCase();

  if (orderEvidence && orderEvidence.length > 0) {
    return buildFallbackInsights(analytics, activeAlerts?.[0], orderEvidence);
  }

  if (
    includesAny(normalized, [
      /\bworst\b/,
      /\blower\b/,
      /\bunderperform/,
      /\bslow\b/,
      /\bweak\b/,
    ]) &&
    analytics.underperformingItems[0]
  ) {
    const item = analytics.underperformingItems[0];

    return {
      summary: `${item.name} is the weakest visible item in the selected ${analytics.range} window, based on sold quantity and revenue from paid orders.`,
      insights: [
        {
          type: 'opportunity',
          severity: item.quantitySold <= 1 ? 'medium' : 'low',
          title: `${item.name} is underperforming`,
          evidence: [
            `${item.name} sold ${item.quantitySold} units for ${formatCurrency(
              item.revenueCents,
            )} revenue.`,
            `${analytics.topItems[0]?.name ?? 'The top item'} is currently ahead in the same range.`,
          ],
          suggestedAction:
            'Review placement, pairing, and promotion before changing the item itself.',
          relatedMenuItemIds: [item.menuItemId],
        },
      ],
    };
  }

  if (
    includesAny(normalized, [/\bbest\b/, /\btop\b/, /\bpopular\b/]) &&
    analytics.topItems[0]
  ) {
    const item = analytics.topItems[0];

    return {
      summary: `${item.name} is the strongest visible item in the selected ${analytics.range} window.`,
      insights: [
        {
          type: 'trend',
          severity: 'low',
          title: `${item.name} leads item demand`,
          evidence: [
            `${item.name} sold ${item.quantitySold} units for ${formatCurrency(
              item.revenueCents,
            )} revenue.`,
          ],
          suggestedAction:
            'Use this item as an anchor for bundles and compare whether sides or drinks attach strongly enough.',
          relatedMenuItemIds: [item.menuItemId],
        },
      ],
    };
  }

  if (
    includesAny(normalized, [
      /\bpayment\b/,
      /\bpaid\b/,
      /\bunpaid\b/,
      /\bfailed\b/,
      /\brefund/,
      /\bcancell?ed\b/,
    ])
  ) {
    const paidCount = getPaymentCount(analytics, 'paid');
    const failedCount = getPaymentCount(analytics, 'failed');
    const cancelledCount = getPaymentCount(analytics, 'cancelled');
    const refundedCount = getPaymentCount(analytics, 'refunded');

    return {
      summary: `Payment outcomes for the selected ${analytics.range} window show ${paidCount} paid, ${failedCount} failed, ${cancelledCount} cancelled, and ${refundedCount} refunded orders.`,
      insights: [
        {
          type:
            failedCount + cancelledCount + refundedCount > 0 ? 'risk' : 'trend',
          severity:
            failedCount + cancelledCount + refundedCount >= 5
              ? 'high'
              : 'medium',
          title: 'Payment outcome mix',
          evidence: [
            `${paidCount} paid orders in the selected range.`,
            `${failedCount} failed, ${cancelledCount} cancelled, and ${refundedCount} refunded outcomes.`,
          ],
          suggestedAction:
            'Compare payment outcomes with Stripe logs and order status changes before changing checkout behavior.',
          relatedMenuItemIds: [],
        },
      ],
    };
  }

  if (activeAlerts && activeAlerts.length > 0) {
    return buildFallbackInsights(analytics, activeAlerts[0]);
  }

  return buildFallbackInsights(analytics);
};

export const buildAdminInsightSystemPromptForTest = () => {
  return [
    'You are Burger Club Admin Insight Agent.',
    'Use only the provided analytics summary.',
    'Do not invent revenue, order counts, prices, menu item ids, or payment data.',
    'All money values are AUD cents; when writing money, use AUD or A$, never USD.',
    'Do not write cents in user-facing summaries, evidence, titles, or suggested actions; convert cents to A$ amounts.',
    'Return operational insight cards for a restaurant admin.',
    'Every insight must include evidence from the provided analytics.',
    'Do not propose automatically changing menu items, prices, payments, or orders.',
    'Return only JSON with summary and insights.',
  ].join(' ');
};

const buildDisplayAnalytics = (analytics: AdminAnalyticsSummary) => ({
  revenue: formatCurrency(analytics.revenueCents),
  averageOrderValue: formatCurrency(analytics.averageOrderValueCents),
  categorySales: analytics.categorySales.map((category) => ({
    category: category.category,
    quantitySold: category.quantitySold,
    revenue: formatCurrency(category.revenueCents),
  })),
  topItems: analytics.topItems.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    quantitySold: item.quantitySold,
    revenue: formatCurrency(item.revenueCents),
  })),
  underperformingItems: analytics.underperformingItems.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    quantitySold: item.quantitySold,
    revenue: formatCurrency(item.revenueCents),
  })),
});

const buildDisplayAlert = (alert?: AnalyticsAlert) =>
  alert
    ? {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        evidence: alert.evidence,
        metricValue: alert.metricValue,
        threshold: alert.threshold,
        range: alert.range,
      }
    : undefined;

const buildDisplayOrderEvidence = (
  orderEvidence?: AdminInsightResponsePayload['orderEvidence'],
) =>
  orderEvidence?.map((order) => ({
    orderId: order.orderId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: formatCurrency(order.totalCents),
    itemCount: order.itemCount,
    items: order.items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

export const buildAdminInsightUserPromptForTest = ({
  question,
  analytics,
  alert,
  activeAlerts,
  orderEvidence,
  selectedTools,
}: {
  question: string;
  analytics: AdminAnalyticsSummary;
  alert?: AnalyticsAlert;
  activeAlerts?: AnalyticsAlert[];
  orderEvidence?: AdminInsightResponsePayload['orderEvidence'];
  selectedTools?: string[];
}) => {
  return JSON.stringify({
    question,
    selectedTools,
    alert,
    activeAlerts,
    orderEvidence,
    analytics,
    displayAlert: buildDisplayAlert(alert),
    displayOrderEvidence: buildDisplayOrderEvidence(orderEvidence),
    displayAnalytics: buildDisplayAnalytics(analytics),
    currencyInstruction:
      'Analytics contains raw AUD cents for backend precision. Use displayAnalytics for user-facing money. Never write cents or USD in summary, evidence, titles, or suggested actions.',
    alertInstruction: alert
      ? 'Investigate the provided alert. Explain what the backend evidence supports, what it does not prove, and what the admin should check next. Do not claim customer intent or causes that are not supported by analytics.'
      : undefined,
    chatInstruction: selectedTools
      ? 'Answer the admin question using the selected backend tool results. If the available tools do not prove a cause, say what the data supports and what remains unknown.'
      : undefined,
    orderEvidenceInstruction: orderEvidence
      ? 'The provided orderEvidence is a restricted admin tool result. You may summarize these orders by id, status, payment status, total, item count, items, and timestamps. Do not invent customer identity, private contact details, addresses, or payment secrets.'
      : undefined,
    outputShape: {
      summary: 'short executive summary',
      insights: [
        {
          type: 'opportunity | risk | trend',
          severity: 'low | medium | high',
          title: 'short title',
          evidence: ['specific metric-backed evidence'],
          suggestedAction: 'admin-safe recommendation',
          relatedMenuItemIds: [
            'ids from topItems or underperformingItems only',
          ],
        },
      ],
    },
  });
};

export const openAiAdminInsightClient: AdminInsightModelClient = async (
  input,
) => {
  if (!env.OPENAI_API_KEY) {
    return {
      content: input.selectedTools
        ? buildChatFallbackInsights(input)
        : buildFallbackInsights(
            input.analytics,
            input.alert,
            input.orderEvidence,
          ),
      modelUsed: FALLBACK_MODEL,
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildAdminInsightSystemPromptForTest() },
        { role: 'user', content: buildAdminInsightUserPromptForTest(input) },
      ],
    }),
  });

  if (!response.ok) {
    appLogger.warn('admin_insight_openai_unavailable_fallback', {
      status: response.status,
    });

    return {
      content: input.selectedTools
        ? buildChatFallbackInsights(input)
        : buildFallbackInsights(
            input.analytics,
            input.alert,
            input.orderEvidence,
          ),
      modelUsed: FALLBACK_MODEL,
    };
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
    };
  };
  const content = body.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI response did not include insight content');
  }

  return {
    content: AdminInsightResponseSchema.parse(JSON.parse(content)),
    modelUsed: env.OPENAI_MODEL,
    usage: {
      inputTokens: body.usage?.prompt_tokens,
      outputTokens: body.usage?.completion_tokens,
    },
  };
};

let adminInsightModelClient = openAiAdminInsightClient;

export const setAdminInsightModelClientForTest = (
  client: AdminInsightModelClient,
) => {
  adminInsightModelClient = client;
};

export const resetAdminInsightModelClientForTest = () => {
  adminInsightModelClient = openAiAdminInsightClient;
};

export const generateAdminInsights = async (
  payload: AdminInsightRequestPayload,
  actor: Pick<AuthenticatedUser, 'id'>,
) => {
  const startMs = nowMs();
  const toolStartMs = nowMs();
  const question =
    payload.question?.trim() ||
    'Identify the most important restaurant operations insights.';

  let analytics: AdminAnalyticsSummary | null = null;
  let toolLatencyMs = 0;

  try {
    analytics = await getAdminAnalyticsSummary(payload.range);
    toolLatencyMs = nowMs() - toolStartMs;

    const modelResult = await adminInsightModelClient({
      question,
      analytics,
    });
    const parsed = AdminInsightResponseSchema.parse(modelResult.content);
    const latencyMs = nowMs() - startMs;
    const agentRun = await agentRunRepository.create({
      agentName: ADMIN_INSIGHT_AGENT,
      actorId: actor.id,
      prompt: question,
      model: modelResult.modelUsed,
      toolsUsed: [ADMIN_INSIGHT_TOOL],
      toolCalls: [
        {
          name: ADMIN_INSIGHT_TOOL,
          status: 'success',
          latencyMs: toolLatencyMs,
        },
      ],
      latencyMs,
      estimatedCostCents: estimateCostCents(modelResult.usage),
      status: 'success',
    });

    return {
      ...parsed,
      analytics,
      run: {
        id: String(agentRun._id),
        agentName: ADMIN_INSIGHT_AGENT,
        model: modelResult.modelUsed,
        toolsUsed: [ADMIN_INSIGHT_TOOL],
        latencyMs,
        estimatedCostCents: agentRun.estimatedCostCents,
        status: 'success' as const,
      },
    };
  } catch (error) {
    const latencyMs = nowMs() - startMs;
    const failureReason =
      error instanceof Error ? error.message : String(error);

    try {
      await agentRunRepository.create({
        agentName: ADMIN_INSIGHT_AGENT,
        actorId: actor.id,
        prompt: question,
        model: env.OPENAI_API_KEY ? env.OPENAI_MODEL : FALLBACK_MODEL,
        toolsUsed: analytics ? [ADMIN_INSIGHT_TOOL] : [],
        toolCalls: analytics
          ? [
              {
                name: ADMIN_INSIGHT_TOOL,
                status: 'success',
                latencyMs: toolLatencyMs,
              },
            ]
          : [],
        latencyMs,
        status: 'failed',
        failureReason,
      });
    } catch (loggingError) {
      appLogger.error('admin_insight_agent_run_log_failed', {
        error: loggingError,
      });
    }

    appLogger.error('admin_insight_generation_failed', { error });
    throw new AppError(
      'Could not generate admin insights. Please try again later.',
      503,
    );
  }
};

export const chatWithAdminInsightAgent = async (
  payload: AdminInsightChatRequestPayload,
  actor: Pick<AuthenticatedUser, 'id'>,
) => {
  const startMs = nowMs();
  const analyticsStartMs = nowMs();
  const question = payload.question.trim();
  const selectedTools = selectAdminChatTools(question);

  let analytics: AdminAnalyticsSummary | null = null;
  let analyticsLatencyMs = 0;
  let activeAlerts: AnalyticsAlert[] | undefined;
  let alertLatencyMs = 0;
  let orderEvidence: AdminInsightResponsePayload['orderEvidence'];
  let orderEvidenceLatencyMs = 0;

  try {
    analytics = await getAdminAnalyticsSummary(payload.range);
    analyticsLatencyMs = nowMs() - analyticsStartMs;

    if (selectedTools.includes(ADMIN_ALERT_TOOL)) {
      const alertStartMs = nowMs();
      activeAlerts = await detectAnalyticsAlerts(payload.range);
      alertLatencyMs = nowMs() - alertStartMs;
    }

    const requestedStatus = getRequestedOrderStatus(question);

    if (requestedStatus && selectedTools.includes(ADMIN_ORDER_STATUS_TOOL)) {
      const orderEvidenceStartMs = nowMs();
      orderEvidence = await getOrdersByStatusEvidence(requestedStatus);
      orderEvidenceLatencyMs = nowMs() - orderEvidenceStartMs;
    }

    const modelResult = await adminInsightModelClient({
      question,
      analytics,
      activeAlerts,
      orderEvidence,
      selectedTools,
    });
    const parsed = AdminInsightResponseSchema.parse(modelResult.content);
    const latencyMs = nowMs() - startMs;
    const agentRun = await agentRunRepository.create({
      agentName: ADMIN_INSIGHT_AGENT,
      actorId: actor.id,
      prompt: question,
      model: modelResult.modelUsed,
      toolsUsed: selectedTools,
      toolCalls: [
        ...buildLogicalAnalyticsToolCalls(selectedTools, analyticsLatencyMs),
        ...(selectedTools.includes(ADMIN_ALERT_TOOL)
          ? [
              {
                name: ADMIN_ALERT_TOOL,
                status: 'success' as const,
                latencyMs: alertLatencyMs,
              },
            ]
          : []),
        ...(selectedTools.includes(ADMIN_ORDER_STATUS_TOOL) && orderEvidence
          ? [
              {
                name: ADMIN_ORDER_STATUS_TOOL,
                status: 'success' as const,
                latencyMs: orderEvidenceLatencyMs,
              },
            ]
          : []),
      ],
      latencyMs,
      estimatedCostCents: estimateCostCents(modelResult.usage),
      status: 'success',
    });

    return {
      ...parsed,
      analytics,
      alert: activeAlerts?.[0],
      orderEvidence,
      run: {
        id: String(agentRun._id),
        agentName: ADMIN_INSIGHT_AGENT,
        model: modelResult.modelUsed,
        toolsUsed: selectedTools,
        latencyMs,
        estimatedCostCents: agentRun.estimatedCostCents,
        status: 'success' as const,
      },
    };
  } catch (error) {
    const latencyMs = nowMs() - startMs;
    const failureReason =
      error instanceof Error ? error.message : String(error);

    try {
      await agentRunRepository.create({
        agentName: ADMIN_INSIGHT_AGENT,
        actorId: actor.id,
        prompt: question,
        model: env.OPENAI_API_KEY ? env.OPENAI_MODEL : FALLBACK_MODEL,
        toolsUsed: analytics ? selectedTools : [],
        toolCalls: analytics
          ? [
              ...buildLogicalAnalyticsToolCalls(
                selectedTools,
                analyticsLatencyMs,
              ),
              ...(activeAlerts
                ? [
                    {
                      name: ADMIN_ALERT_TOOL,
                      status: 'success' as const,
                      latencyMs: alertLatencyMs,
                    },
                  ]
                : []),
              ...(orderEvidence
                ? [
                    {
                      name: ADMIN_ORDER_STATUS_TOOL,
                      status: 'success' as const,
                      latencyMs: orderEvidenceLatencyMs,
                    },
                  ]
                : []),
            ]
          : [],
        latencyMs,
        status: 'failed',
        failureReason,
      });
    } catch (loggingError) {
      appLogger.error('admin_insight_chat_run_log_failed', {
        error: loggingError,
      });
    }

    appLogger.error('admin_insight_chat_failed', { error });
    throw new AppError(
      'Could not answer admin insight question. Please try again later.',
      503,
    );
  }
};

export const investigateAdminAlert = async (
  payload: AdminAlertInvestigationRequestPayload,
  actor: Pick<AuthenticatedUser, 'id'>,
) => {
  const startMs = nowMs();
  const analyticsStartMs = nowMs();
  const question =
    payload.question?.trim() ||
    'Investigate this analytics alert and recommend the next operational check.';

  let analytics: AdminAnalyticsSummary | null = null;
  let analyticsLatencyMs = 0;
  let alertLatencyMs = 0;
  let alert: AnalyticsAlert | null = null;
  let orderEvidence: AdminInsightResponsePayload['orderEvidence'];
  let orderEvidenceLatencyMs = 0;

  try {
    analytics = await getAdminAnalyticsSummary(payload.range);
    analyticsLatencyMs = nowMs() - analyticsStartMs;

    const alertStartMs = nowMs();
    const alerts = await detectAnalyticsAlerts(payload.range);
    alertLatencyMs = nowMs() - alertStartMs;
    alert = alerts.find((item) => item.id === payload.alertId) ?? null;

    if (!alert) {
      throw new ServiceError('Analytics alert is no longer active.', 404);
    }

    const requestedStatus = getRequestedOrderStatus(question);

    if (requestedStatus) {
      const orderEvidenceStartMs = nowMs();
      orderEvidence = await getOrdersByStatusEvidence(requestedStatus);
      orderEvidenceLatencyMs = nowMs() - orderEvidenceStartMs;
    }

    const modelResult = await adminInsightModelClient({
      question,
      analytics,
      alert,
      orderEvidence,
    });
    const parsed = AdminInsightResponseSchema.parse(modelResult.content);
    const latencyMs = nowMs() - startMs;
    const toolsUsed = [
      ADMIN_INSIGHT_TOOL,
      ADMIN_ALERT_TOOL,
      ...(orderEvidence ? [ADMIN_ORDER_STATUS_TOOL] : []),
    ];
    const agentRun = await agentRunRepository.create({
      agentName: ADMIN_INSIGHT_AGENT,
      actorId: actor.id,
      prompt: `${question} Alert: ${alert.id}`,
      model: modelResult.modelUsed,
      toolsUsed,
      toolCalls: [
        {
          name: ADMIN_INSIGHT_TOOL,
          status: 'success',
          latencyMs: analyticsLatencyMs,
        },
        {
          name: ADMIN_ALERT_TOOL,
          status: 'success',
          latencyMs: alertLatencyMs,
        },
        ...(orderEvidence
          ? [
              {
                name: ADMIN_ORDER_STATUS_TOOL,
                status: 'success' as const,
                latencyMs: orderEvidenceLatencyMs,
              },
            ]
          : []),
      ],
      latencyMs,
      estimatedCostCents: estimateCostCents(modelResult.usage),
      status: 'success',
    });

    return {
      ...parsed,
      alert,
      analytics,
      orderEvidence,
      run: {
        id: String(agentRun._id),
        agentName: ADMIN_INSIGHT_AGENT,
        model: modelResult.modelUsed,
        toolsUsed,
        latencyMs,
        estimatedCostCents: agentRun.estimatedCostCents,
        status: 'success' as const,
      },
    };
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    const latencyMs = nowMs() - startMs;
    const failureReason =
      error instanceof Error ? error.message : String(error);

    try {
      await agentRunRepository.create({
        agentName: ADMIN_INSIGHT_AGENT,
        actorId: actor.id,
        prompt: `${question} Alert: ${payload.alertId}`,
        model: env.OPENAI_API_KEY ? env.OPENAI_MODEL : FALLBACK_MODEL,
        toolsUsed: analytics
          ? [ADMIN_INSIGHT_TOOL, ...(alert ? [ADMIN_ALERT_TOOL] : [])]
          : [],
        toolCalls: analytics
          ? [
              {
                name: ADMIN_INSIGHT_TOOL,
                status: 'success',
                latencyMs: analyticsLatencyMs,
              },
              ...(alert
                ? [
                    {
                      name: ADMIN_ALERT_TOOL,
                      status: 'success' as const,
                      latencyMs: alertLatencyMs,
                    },
                  ]
                : []),
            ]
          : [],
        latencyMs,
        status: 'failed',
        failureReason,
      });
    } catch (loggingError) {
      appLogger.error('admin_alert_investigation_run_log_failed', {
        error: loggingError,
      });
    }

    appLogger.error('admin_alert_investigation_failed', { error });
    throw new AppError(
      'Could not investigate analytics alert. Please try again later.',
      503,
    );
  }
};
