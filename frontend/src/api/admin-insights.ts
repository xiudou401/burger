import { request } from './request';
import type {
  AdminInsightResponse,
  GenerateAdminInsightsPayload,
} from '../types/admin-insight';

export const generateAdminInsights = (
  payload: GenerateAdminInsightsPayload,
) => {
  return request<AdminInsightResponse>('/admin/insights/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
