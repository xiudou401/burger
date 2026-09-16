import type { MenuItemCategory } from './menu-item';

export interface AssistantRecommendation {
  id: string;
  name: string;
  category: MenuItemCategory;
  priceCents: number;
  description?: string;
  isAvailable: true;
  reason?: string;
}

export interface AssistantChatResponse {
  reply: string;
  recommendations: AssistantRecommendation[];
  refused: boolean;
  safetyFlags: string[];
}
