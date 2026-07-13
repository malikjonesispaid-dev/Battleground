import type { Connector, PublishInput, PublishResult } from "./types";
import { isDryRun } from "./types";

/**
 * TikTok Content Posting API, using the PULL_FROM_URL source so we don't
 * have to proxy video bytes ourselves — TikTok fetches mediaUrl directly.
 * Requires an approved TikTok developer app with video.publish scope; the
 * access token lives on Page.accessToken.
 * Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 */
export const tiktokConnector: Connector = {
  name: "TikTok Content Posting API",
  async publish(input: PublishInput): Promise<PublishResult> {
    const { page, mediaUrl, content } = input;

    if (!page.accessToken) {
      return { status: "FAILED", error: "Page is missing a TikTok accessToken." };
    }

    if (!mediaUrl) {
      return {
        status: "FAILED",
        error: "TikTok requires a mediaUrl (video) — text-only posts aren't supported.",
      };
    }

    const title = `${content.hook} ${content.hashtags.join(" ")}`.slice(0, 150);

    if (isDryRun()) {
      console.log(`[DRY_RUN] TikTok -> page ${page.id}: video=${mediaUrl}, title="${title}"`);
      return { status: "DRY_RUN" };
    }

    try {
      const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${page.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title,
            privacy_level: "SELF_ONLY",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: mediaUrl,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error?.code !== "ok") {
        return { status: "FAILED", error: JSON.stringify(json) };
      }

      return { status: "PUBLISHED", externalPostId: json.data?.publish_id };
    } catch (err) {
      return { status: "FAILED", error: (err as Error).message };
    }
  },
};
