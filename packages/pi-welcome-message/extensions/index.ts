import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";

import {
  buildGitInfo,
  buildPackageInfo,
  buildResourcesInfo,
  buildWelcomeHeader,
  formatWelcomeOutput,
  loadWelcomeMessageConfig,
} from "./utils";

export default function (pi: ExtensionAPI): void {
  registerWelcomeRenderer(pi);

  pi.on("session_start", async (event, ctx) => {
    const { hasUI, ui, cwd, model } = ctx;

    if (!hasUI) {
      return;
    }

    const welcomeConfig = await loadWelcomeMessageConfig();

    if (event.reason === "new" && !welcomeConfig.showOnNewSession) {
      return;
    }

    if (event.reason !== "startup" && event.reason !== "new") {
      return;
    }

    const { theme } = ui;
    const enabledSections = welcomeConfig.sections;
    const [packageInfo, gitInfo, resourcesInfo] = await Promise.all([
      enabledSections.nodePackage
        ? buildPackageInfo(cwd, theme)
        : Promise.resolve(""),
      enabledSections.git ? buildGitInfo(pi, cwd, theme) : Promise.resolve(""),
      enabledSections.piResources
        ? buildResourcesInfo(pi, cwd, theme)
        : Promise.resolve(""),
    ]);

    const summaryOutput = formatWelcomeOutput([
      packageInfo,
      gitInfo,
      resourcesInfo,
    ]);

    if (summaryOutput === null) {
      return;
    }

    const headerOutput = welcomeConfig.showLogo
      ? buildWelcomeHeader(model?.id ?? "no model selected")
      : "";
    const output = formatWelcomeOutput([headerOutput, summaryOutput]);

    if (output === null) {
      return;
    }

    pi.sendMessage({
      customType: "welcome",
      content: output,
      display: true,
    });
  });
}

function registerWelcomeRenderer(pi: ExtensionAPI): void {
  pi.registerMessageRenderer("welcome", (message, _options, theme) => {
    const text = new Text(
      typeof message.content === "string" ? message.content : "Welcome",
      0,
      0,
    );
    const box = new Box(1, 1, (token) => theme.bg("customMessageBg", token));

    box.addChild(text);

    return box;
  });
}
