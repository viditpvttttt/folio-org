export const TOKEN_PROVIDERS = [
  "vercel",
  "cursor",
  "github",
  "linear",
  "figma",
  "slack",
  "todoist",
  "openai",
] as const;

export type TokenProvider = (typeof TOKEN_PROVIDERS)[number];
