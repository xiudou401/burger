import { request } from './request';
import type {
  AdminInsightResponse,
  GenerateAdminInsightsPayload,
  InvestigateAdminAlertPayload,
} from '../types/admin-insight';

export const generateAdminInsights = (
  payload: GenerateAdminInsightsPayload,
) => {
  return request<AdminInsightResponse>('/admin/insights/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const investigateAdminAlert = (
  payload: InvestigateAdminAlertPayload,
) => {
  return request<AdminInsightResponse>('/admin/insights/alert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
