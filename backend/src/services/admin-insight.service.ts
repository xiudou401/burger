import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import { agentRunRepository } from '../repositories/agent-run.repository';
import {
  getAdminAnalyticsSummary,
  type AdminAnalyticsSummary,
} from './admin-dashboard.service';
import {
  AdminInsightResponseSchema,
  type AdminAlertInvestigationRequestPayload,
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
}) => Promise<InsightModelResult>;

const nowMs = () => Date.now();

const formatCurrency = (valueCents: number) =>
  `A$${(valueCents / 100).toFixed(2)}`;

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

const buildFallbackInsights = (
  analytics: AdminAnalyticsSummary,
  alert?: AnalyticsAlert,
): AdminInsightResponsePayload => {
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

export const buildAdminInsightUserPromptForTest = ({
  question,
  analytics,
  alert,
}: {
  question: string;
  analytics: AdminAnalyticsSummary;
  alert?: AnalyticsAlert;
}) => {
  return JSON.stringify({
    question,
    alert,
    analytics,
    displayAlert: buildDisplayAlert(alert),
    displayAnalytics: buildDisplayAnalytics(analytics),
    currencyInstruction:
      'Analytics contains raw AUD cents for backend precision. Use displayAnalytics for user-facing money. Never write cents or USD in summary, evidence, titles, or suggested actions.',
    alertInstruction: alert
      ? 'Investigate the provided alert. Explain what the backend evidence supports, what it does not prove, and what the admin should check next. Do not claim customer intent or causes that are not supported by analytics.'
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
      content: buildFallbackInsights(input.analytics, input.alert),
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
      content: buildFallbackInsights(input.analytics, input.alert),
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

    const modelResult = await adminInsightModelClient({
      question,
      analytics,
      alert,
    });
    const parsed = AdminInsightResponseSchema.parse(modelResult.content);
    const latencyMs = nowMs() - startMs;
    const toolsUsed = [ADMIN_INSIGHT_TOOL, ADMIN_ALERT_TOOL];
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
      ],
      latencyMs,
      estimatedCostCents: estimateCostCents(modelResult.usage),
      status: 'success',
    });

    return {
      ...parsed,
      alert,
      analytics,
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
