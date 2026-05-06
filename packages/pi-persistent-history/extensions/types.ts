export type HistoryLine = {
  text: string;
  timestamp: number;
};

export enum InjectionStatus {
  Applied = "applied",
  Unavailable = "unavailable",
  Failed = "failed",
}

export type InjectionResult = {
  status: InjectionStatus;
  message: string;
};

export type RuntimeState = {
  maxEntries: number;
  showStartupMessage: boolean;
  entries: string[];
  loadedSinceTimestampMs: number | null;
  lastInjection: InjectionResult | null;
};
