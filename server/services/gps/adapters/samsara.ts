import { GpsAdapter, NormalizedGpsData } from "./base";

export class SamsaraAdapter implements GpsAdapter {
  validate(rawData: any): boolean {
    return (
      rawData &&
      rawData.gps &&
      rawData.gps.latitude !== undefined &&
      rawData.gps.longitude !== undefined &&
      rawData.time
    );
  }

  normalize(rawData: any): NormalizedGpsData {
    const gps = rawData.gps || {};
    
    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      speed: gps.speedMilesPerHour,
      heading: gps.headingDegrees,
      timestamp: new Date(rawData.time),
      status: this.mapEngineState(rawData.engineState),
      odometer: rawData.obdOdometerMeters ? rawData.obdOdometerMeters / 1609.34 : undefined,
      engineHours: rawData.obdEngineSeconds ? rawData.obdEngineSeconds / 3600 : undefined,
      address: gps.reverseGeo?.formattedLocation,
    };
  }

  private mapEngineState(state?: string): string {
    if (!state) return "unknown";
    switch (state) {
      case "On":
        return "active";
      case "Off":
        return "idle";
      default:
        return "unknown";
    }
  }
}
