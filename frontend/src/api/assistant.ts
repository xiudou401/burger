import { request } from './request';
import type { AssistantChatResponse } from '../types/assistant';

export const chatWithMenuAssistant = (message: string) => {
  return request<AssistantChatResponse>('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
    skipAuth: true,
  });
};
