import type { Connector, PublishInput, PublishResult } from "./types";
import { isDryRun } from "./types";

/**
 * YouTube Data API v3 resumable upload for Shorts. Requires an OAuth2 access
 * token with youtube.upload scope on Page.accessToken (a plain API key is
 * not sufficient for uploads). We fetch the video bytes from mediaUrl and
 * stream them into the resumable session.
 * Docs: https://developers.google.com/youtube/v3/guides/uploading_a_video
 */
export const youtubeConnector: Connector = {
  name: "YouTube Data API",
  async publish(input: PublishInput): Promise<PublishResult> {
    const { page, mediaUrl, content } = input;

    if (!page.accessToken) {
      return { status: "FAILED", error: "Page is missing a YouTube OAuth accessToken." };
    }

    if (!mediaUrl) {
      return {
        status: "FAILED",
        error: "YouTube requires a mediaUrl (video) — text-only posts aren't supported.",
      };
    }

    const title = content.hook.slice(0, 100);
    const description = `${content.caption}\n\n${content.hashtags.join(" ")}`;

    if (isDryRun()) {
      console.log(`[DRY_RUN] YouTube -> channel via page ${page.id}: video=${mediaUrl}, title="${title}"`);
      return { status: "DRY_RUN" };
    }

    try {
      const videoRes = await fetch(mediaUrl);
      if (!videoRes.ok || !videoRes.body) {
        return { status: "FAILED", error: `Could not fetch mediaUrl: ${videoRes.status}` };
      }
      const videoBytes = await videoRes.arrayBuffer();
      const contentType = videoRes.headers.get("content-type") || "video/mp4";

      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${page.accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": contentType,
          },
          body: JSON.stringify({
            snippet: {
              title,
              description,
              tags: content.hashtags.map((h) => h.replace(/^#/, "")),
            },
            status: { privacyStatus: "private" },
          }),
        },
      );

      const uploadUrl = initRes.headers.get("location");
      if (!initRes.ok || !uploadUrl) {
        const errJson = await initRes.json().catch(() => ({}));
        return { status: "FAILED", error: JSON.stringify(errJson) };
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: videoBytes,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        return { status: "FAILED", error: JSON.stringify(uploadJson) };
      }

      return { status: "PUBLISHED", externalPostId: uploadJson.id };
    } catch (err) {
      return { status: "FAILED", error: (err as Error).message };
    }
  },
};
