export interface Location {
  lat: number;
  lng: number;
}

export interface Zone {
  id: string;
  name: string;
  capacity: number;
  location: Location;
  type: string;
  currentCount: number;
  crowdPercentage?: number;
  crowdLevel?: string;
}

export interface Report {
  id?: string;
  zoneId: string;
  zoneName?: string;
  issue: string;
  description: string;
  reportedBy: string;
  timestamp?: string;
  status?: string;
}

export interface RouteRequest {
  startZoneId: string;
  endZoneId: string;
  avoidCrowded: boolean;
}

export interface RouteAlternative {
  name: string;
  estimatedTime: number;
  crowdLevel: string;
}

export interface RouteResponse {
  path: Zone[];
  estimatedTime: number;
  crowdLevel: string;
  alternatives?: RouteAlternative[];
}

export interface SimulationRequest {
  zoneCounts: Record<string, number>;
}
