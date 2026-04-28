import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const TEXT_X = 0;
const TEXT_Y = 0;
const BOX_WIDTH = 1;
const BOX_HEIGHT = 1;
const SUCCESS_EXIT_CODE = 0;
const NOT_FOUND_INDEX = -1;
const RECENT_COMMITS_COUNT = "5";

export default function (pi: ExtensionAPI) {
  pi.registerMessageRenderer("welcome", (message, _options, theme) => {
    const text = new Text(
      typeof message.content === "string" ? message.content : "Welcome",
      TEXT_X,
      TEXT_Y,
    );
    const box = new Box(BOX_WIDTH, BOX_HEIGHT, (t) =>
      theme.bg("customMessageBg", t),
    );
    box.addChild(text);
    return box;
  });

  pi.on("session_start", async (event, ctx) => {
    if (event.reason !== "startup") {
      return;
    }

    if (!ctx.hasUI) {
      return;
    }

    const t = ctx.ui.theme;
    let output = "";

    const pkgOutput = await buildPackageInfo(ctx.cwd, t);
    if (pkgOutput) {
      output += t.bg(
        "customMessageBg",
        ` ${pkgOutput.trim().replace(/\n/g, "\n ")} `,
      );
    }

    const gitOutput = await buildGitInfo(pi, ctx.cwd, t);
    if (gitOutput) {
      if (output) output += "\n";
      output += t.bg(
        "toolPendingBg",
        ` ${gitOutput.trim().replace(/\n/g, "\n ")} `,
      );
    }

    if (output.trim()) {
      pi.sendMessage({
        customType: "welcome",
        content: output.trim(),
        display: true,
      });
    }
  });
}

async function buildPackageInfo(
  cwd: string,
  t: {
    bold: (s: string) => string;
    italic: (s: string) => string;
    fg: (c: any, s: string) => string;
  },
): Promise<string> {
  let pkgOutput = "";
  const pkgPath = path.join(cwd, "package.json");
  try {
    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as Partial<{
      name: string;
      version: string;
      description: string;
    }>;

    if (pkg.name) {
      pkgOutput += `📦 ${t.bold(t.fg("accent", pkg.name))}${pkg.version ? t.fg("dim", ` v${pkg.version}`) : ""}\n`;
    }
    if (pkg.description) {
      pkgOutput += `${t.italic(pkg.description)}\n`;
    }
  } catch {
    // Ignore missing or invalid package.json
  }
  return pkgOutput;
}

async function buildGitInfo(
  pi: ExtensionAPI,
  cwd: string,
  t: { fg: (c: any, s: string) => string },
): Promise<string> {
  let gitOutput = "";
  try {
    const branchResult = await pi.exec("git", ["branch", "--show-current"], {
      cwd,
    });
    if (branchResult.code !== SUCCESS_EXIT_CODE) {
      return gitOutput;
    }

    const branch = branchResult.stdout.trim();
    if (branch) {
      gitOutput += `🌿 ${t.fg("accent", branch)}\n`;
    }

    const diffResult = await pi.exec("git", ["diff", "--shortstat"], { cwd });
    if (diffResult.code === SUCCESS_EXIT_CODE && diffResult.stdout.trim()) {
      gitOutput += `📊 ${t.fg("warning", diffResult.stdout.trim())}\n`;
    } else {
      gitOutput += `📊 ${t.fg("success", "Clean working directory")}\n`;
    }

    const logResult = await pi.exec(
      "git",
      ["log", "-n", RECENT_COMMITS_COUNT, "--oneline"],
      { cwd },
    );
    if (logResult.code === SUCCESS_EXIT_CODE && logResult.stdout.trim()) {
      gitOutput += "\n📜 Recent Commits:\n";
      gitOutput += logResult.stdout
        .trim()
        .split("\n")
        .map((line) => {
          const spaceIdx = line.indexOf(" ");
          if (spaceIdx === NOT_FOUND_INDEX) {
            return `  ${line}`;
          }
          const hash = line.slice(0, spaceIdx);
          const msg = line.slice(spaceIdx + 1);
          return `  ${t.fg("dim", hash)} ${msg}`;
        })
        .join("\n");
    }
  } catch {
    // Ignore missing git
  }
  return gitOutput;
}
