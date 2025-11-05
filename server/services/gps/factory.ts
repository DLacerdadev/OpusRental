import { GpsAdapter } from "./adapters/base";
import { GenericAdapter } from "./adapters/generic";
import { GeotabAdapter } from "./adapters/geotab";
import { SamsaraAdapter } from "./adapters/samsara";
import { TraccarAdapter } from "./adapters/traccar";

export type GpsProvider = "generic" | "geotab" | "samsara" | "traccar";

export class GpsAdapterFactory {
  private static adapters: Map<GpsProvider, GpsAdapter> = new Map([
    ["generic", new GenericAdapter()],
    ["geotab", new GeotabAdapter()],
    ["samsara", new SamsaraAdapter()],
    ["traccar", new TraccarAdapter()],
  ]);

  static getAdapter(provider: GpsProvider): GpsAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`GPS adapter not found for provider: ${provider}`);
    }
    return adapter;
  }

  static getSupportedProviders(): GpsProvider[] {
    return Array.from(this.adapters.keys());
  }
}
