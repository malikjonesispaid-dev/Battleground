import type { Connector, PublishInput, PublishResult } from "./types";
import { isDryRun } from "./types";

/**
 * Generic fallback: POSTs the generated content as JSON to Page.webhookUrl.
 * Use this to wire up anything without a dedicated connector above —
 * Zapier, Make, Buffer, n8n, or your own endpoint. Takes priority over the
 * platform-specific connectors whenever a Page has a webhookUrl set.
 */
export const webhookConnector: Connector = {
  name: "Generic Webhook",
  async publish(input: PublishInput): Promise<PublishResult> {
    const { page, mediaUrl, content } = input;

    if (!page.webhookUrl) {
      return { status: "FAILED", error: "Page is missing a webhookUrl." };
    }

    const payload = {
      pageId: page.id,
      platform: page.platform,
      hook: content.hook,
      caption: content.caption,
      hashtags: content.hashtags,
      mediaUrl,
    };

    if (isDryRun()) {
      console.log(`[DRY_RUN] Webhook -> ${page.webhookUrl}:`, payload);
      return { status: "DRY_RUN" };
    }

    try {
      const res = await fetch(page.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return { status: "FAILED", error: `Webhook responded ${res.status}` };
      }

      return { status: "PUBLISHED" };
    } catch (err) {
      return { status: "FAILED", error: (err as Error).message };
    }
  },
};
