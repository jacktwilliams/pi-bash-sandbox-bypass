import type { Level } from "./level.enum";

export type CavemanState = {
  readonly enabled: boolean;
  readonly level: Level;
};

export type Result =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export type Exec = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

export type CavemanUi = {
  readonly notify: (
    message: string,
    level: "info" | "warning" | "error",
  ) => void;
  readonly setStatus: (name: string, value: string) => void;
};
