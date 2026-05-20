import type { WelcomeLogoColor } from "./welcome-logo-color.enum";

export type EnabledWelcomeSections = {
  readonly nodePackage: boolean;
  readonly git: boolean;
  readonly piResources: boolean;
};

export type WelcomeMessageConfig = {
  readonly sections: EnabledWelcomeSections;
  readonly showLogo: boolean;
  readonly showOnNewSession: boolean;
  readonly logoColor: WelcomeLogoColor;
};

export type WelcomeMessageSettings = {
  sections?: unknown;
  showLogo?: unknown;
  showOnNewSession?: unknown;
  logoColor?: unknown;
};

export type GlobalSettings = {
  welcomeMessage?: WelcomeMessageSettings;
};
