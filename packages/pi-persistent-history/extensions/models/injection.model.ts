import type { InjectionStatus } from "./injection-status.enum";

export type InjectionResult = {
  readonly status: InjectionStatus;
  readonly message: string;
};
