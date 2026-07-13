import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Platform } from "@/generated/prisma/enums";

export interface GeneratedContent {
  hook: string;
  caption: string;
  hashtags: string[];
}

const generatedContentSchema = z.object({
  hook: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(1),
});

const PLATFORM_NOTES: Record<Platform, string> = {
  INSTAGRAM: "Instagram Reels/feed: punchy first line, casual tone, 3-8 hashtags.",
  FACEBOOK: "Facebook: slightly longer caption is fine, conversational, fewer hashtags.",
  TIKTOK: "TikTok: very short, trend-aware hook, minimal hashtags (3-5), no corporate tone.",
  YOUTUBE: "YouTube Shorts: title-style hook, description-style caption, searchable hashtags.",
  WEBHOOK: "Generic short-form post: punchy hook, concise caption, a handful of hashtags.",
};

/**
 * Turns a raw idea into a hook/caption/hashtags. Uses Claude when
 * ANTHROPIC_API_KEY is configured; otherwise falls back to a deterministic
 * template so the app is fully usable with zero external config.
 */
export async function generateContent(
  idea: string,
  platform: Platform,
): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return templateFallback(idea, platform);
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CONTENT_MODEL || "claude-sonnet-5";

    const message = await client.messages.create({
      model,
      max_tokens: 500,
      system:
        "You write short-form social media content. Respond with ONLY a JSON object " +
        'of the shape {"hook": string, "caption": string, "hashtags": string[]}. ' +
        "No markdown, no commentary, no code fences. hashtags entries must include " +
        "the leading #. Keep it realistic and specific to the idea given — no empty " +
        "hype, no fabricated stats or claims.",
      messages: [
        {
          role: "user",
          content: `Platform: ${platform}\n${PLATFORM_NOTES[platform]}\n\nIdea: ${idea}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content returned from model");
    }

    const parsed = JSON.parse(textBlock.text);
    return generatedContentSchema.parse(parsed);
  } catch (err) {
    console.error("[content-generator] Claude generation failed, using fallback:", err);
    return templateFallback(idea, platform);
  }
}

function templateFallback(idea: string, platform: Platform): GeneratedContent {
  const trimmed = idea.trim().replace(/\s+/g, " ");
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  const hook =
    platform === "TIKTOK"
      ? `You need to see this: ${trimmed}`
      : `Here's something worth knowing about ${trimmed}.`;

  const caption =
    `${capitalized}. ` +
    (platform === "FACEBOOK" || platform === "YOUTUBE"
      ? "Curious what you think — drop a comment below."
      : "Save this for later.");

  const hashtags = deriveHashtags(trimmed);

  return { hook, caption, hashtags };
}

function deriveHashtags(idea: string): string[] {
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
    "is", "are", "how", "what", "why", "this", "that",
  ]);

  const words = idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  const unique = Array.from(new Set(words)).slice(0, 5);
  const tags = unique.map((w) => `#${w}`);

  return tags.length > 0 ? tags : ["#content"];
}
