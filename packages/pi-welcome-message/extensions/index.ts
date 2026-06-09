import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  Box,
  Text,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";

import { WelcomeLogoColor, type WelcomeMessageHeader } from "./models";
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

    const hasEnabledSummarySection = Object.values(enabledSections).some(
      (enabled) => enabled,
    );

    if (
      summaryOutput === null &&
      (!welcomeConfig.showLogo || !hasEnabledSummarySection)
    ) {
      return;
    }

    pi.sendMessage({
      customType: "welcome",
      content: summaryOutput ?? "",
      display: true,
      details: {
        header: welcomeConfig.showLogo
          ? {
              modelId: model?.id ?? "no model selected",
              logoColor: welcomeConfig.logoColor,
            }
          : null,
      },
    });
  });
}

function registerWelcomeRenderer(pi: ExtensionAPI): void {
  pi.registerMessageRenderer("welcome", (message, _options, _theme) => {
    const text = new RenderWidthWelcomeText(
      parseWelcomeSummary(message.content),
      parseWelcomeHeader(message.details),
    );
    const box = new Box(1, 1, (token) => token);

    box.addChild(text);

    return box;
  });
}

function parseWelcomeSummary(content: unknown): string {
  return typeof content === "string" ? content : "Welcome";
}

function parseWelcomeHeader(details: unknown): WelcomeMessageHeader | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const { header } = details as { readonly header?: unknown };

  if (!header || typeof header !== "object") {
    return null;
  }

  const candidate = header as Partial<WelcomeMessageHeader>;

  if (
    typeof candidate.modelId !== "string" ||
    typeof candidate.logoColor !== "string" ||
    !isWelcomeLogoColor(candidate.logoColor)
  ) {
    return null;
  }

  return {
    modelId: candidate.modelId,
    logoColor: candidate.logoColor,
  };
}

function isWelcomeLogoColor(value: string): value is WelcomeLogoColor {
  return Object.values(WelcomeLogoColor).includes(value as WelcomeLogoColor);
}

function wrapWelcomeLine(line: string, width: number): string[] {
  const safeWidth = Math.max(width, 1);

  if (visibleWidth(line) <= safeWidth) {
    return [line];
  }

  const indentation = line.match(/^[ \t]*/)?.at(0) ?? "";
  const indentationWidth = visibleWidth(indentation);

  if (indentationWidth === 0 || indentationWidth >= safeWidth) {
    return wrapTextWithAnsi(line, safeWidth);
  }

  const content = line.slice(indentation.length);
  const contentWidth = Math.max(safeWidth - indentationWidth, 1);

  return wrapTextWithAnsi(content, contentWidth).map(
    (wrappedLine) => `${indentation}${wrappedLine}`,
  );
}

class RenderWidthWelcomeText extends Text {
  constructor(
    private readonly summary: string,
    private readonly header: WelcomeMessageHeader | null,
  ) {
    super("", 0, 0);
  }

  override render(width: number): string[] {
    const headerOutput = this.header
      ? buildWelcomeHeader(this.header.modelId, this.header.logoColor, width)
      : "";
    const output =
      formatWelcomeOutput([headerOutput, this.summary]) ?? "Welcome";

    return output.split("\n").flatMap((line) => wrapWelcomeLine(line, width));
  }
}
