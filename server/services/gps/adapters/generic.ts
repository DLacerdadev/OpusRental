import { GpsAdapter, NormalizedGpsData } from "./base";

export class GenericAdapter implements GpsAdapter {
  validate(rawData: any): boolean {
    return (
      rawData &&
      typeof rawData.latitude === "number" &&
      typeof rawData.longitude === "number" &&
      rawData.timestamp
    );
  }

  normalize(rawData: any): NormalizedGpsData {
    return {
      latitude: rawData.latitude,
      longitude: rawData.longitude,
      speed: rawData.speed,
      heading: rawData.heading,
      timestamp: new Date(rawData.timestamp),
      status: rawData.status || "active",
      odometer: rawData.odometer,
      engineHours: rawData.engineHours,
      address: rawData.address,
    };
  }
}
