import { fetchApi } from './client';
import type { Zone } from '../types';

export const zoneApi = {
  getAllZones: () => fetchApi<Zone[]>('/zones'),
  
  getZoneById: (id: string) => fetchApi<Zone>(`/zones/${id}`),
  
  getRecommendations: () => fetchApi<Zone[]>('/zones/recommendations'),
};
