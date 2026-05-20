import type { InjectionResult } from "./injection.model";

export type RuntimeState = {
  readonly maxEntries: number;
  readonly showStartupMessage: boolean;
  readonly entries: readonly string[];
  readonly loadedSinceTimestampMs: number | null;
  readonly lastInjection: InjectionResult | null;
};
