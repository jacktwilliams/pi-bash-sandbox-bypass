export type CommandDescriptor = {
  readonly name: string;
  readonly source: string;
};

export type CommandResults = {
  readonly code: number;
  readonly stdout: string;
};
