import { fetchApi } from './client';
import type { Report } from '../types';

export const reportApi = {
  getAllReports: () => fetchApi<Report[]>('/reports'),
  
  createReport: (report: Report) =>
    fetchApi<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    }),
};
