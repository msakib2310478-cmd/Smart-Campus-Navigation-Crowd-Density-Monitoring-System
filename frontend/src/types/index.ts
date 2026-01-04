export interface Zone {
  name: string;
  capacity: number;
  currentCount: number;
  occupancyPercentage: number;
  crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface User {
  id: number;
  email: string;
  studentId: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  studentId: string;
  fullName: string;
}

export interface LocationUpdate {
  userId: string;
  zoneName: string;
  action: 'ENTER' | 'EXIT';
}
