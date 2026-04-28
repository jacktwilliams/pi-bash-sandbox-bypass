import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export default function (pi: ExtensionAPI) {
  pi.registerMessageRenderer("welcome", (message, _options, theme) => {
    const text = new Text(
      typeof message.content === "string" ? message.content : "Welcome",
      0,
      0,
    );
    const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
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

    let output = "";
    const t = ctx.ui.theme;

    // 1. package.json info
    let pkgOutput = "";
    const pkgPath = path.join(ctx.cwd, "package.json");
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

    if (pkgOutput) {
      output += t.bg(
        "customMessageBg",
        `\n ${pkgOutput.trim().replace(/\n/g, "\n ")} \n`,
      );
    }

    // 2. git info
    let gitOutput = "";
    try {
      const branchResult = await pi.exec("git", ["branch", "--show-current"], {
        cwd: ctx.cwd,
      });
      if (branchResult.code === 0) {
        const branch = branchResult.stdout.trim();
        if (branch) {
          gitOutput += `🌿 ${t.fg("accent", branch)}\n`;
        }

        const diffResult = await pi.exec("git", ["diff", "--shortstat"], {
          cwd: ctx.cwd,
        });
        if (diffResult.code === 0 && diffResult.stdout.trim()) {
          gitOutput += `📊 ${t.fg("warning", diffResult.stdout.trim())}\n`;
        } else {
          gitOutput += `📊 ${t.fg("success", "Clean working directory")}\n`;
        }

        const logResult = await pi.exec(
          "git",
          ["log", "-n", "5", "--oneline"],
          { cwd: ctx.cwd },
        );
        if (logResult.code === 0 && logResult.stdout.trim()) {
          gitOutput += "\n📜 Recent Commits:\n";
          gitOutput += logResult.stdout
            .trim()
            .split("\n")
            .map((line) => {
              const spaceIdx = line.indexOf(" ");
              if (spaceIdx === -1) {
                return `  ${line}`;
              }
              const hash = line.slice(0, spaceIdx);
              const msg = line.slice(spaceIdx + 1);
              return `  ${t.fg("dim", hash)} ${msg}`;
            })
            .join("\n");
        }
      }
    } catch {
      // Ignore missing git
    }

    if (gitOutput) {
      if (output) output += "\n";
      output += t.bg(
        "toolPendingBg",
        `\n ${gitOutput.trim().replace(/\n/g, "\n ")} \n`,
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
