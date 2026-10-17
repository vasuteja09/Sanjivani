import { api } from './api';
import { SystemHealth, ScannerStatus } from '../types/scan';

export const systemService = {
  async getHealth(): Promise<SystemHealth> {
    const res = await api.get<SystemHealth>('/health');
    return res.data;
  },

  async getScannerStatus(): Promise<ScannerStatus> {
    const res = await api.get<ScannerStatus>('/scanner/status');
    return res.data;
  },
};
