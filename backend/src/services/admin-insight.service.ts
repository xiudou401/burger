import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import { agentRunRepository } from '../repositories/agent-run.repository';
import {
  getAdminAnalyticsSummary,
  type AdminAnalyticsSummary,
} from './admin-dashboard.service';
import {
  AdminInsightResponseSchema,
  type AdminInsightRequestPayload,
  type AdminInsightResponsePayload,
} from '../validation/admin-insight.schema';
import type { AuthenticatedUser } from '../types/auth';
import { appLogger } from '../utils/logger';

const ADMIN_INSIGHT_AGENT = 'admin_insight_agent';
const ADMIN_INSIGHT_TOOL = 'getAdminAnalyticsSummary';
const FALLBACK_MODEL = 'deterministic-fallback';

interface ModelUsage {
  inputTokens?: number;
  outputTokens?: number;
}

interface InsightModelResult {
  content: AdminInsightResponsePayload;
  usage?: ModelUsage;
}

type AdminInsightModelClient = (input: {
  question: string;
  analytics: AdminAnalyticsSummary;
}) => Promise<InsightModelResult>;

const nowMs = () => Date.now();

const formatCurrency = (valueCents: number) =>
  `$${(valueCents / 100).toFixed(2)}`;

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
): AdminInsightResponsePayload => {
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

const buildSystemPrompt = () => {
  return [
    'You are Burger Club Admin Insight Agent.',
    'Use only the provided analytics summary.',
    'Do not invent revenue, order counts, prices, menu item ids, or payment data.',
    'Return operational insight cards for a restaurant admin.',
    'Every insight must include evidence from the provided analytics.',
    'Do not propose automatically changing menu items, prices, payments, or orders.',
    'Return only JSON with summary and insights.',
  ].join(' ');
};

const buildUserPrompt = ({
  question,
  analytics,
}: {
  question: string;
  analytics: AdminAnalyticsSummary;
}) => {
  return JSON.stringify({
    question,
    analytics,
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
      content: buildFallbackInsights(input.analytics),
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
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
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
      model: env.OPENAI_API_KEY ? env.OPENAI_MODEL : FALLBACK_MODEL,
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
        model: env.OPENAI_API_KEY ? env.OPENAI_MODEL : FALLBACK_MODEL,
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
