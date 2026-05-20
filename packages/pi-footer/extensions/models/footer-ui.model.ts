import type { CustomEditor } from "@earendil-works/pi-coding-agent";
import type { EditorComponent } from "@earendil-works/pi-tui";

export type FooterContext = {
  readonly hasUI: boolean;
  readonly cwd: string;
  readonly model?: { readonly id?: string };
  readonly getContextUsage: () =>
    | { readonly percent: number | null }
    | undefined;
  readonly ui: {
    readonly setEditorComponent: (
      factory: PromptInputEditorFactory | undefined,
    ) => void;
    readonly setFooter: (factory: FooterFactory | undefined) => void;
    readonly notify: (
      message: string,
      level: "info" | "warning" | "error",
    ) => void;
    readonly theme: {
      readonly fg: (color: "accent", text: string) => string;
    };
  };
};

export type PromptInputEditorFactory = (
  tui: ConstructorParameters<typeof CustomEditor>[0],
  theme: ConstructorParameters<typeof CustomEditor>[1],
  keybindings: ConstructorParameters<typeof CustomEditor>[2],
) => EditorComponent;

export type FooterFactory = (
  tui: { readonly requestRender: () => void },
  theme: FooterTheme,
  footerData: FooterData,
) => FooterComponent;

export type FooterTheme = {
  readonly fg: (color: "text", text: string) => string;
};

export type FooterData = {
  readonly getGitBranch: () => string | null;
  readonly getExtensionStatuses: () => ReadonlyMap<string, string>;
  readonly onBranchChange: (callback: () => void) => () => void;
};

export type FooterComponent = {
  readonly render: (width: number) => string[];
  readonly invalidate: () => void;
  readonly dispose: () => void;
};
