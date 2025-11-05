export interface NormalizedGpsData {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  status?: string;
  odometer?: number;
  engineHours?: number;
  address?: string;
}

export interface GpsAdapter {
  normalize(rawData: any): NormalizedGpsData;
  validate(rawData: any): boolean;
}
