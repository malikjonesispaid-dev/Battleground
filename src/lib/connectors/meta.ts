import type { Connector, PublishInput, PublishResult } from "./types";
import { isDryRun } from "./types";

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function fullCaption(input: PublishInput): string {
  const { hook, caption, hashtags } = input.content;
  return `${hook}\n\n${caption}\n\n${hashtags.join(" ")}`;
}

/**
 * Facebook Pages: POST /{page-id}/feed. Supports text-only posts.
 * Docs: https://developers.facebook.com/docs/pages-api/posts
 */
export const facebookConnector: Connector = {
  name: "Facebook Graph API",
  async publish(input: PublishInput): Promise<PublishResult> {
    const { page, mediaUrl } = input;

    if (!page.externalId || !page.accessToken) {
      return {
        status: "FAILED",
        error: "Page is missing externalId (Facebook Page ID) or accessToken.",
      };
    }

    const message = fullCaption(input);

    if (isDryRun()) {
      console.log(
        `[DRY_RUN] Facebook -> page ${page.externalId}: "${message.slice(0, 80)}..."` +
          (mediaUrl ? ` [media: ${mediaUrl}]` : ""),
      );
      return { status: "DRY_RUN" };
    }

    try {
      const endpoint = mediaUrl
        ? `${GRAPH_BASE}/${page.externalId}/photos`
        : `${GRAPH_BASE}/${page.externalId}/feed`;

      const body = new URLSearchParams({
        access_token: page.accessToken,
        ...(mediaUrl ? { url: mediaUrl, caption: message } : { message }),
      });

      const res = await fetch(endpoint, { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        return { status: "FAILED", error: JSON.stringify(json) };
      }

      return { status: "PUBLISHED", externalPostId: json.id ?? json.post_id };
    } catch (err) {
      return { status: "FAILED", error: (err as Error).message };
    }
  },
};

/**
 * Instagram Graph API (Business/Creator accounts only). Two-step publish:
 * create a media container, then publish it. Requires a public mediaUrl —
 * Instagram does not support text-only posts.
 * Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
 */
export const instagramConnector: Connector = {
  name: "Instagram Graph API",
  async publish(input: PublishInput): Promise<PublishResult> {
    const { page, mediaUrl } = input;

    if (!page.externalId || !page.accessToken) {
      return {
        status: "FAILED",
        error: "Page is missing externalId (IG Business Account ID) or accessToken.",
      };
    }

    if (!mediaUrl) {
      return {
        status: "FAILED",
        error: "Instagram requires a mediaUrl (image or video) — text-only posts aren't supported.",
      };
    }

    const caption = fullCaption(input);

    if (isDryRun()) {
      console.log(
        `[DRY_RUN] Instagram -> account ${page.externalId}: media=${mediaUrl}, ` +
          `caption="${caption.slice(0, 80)}..."`,
      );
      return { status: "DRY_RUN" };
    }

    try {
      const createRes = await fetch(`${GRAPH_BASE}/${page.externalId}/media`, {
        method: "POST",
        body: new URLSearchParams({
          access_token: page.accessToken,
          image_url: mediaUrl,
          caption,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        return { status: "FAILED", error: JSON.stringify(createJson) };
      }

      const publishRes = await fetch(`${GRAPH_BASE}/${page.externalId}/media_publish`, {
        method: "POST",
        body: new URLSearchParams({
          access_token: page.accessToken,
          creation_id: createJson.id,
        }),
      });
      const publishJson = await publishRes.json();
      if (!publishRes.ok) {
        return { status: "FAILED", error: JSON.stringify(publishJson) };
      }

      return { status: "PUBLISHED", externalPostId: publishJson.id };
    } catch (err) {
      return { status: "FAILED", error: (err as Error).message };
    }
  },
};
