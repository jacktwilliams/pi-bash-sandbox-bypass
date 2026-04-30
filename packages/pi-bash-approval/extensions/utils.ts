import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type {
  ApprovalCtx,
  BashApprovalConfig,
  CommandEvaluation,
  PromptOptions,
} from "./types";

const CONFIG_DIR = path.join(os.homedir(), ".pi", "agent");
const CONFIG_PATH = path.join(CONFIG_DIR, "bash-approval.json");

const DEFAULT_CONFIG: BashApprovalConfig = {
  allowed: [],
  splitChains: true,
};

const PREFIX_GLOB_SUFFIX_LENGTH = 2;
const TRAILING_GLOB_SUFFIX_LENGTH = 1;
const EXACT_LABEL_COMMAND_MAX_LENGTH = 60;

const ALLOW_ONCE = "Allow once";
export const DENY = "Deny";
export const BLOCKED_BY_USER = "Blocked by user";

function truncateForLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
}

function errnoCode(error: unknown): string | undefined {
  if (error instanceof Error) {
    return (error as NodeJS.ErrnoException).code;
  }

  return;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function parseConfig(raw: string): BashApprovalConfig {
  const parsed = JSON.parse(raw) as Partial<BashApprovalConfig>;

  const allowed = Array.isArray(parsed.allowed)
    ? parsed.allowed.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];

  return {
    allowed,
    splitChains: parsed.splitChains !== false,
  };
}

function writeDefaultConfigFile(): void {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(
      CONFIG_PATH,
      `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`,
      "utf8",
    );
  } catch {
    // Best effort; the caller falls back to in-memory defaults.
  }
}

export function loadConfig(): BashApprovalConfig {
  try {
    return parseConfig(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (error: unknown) {
    if (errnoCode(error) === "ENOENT") {
      writeDefaultConfigFile();
    }

    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config: BashApprovalConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function matchesPrefixGlob(command: string, pattern: string): boolean {
  const prefix = pattern.slice(0, -PREFIX_GLOB_SUFFIX_LENGTH).trim();

  if (!prefix) {
    return false;
  }

  return command === prefix || command.startsWith(`${prefix} `);
}

function matchesPattern(command: string, pattern: string): boolean {
  const trimmedCommand = command.trim();
  const trimmedPattern = pattern.trim();

  if (!trimmedPattern) {
    return false;
  }

  if (trimmedPattern.endsWith(":*")) {
    return matchesPrefixGlob(trimmedCommand, trimmedPattern);
  }

  if (trimmedPattern.endsWith("*")) {
    const prefix = trimmedPattern.slice(0, -TRAILING_GLOB_SUFFIX_LENGTH);

    return trimmedCommand.startsWith(prefix);
  }

  return trimmedCommand === trimmedPattern;
}

type SplitState = {
  current: string;
  parts: string[];
  quote: '"' | "'" | null;
};

function isDoubleSeparator(
  char: string,
  nextChar: string | undefined,
): boolean {
  return (
    (char === "&" && nextChar === "&") || (char === "|" && nextChar === "|")
  );
}

function isSingleSeparator(char: string): boolean {
  return char === ";" || char === "|" || char === "\n";
}

function flushSegment(state: SplitState): void {
  state.parts.push(state.current);
  state.current = "";
}

function stepInsideQuote(
  char: string,
  nextChar: string | undefined,
  state: SplitState,
): number {
  if (char === "\\" && nextChar !== undefined) {
    state.current += `${char}${nextChar}`;
    return 2;
  }

  if (char === state.quote) {
    state.quote = null;
  }

  state.current += char;
  return 1;
}

function stepOutsideQuote(
  char: string,
  nextChar: string | undefined,
  state: SplitState,
): number {
  if (char === '"' || char === "'") {
    state.quote = char;
    state.current += char;
    return 1;
  }

  if (isDoubleSeparator(char, nextChar)) {
    flushSegment(state);
    return 2;
  }

  if (isSingleSeparator(char)) {
    flushSegment(state);
    return 1;
  }

  state.current += char;
  return 1;
}

function splitCommand(command: string): string[] {
  const state: SplitState = { current: "", parts: [], quote: null };
  let index = 0;

  while (index < command.length) {
    const char = command.at(index) ?? "";
    const nextChar = command.at(index + 1);

    index += state.quote
      ? stepInsideQuote(char, nextChar, state)
      : stepOutsideQuote(char, nextChar, state);
  }

  if (state.current.trim()) {
    state.parts.push(state.current);
  }

  return state.parts.map((part) => part.trim()).filter(Boolean);
}

function suggestPrefixPattern(command: string): string | null {
  const tokens = command.trim().split(/\s+/).filter(Boolean);
  const firstToken = tokens.at(0);

  if (!firstToken) {
    return null;
  }

  const secondToken = tokens.at(1);

  if (secondToken) {
    return `${firstToken} ${secondToken}:*`;
  }

  return `${firstToken}:*`;
}

function firstFailingSegment(
  segments: readonly string[],
  rules: readonly string[],
): string | null {
  return (
    segments.find(
      (segment) => !rules.some((rule) => matchesPattern(segment, rule)),
    ) ?? null
  );
}

export function evaluateCommand(
  command: string,
  config: BashApprovalConfig,
): CommandEvaluation {
  const trimmedCommand = command.trim();
  const segments = config.splitChains
    ? splitCommand(command)
    : [trimmedCommand];

  if (segments.length === 0) {
    return { allMatch: false, failingSegment: trimmedCommand };
  }

  const failingSegment = firstFailingSegment(segments, config.allowed);

  if (!failingSegment) {
    return { allMatch: true };
  }

  return { allMatch: false, failingSegment };
}

export function buildPromptOptions(
  trimmedCommand: string,
  failingSegment: string,
  config: BashApprovalConfig,
): PromptOptions {
  const exactLabel = `Allow always (exact): ${truncateForLabel(
    trimmedCommand,
    EXACT_LABEL_COMMAND_MAX_LENGTH,
  )}`;

  const suggested = suggestPrefixPattern(failingSegment);
  const prefixLabel =
    suggested &&
    suggested !== trimmedCommand &&
    !config.allowed.includes(suggested)
      ? `Allow always: ${suggested}`
      : null;

  const options: string[] = [ALLOW_ONCE];

  if (!config.allowed.includes(trimmedCommand)) {
    options.push(exactLabel);
  }

  if (prefixLabel) {
    options.push(prefixLabel);
  }

  options.push(DENY);

  return { options, exactLabel, prefixLabel, suggested };
}

function persistRule(
  config: BashApprovalConfig,
  rule: string,
  ctx: ApprovalCtx,
): void {
  if (config.allowed.includes(rule)) {
    return;
  }

  config.allowed.push(rule);

  try {
    saveConfig(config);
    ctx.ui.notify(`Added rule: ${rule}`, "info");
  } catch (error: unknown) {
    ctx.ui.notify(`Failed to persist rule: ${errorMessage(error)}`, "error");
  }
}

export function applyChoice(
  choice: string,
  trimmedCommand: string,
  prompt: PromptOptions,
  config: BashApprovalConfig,
  ctx: ApprovalCtx,
): void {
  if (choice === prompt.exactLabel) {
    persistRule(config, trimmedCommand, ctx);
    return;
  }

  if (prompt.prefixLabel && choice === prompt.prefixLabel && prompt.suggested) {
    persistRule(config, prompt.suggested, ctx);
  }
}
