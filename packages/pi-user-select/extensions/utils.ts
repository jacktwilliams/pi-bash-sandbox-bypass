import { Type } from "typebox";

import type {
  ExecuteResult,
  SelectOption,
  UserSelectDetails,
  UserSelectInput,
} from "./types";

const CUSTOM_ANSWER_LABEL = "(Type custom answer)";
const DISPLAY_INDEX_OFFSET = 1;

const CANCELLED_TEXT = "User cancelled the selection";
const EMPTY_CUSTOM_TEXT = "User submitted an empty custom answer";

const OptionSchema = Type.Object({
  label: Type.String({ description: "Display label for the option" }),
  description: Type.Optional(
    Type.String({
      description: "Optional short description shown next to the label",
    }),
  ),
});

export const UserSelectParamsSchema = Type.Object({
  question: Type.String({
    description: "The question or prompt shown to the user",
  }),
  options: Type.Array(OptionSchema, {
    description: "Mutually exclusive choices the user can pick from",
    minItems: 1,
  }),
  allowCustom: Type.Optional(
    Type.Boolean({
      description:
        "When true, also offer a free-text 'Type custom answer' entry",
    }),
  ),
});

export function getCustomAnswerLabel(): string {
  return CUSTOM_ANSWER_LABEL;
}

export function wasCancelled(
  choice: string | null | undefined,
): choice is null | undefined {
  return choice === undefined || choice === null;
}

function formatOptionLabel(option: SelectOption, index: number): string {
  const { label, description } = option;
  const head = `${index + DISPLAY_INDEX_OFFSET}. ${label}`;

  if (description) {
    return `${head} — ${description}`;
  }

  return head;
}

export function buildDisplayOptions(
  options: SelectOption[],
  allowCustom: boolean,
): string[] {
  const formatted = options.map((option, index) =>
    formatOptionLabel(option, index),
  );

  if (allowCustom) {
    formatted.push(CUSTOM_ANSWER_LABEL);
  }

  return formatted;
}

function makeDetails(
  params: UserSelectInput,
  partial: {
    answer: string | null;
    wasCustom?: boolean;
    cancelled?: boolean;
  },
): UserSelectDetails {
  const { question, options } = params;
  const { answer, wasCustom = false, cancelled = false } = partial;

  return {
    question,
    options: options.map(({ label }) => label),
    answer,
    wasCustom,
    cancelled,
  };
}

export function cancelledResult(
  params: UserSelectInput,
  text: string = CANCELLED_TEXT,
): ExecuteResult {
  return {
    content: [{ type: "text", text }],
    details: makeDetails(params, { answer: null, cancelled: true }),
  };
}

export function customAnswerResult(
  params: UserSelectInput,
  typed: string,
): ExecuteResult {
  const trimmed = typed.trim();

  if (!trimmed) {
    return cancelledResult(params, EMPTY_CUSTOM_TEXT);
  }

  return {
    content: [{ type: "text", text: `User wrote: ${trimmed}` }],
    details: makeDetails(params, { answer: trimmed, wasCustom: true }),
  };
}

export function selectedOptionResult(
  params: UserSelectInput,
  index: number,
  option: SelectOption,
): ExecuteResult {
  return {
    content: [
      {
        type: "text",
        text: `User selected: ${index + DISPLAY_INDEX_OFFSET}. ${option.label}`,
      },
    ],
    details: makeDetails(params, { answer: option.label }),
  };
}

export function resolveSelectedOption(
  toolName: string,
  choice: string,
  displayOptions: string[],
  options: SelectOption[],
): { index: number; option: SelectOption } {
  const index = displayOptions.indexOf(choice);
  const option = index >= 0 ? options.at(index) : undefined;

  if (!option) {
    throw new Error(
      `${toolName}: select returned an unknown option "${choice}"`,
    );
  }

  return { index, option };
}
