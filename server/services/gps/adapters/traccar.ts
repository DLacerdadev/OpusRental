import { GpsAdapter, NormalizedGpsData } from "./base";

export class TraccarAdapter implements GpsAdapter {
  validate(rawData: any): boolean {
    return (
      rawData &&
      rawData.position &&
      rawData.position.latitude !== undefined &&
      rawData.position.longitude !== undefined &&
      (rawData.position.fixTime || rawData.position.deviceTime)
    );
  }

  normalize(rawData: any): NormalizedGpsData {
    const position = rawData.position;
    const attributes = position.attributes || {};
    
    return {
      latitude: position.latitude,
      longitude: position.longitude,
      speed: position.speed,
      heading: position.course,
      timestamp: new Date(position.fixTime || position.deviceTime),
      status: this.mapStatus(attributes.ignition, position.speed),
      odometer: attributes.totalDistance ? attributes.totalDistance / 1609.34 : undefined,
      engineHours: attributes.hours,
      address: position.address,
    };
  }

  private mapStatus(ignition?: boolean, speed?: number): string {
    if (ignition === undefined) return "unknown";
    if (ignition && speed && speed > 0) return "active";
    if (ignition && (!speed || speed === 0)) return "idle";
    return "stopped";
  }
}
