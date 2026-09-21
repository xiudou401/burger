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

export interface AdminInsightResponse {
  summary: string;
  insights: AdminInsightCard[];
  analytics: AdminAnalyticsSummary;
  alert?: AdminAnalyticsAlert;
  run: AdminInsightRun;
}

export interface GenerateAdminInsightsPayload {
  range: AnalyticsRange;
  question?: string;
}

export interface InvestigateAdminAlertPayload {
  range: AnalyticsRange;
  alertId: string;
  question?: string;
}
