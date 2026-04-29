import type { ExtensionAPI, Theme } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const TEXT_X = 0;
const TEXT_Y = 0;
const BOX_WIDTH = 1;
const BOX_HEIGHT = 1;
const SUCCESS_EXIT_CODE = 0;
const RECENT_COMMITS_COUNT = 5;

type PackageConfig = {
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
};

export default function (pi: ExtensionAPI): void {
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

    const { hasUI, ui, cwd } = ctx;

    if (!hasUI) {
      return;
    }

    const { theme } = ui;
    const [pkgOutput, gitOutput] = await Promise.all([
      buildPackageInfo(cwd, theme),
      buildGitInfo(pi, cwd, theme),
    ]);

    let output = "";

    if (pkgOutput) {
      output += `${pkgOutput.trim()}\n`;
    }

    if (gitOutput) {
      if (output) {
        output += "\n";
      }

      output += `${gitOutput.trim()}\n`;
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

async function buildPackageInfo(cwd: string, theme: Theme): Promise<string> {
  let pkgOutput = "";
  const pkgPath = path.join(cwd, "package.json");

  try {
    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const { name, version, description } = JSON.parse(pkgRaw) as PackageConfig;

    if (name) {
      const versionString = version ? theme.fg("dim", ` v${version}`) : "";
      pkgOutput += `📦 ${theme.bold(theme.fg("mdHeading", name))}${versionString}\n`;
    }

    if (description) {
      pkgOutput += `${theme.italic(description)}\n`;
    }
  } catch {
    // ENOENT or invalid JSON is expected when no package.json is present
  }

  return pkgOutput;
}

async function buildGitInfo(
  pi: ExtensionAPI,
  cwd: string,
  theme: Theme,
): Promise<string> {
  let gitOutput = "";

  try {
    const [branchRes, diffRes, logRes] = await Promise.all([
      pi.exec("git", ["branch", "--show-current"], { cwd }),
      pi.exec("git", ["diff", "--shortstat"], { cwd }),
      pi.exec("git", ["log", "-n", String(RECENT_COMMITS_COUNT), "--oneline"], {
        cwd,
      }),
    ]);

    if (branchRes.code !== SUCCESS_EXIT_CODE) {
      return gitOutput;
    }

    const branch = branchRes.stdout.trim();

    if (branch) {
      gitOutput += `🌿 ${theme.fg("accent", branch)}\n`;
    }

    if (diffRes.code === SUCCESS_EXIT_CODE && diffRes.stdout.trim()) {
      gitOutput += `📊 ${theme.fg("warning", diffRes.stdout.trim())}\n`;
    } else {
      gitOutput += `📊 ${theme.fg("success", "Clean working directory")}\n`;
    }

    if (logRes.code === SUCCESS_EXIT_CODE && logRes.stdout.trim()) {
      gitOutput += "\n📜 Recent Commits:\n";
      gitOutput += logRes.stdout
        .trim()
        .split("\n")
        .map((line) => {
          const spaceIdx = line.indexOf(" ");

          if (spaceIdx === -1) {
            return `  ${line}`;
          }

          const commitHash = line.slice(0, spaceIdx);
          const commitMessage = line.slice(spaceIdx + 1);

          return `  ${theme.fg("dim", commitHash)} ${commitMessage}`;
        })
        .join("\n");
    }
  } catch {
    // Missing git or not a git repository
  }

  return gitOutput;
}
