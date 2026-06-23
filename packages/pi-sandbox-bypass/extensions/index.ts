import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  createBashTool,
  isToolCallEventType,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

import type { BashApprovalConfig } from "./models";
import {
  applyChoice,
  BLOCKED_BY_USER,
  buildPromptOptions,
  DENY,
  evaluateCommand,
  loadConfig,
} from "./utils";

const FULL_PERMISSION_TOOL_NAME = "bash_full_permissions";
const FULL_PERMISSION_SYSTEM_PROMPT =
  "Always prefer `bash` for commands. If a `bash` command fails because the sandbox or permissions blocked it, retry with `bash_full_permissions`. Only use `bash_full_permissions` for that fallback.";

function getPromptTitle(): string {
  return "Approve full-permission bash command?";
}

function getBlockedReason(trimmedCommand: string): string {
  return `Full-permission bash command not on allow-list (configure ~/.pi/agent/.bash-approval; split behavior in ~/.pi/agent/settings.json): ${trimmedCommand}`;
}

export default function (pi: ExtensionAPI) {
  let config: BashApprovalConfig = loadConfig();
  const bashTool = createBashTool(process.cwd());

  pi.registerCommand("bash-approval-reload", {
    description:
      "Reload bash approval rules from ~/.pi/agent/.bash-approval and settings from ~/.pi/agent/settings.json",
    // eslint-disable-next-line @typescript-eslint/require-await -- API requires Promise<void>
    handler: async (_args, ctx) => {
      config = loadConfig();
      ctx.ui.notify(
        `Reloaded ${config.allowed.length} bash approval rule(s)`,
        "info",
      );
    },
  });

  pi.registerCommand("bash-approval-list", {
    description: "Show currently allowed bash command patterns",
    // eslint-disable-next-line @typescript-eslint/require-await -- API requires Promise<void>
    handler: async (_args, ctx) => {
      if (config.allowed.length === 0) {
        ctx.ui.notify("No bash approval rules configured", "info");
        return;
      }

      ctx.ui.notify(
        `Allowed bash patterns:\n  - ${config.allowed.join("\n  - ")}`,
        "info",
      );
    },
  });

  pi.registerTool({
    name: FULL_PERMISSION_TOOL_NAME,
    label: "bash_fp",
    description:
      "Execute a bash command without Pi's sandbox wrapper. Use only after a normal bash command failed because the sandbox or permissions blocked it.",
    promptSnippet: "Execute a bash command without Pi's sandbox wrapper",
    promptGuidelines: [
      "Use bash_full_permissions only after bash failed because the sandbox or permissions blocked the command.",
      "Always prefer bash to start; use bash_full_permissions only for the approved fallback.",
    ],
    parameters: bashTool.parameters,
    renderCall(args, theme, _context) {
      return new Text(
        `${theme.fg("toolTitle", theme.bold("bash_fp: "))}${theme.fg("accent", String(args.command ?? ""))}`,
        0,
        0,
      );
    },
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return createBashTool(ctx.cwd).execute(
        toolCallId,
        params,
        signal,
        onUpdate,
      );
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType(FULL_PERMISSION_TOOL_NAME, event)) {
      return;
    }

    const command = String(event.input.command ?? "");
    const trimmedCommand = command.trim();

    if (!trimmedCommand) {
      return;
    }

    const evaluation = evaluateCommand(command, config);

    if (evaluation.allMatch) {
      return;
    }

    const { failingSegment } = evaluation;

    if (!ctx.hasUI) {
      return {
        block: true,
        reason: getBlockedReason(trimmedCommand),
      };
    }

    const prompt = buildPromptOptions(trimmedCommand, failingSegment, config);

    const choice = await ctx.ui.select(
      `${getPromptTitle()}\n\n  ${trimmedCommand}`,
      prompt.options,
    );

    if (!choice || choice === DENY) {
      return { block: true, reason: BLOCKED_BY_USER };
    }

    applyChoice(choice, prompt, config, ctx);
  });
}
