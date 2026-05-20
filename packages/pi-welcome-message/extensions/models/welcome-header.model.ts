import type { WelcomeLogoColor } from "./welcome-logo-color.enum";

export type Rgb = readonly [number, number, number];

export type WelcomeMessageHeader = {
  readonly modelId: string;
  readonly logoColor: WelcomeLogoColor;
};
