import { api } from './api';
import { AIExplanation, AIFixResponse } from '../types/scan';

export const aiService = {
  async explainFinding(findingId: string): Promise<AIExplanation> {
    const res = await api.post<AIExplanation>(`/findings/${findingId}/explain`);
    return res.data;
  },

  async suggestFix(findingId: string, sourceContext: string): Promise<AIFixResponse> {
    const res = await api.post<AIFixResponse>(`/findings/${findingId}/suggest-fix`, {
      source_context: sourceContext,
    });
    return res.data;
  },
};
