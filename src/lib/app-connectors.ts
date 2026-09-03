// Client-safe registry of Lovable App User Connectors used by Folio.
export const APP_CONNECTORS = {
  google_mail: {
    id: "google_mail",
    name: "Gmail",
    tagline: "Read, search and send mail from chat",
    clientKeyEnv: "GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  },
  github: {
    id: "github",
    name: "GitHub",
    tagline: "Repos, issues and pull requests",
    clientKeyEnv: "GITHUB_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: ["read:user", "repo"],
  },
  linear: {
    id: "linear",
    name: "Linear",
    tagline: "Triage issues and plan cycles",
    clientKeyEnv: "LINEAR_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: ["read", "write"],
  },
  slack: {
    id: "slack",
    name: "Slack",
    tagline: "Read channels, post messages",
    clientKeyEnv: "SLACK_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: ["channels:read", "channels:history", "chat:write", "users:read"],
  },
} as const;

export type AppConnectorId = keyof typeof APP_CONNECTORS;
export const APP_CONNECTOR_IDS = Object.keys(APP_CONNECTORS) as AppConnectorId[];
