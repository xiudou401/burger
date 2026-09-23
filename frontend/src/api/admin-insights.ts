import { request } from './request';
import type {
  AdminInsightResponse,
  ChatWithAdminInsightAgentPayload,
  InvestigateAdminAlertPayload,
} from '../types/admin-insight';

export const investigateAdminAlert = (
  payload: InvestigateAdminAlertPayload,
) => {
  return request<AdminInsightResponse>('/admin/insights/alert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const chatWithAdminInsightAgent = (
  payload: ChatWithAdminInsightAgentPayload,
) => {
  return request<AdminInsightResponse>('/admin/insights/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const generateAdminDailyBrief = () => {
  return request<AdminInsightResponse>('/admin/insights/daily-brief', {
    method: 'POST',
  });
};
