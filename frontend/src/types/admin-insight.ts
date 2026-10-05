import type { AdminAnalyticsSummary, AnalyticsRange } from './admin-dashboard';
import type { AdminAnalyticsAlert } from './admin-dashboard';

export interface AdminInsightCard {
  type: 'opportunity' | 'risk' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  evidence: string[];
  suggestedAction: string;
  relatedMenuItemIds: string[];
}

export interface AdminInsightRun {
  id: string;
  agentName: string;
  model: string;
  toolsUsed: string[];
  latencyMs: number;
  estimatedCostCents?: number;
  status: 'success';
}

export interface AdminInsightOrderEvidence {
  orderId: string;
  status: string;
  paymentStatus?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  totalCents: number;
  itemCount: number;
  items: string[];
  itemCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminInsightDailyBriefFocusArea {
  type: 'opportunity' | 'risk' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  evidence: string[];
  nextCheck: string;
}

export interface AdminInsightDailyBrief {
  date: string;
  headline: string;
  priority: 'low' | 'medium' | 'high';
  focusAreas: AdminInsightDailyBriefFocusArea[];
  nextChecks: string[];
}

export interface AdminInsightResponse {
  summary: string;
  insights: AdminInsightCard[];
  analytics: AdminAnalyticsSummary;
  alert?: AdminAnalyticsAlert;
  orderEvidence?: AdminInsightOrderEvidence[];
  dailyBrief?: AdminInsightDailyBrief;
  run: AdminInsightRun;
}

export interface InvestigateAdminAlertPayload {
  range: AnalyticsRange;
  alertId: string;
  question?: string;
}

export interface ChatWithAdminInsightAgentPayload {
  range: AnalyticsRange;
  question: string;
}
