export type BashApprovalConfig = {
  allowed: string[];
  splitChains: boolean;
};

export type NotifyLevel = "info" | "error";

export type ApprovalCtx = {
  hasUI: boolean;
  ui: {
    notify: (message: string, level: NotifyLevel) => void;
    select: (
      message: string,
      options: string[],
    ) => Promise<string | null | undefined>;
  };
};

export type PromptOptions = {
  options: string[];
  exactLabel: string;
  prefixLabel: string | null;
  suggested: string | null;
};

export type CommandEvaluation =
  | { allMatch: true }
  | { allMatch: false; failingSegment: string };
