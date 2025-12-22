import { fetchApi } from './client';
import type { SimulationRequest } from '../types';

export const simulationApi = {
  updateCrowd: (request: SimulationRequest) =>
    fetchApi<{ success: boolean; message: string; updatedZones: number }>('/simulate/crowd', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
