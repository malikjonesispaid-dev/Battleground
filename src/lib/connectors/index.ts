import type { Page } from "@/generated/prisma/client";
import type { Connector } from "./types";
import { facebookConnector, instagramConnector } from "./meta";
import { tiktokConnector } from "./tiktok";
import { youtubeConnector } from "./youtube";
import { webhookConnector } from "./webhook";

const platformConnectors: Record<string, Connector> = {
  FACEBOOK: facebookConnector,
  INSTAGRAM: instagramConnector,
  TIKTOK: tiktokConnector,
  YOUTUBE: youtubeConnector,
  WEBHOOK: webhookConnector,
};

/** A Page with a webhookUrl always routes through the generic webhook connector. */
export function resolveConnector(page: Page): Connector {
  if (page.webhookUrl) {
    return webhookConnector;
  }
  return platformConnectors[page.platform] ?? webhookConnector;
}

export * from "./types";
