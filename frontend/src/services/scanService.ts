import { api } from './api';
import {
  ScanDetail,
  ScanSummary,
  RescanComparison,
  EducationalSample
} from '../types/scan';

export const scanService = {
  async submitScanJson(code: string, fileName = 'snippet.py', language = 'python'): Promise<ScanDetail> {
    const res = await api.post<ScanDetail>('/scans', {
      code,
      file_name: fileName,
      language,
    });
    return res.data;
  },

  async submitScanFile(file: File, language = 'python'): Promise<ScanDetail> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const res = await api.post<ScanDetail>('/scans/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async listScans(skip = 0, limit = 50, language?: string): Promise<ScanSummary[]> {
    const params: Record<string, any> = { skip, limit };
    if (language) params.language = language;
    const res = await api.get<ScanSummary[]>('/scans', { params });
    return res.data;
  },

  async getScan(scanId: string): Promise<ScanDetail> {
    const res = await api.get<ScanDetail>(`/scans/${scanId}`);
    return res.data;
  },

  async deleteScan(scanId: string): Promise<void> {
    await api.delete(`/scans/${scanId}`);
  },

  async rescanCode(scanId: string, code: string): Promise<RescanComparison> {
    const res = await api.post<RescanComparison>(`/scans/${scanId}/rescan`, { code });
    return res.data;
  },

  async getSamples(): Promise<EducationalSample[]> {
    const res = await api.get<EducationalSample[]>('/samples');
    return res.data;
  },

  async getSampleContent(sampleId: string): Promise<EducationalSample> {
    const res = await api.get<EducationalSample>(`/samples/${sampleId}`);
    return res.data;
  },
};
