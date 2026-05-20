export type PersistentHistorySettings = {
  readonly maxEntries?: unknown;
  readonly showStartupMessage?: unknown;
};

export type GlobalPersistentHistoryConfig = {
  readonly maxEntries: number;
  readonly showStartupMessage: boolean;
};

export type GlobalSettings = {
  readonly persistentHistory?: PersistentHistorySettings;
};
