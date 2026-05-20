import type {
  ExtensionAPI,
  PackageSource,
  Theme,
} from "@earendil-works/pi-coding-agent";

export type WelcomeExtensionAPI = Pick<ExtensionAPI, "exec" | "getCommands">;

export type { PackageSource, Theme };
