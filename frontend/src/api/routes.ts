import { fetchApi } from './client';
import type { RouteRequest, RouteResponse } from '../types';

export const routeApi = {
  calculateRoute: (request: RouteRequest) =>
    fetchApi<RouteResponse>('/routes', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
