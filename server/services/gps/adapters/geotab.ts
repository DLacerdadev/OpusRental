import { GpsAdapter, NormalizedGpsData } from "./base";

export class GeotabAdapter implements GpsAdapter {
  validate(rawData: any): boolean {
    return (
      rawData &&
      rawData.latitude !== undefined &&
      rawData.longitude !== undefined &&
      rawData.dateTime
    );
  }

  normalize(rawData: any): NormalizedGpsData {
    return {
      latitude: rawData.latitude,
      longitude: rawData.longitude,
      speed: rawData.speed,
      heading: rawData.bearing,
      timestamp: new Date(rawData.dateTime),
      status: this.mapStatus(rawData.engineStatus),
      odometer: rawData.odometer,
      engineHours: rawData.engineHours,
      address: rawData.address,
    };
  }

  private mapStatus(engineStatus?: string): string {
    if (!engineStatus) return "unknown";
    return engineStatus === "Running" ? "active" : "idle";
  }
}
