import type { AgentToolResult } from "@earendil-works/pi-coding-agent";

export type SelectOption = {
  readonly label: string;
  readonly description?: string;
};

export type UserSelectInput = {
  readonly question: string;
  readonly options: readonly SelectOption[];
  readonly allowCustom?: boolean;
};

export type UserSelectDetails = {
  readonly question: string;
  readonly options: readonly string[];
  readonly answer: string | null;
  readonly wasCustom: boolean;
  readonly cancelled: boolean;
};

export type ExecuteResult = AgentToolResult<UserSelectDetails>;
