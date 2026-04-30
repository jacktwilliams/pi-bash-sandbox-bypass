export const VALID_LEVELS = ["lite", "full", "ultra"] as const;

export type Level = (typeof VALID_LEVELS)[number];

export type CavemanState = {
  readonly enabled: boolean;
  readonly level: Level;
};

export type Result = { ok: true } | { ok: false; reason: string };

export type Exec = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

export type CavemanUi = {
  notify: (message: string, level: "info" | "warning" | "error") => void;
  setStatus: (name: string, value: string) => void;
};
