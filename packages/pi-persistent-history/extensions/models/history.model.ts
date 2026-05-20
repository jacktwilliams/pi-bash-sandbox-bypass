export type HistoryLine = {
  readonly text: string;
  readonly timestamp: number;
};

export type ParsedHistoryLine = {
  readonly text: string;
  readonly timestampMs: number | null;
};
