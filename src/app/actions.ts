"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateContent, type GeneratedContent } from "@/lib/content-generator";
import { publishTarget } from "@/lib/publish";
import type { Platform } from "@/generated/prisma/enums";

export async function createClient(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Client name is required");

  await prisma.client.create({ data: { name } });
  revalidatePath("/clients");
}

export async function createPage(formData: FormData): Promise<void> {
  const clientId = String(formData.get("clientId") || "");
  const platform = String(formData.get("platform") || "") as Platform;
  const displayName = String(formData.get("displayName") || "").trim();
  const externalId = String(formData.get("externalId") || "").trim() || null;
  const accessToken = String(formData.get("accessToken") || "").trim() || null;
  const webhookUrl = String(formData.get("webhookUrl") || "").trim() || null;

  if (!clientId || !platform || !displayName) {
    throw new Error("clientId, platform, and displayName are required");
  }

  await prisma.page.create({
    data: { clientId, platform, displayName, externalId, accessToken, webhookUrl },
  });
  revalidatePath("/clients");
}

/** Generates a content preview without persisting anything, so it can be reviewed/edited first. */
export async function generatePreview(idea: string, platformHint: Platform): Promise<GeneratedContent> {
  if (!idea.trim()) throw new Error("idea is required");
  return generateContent(idea, platformHint);
}

export interface CreatePostInput {
  idea: string;
  hook: string;
  caption: string;
  hashtags: string[];
  mediaUrl: string | null;
  scheduledAt: string | null;
  pageIds: string[];
}

export async function createPost(input: CreatePostInput): Promise<string> {
  if (!input.hook.trim() || !input.caption.trim()) {
    throw new Error("hook and caption are required");
  }
  if (input.pageIds.length === 0) {
    throw new Error("select at least one page");
  }

  const post = await prisma.post.create({
    data: {
      idea: input.idea,
      hook: input.hook,
      caption: input.caption,
      hashtags: JSON.stringify(input.hashtags),
      mediaUrl: input.mediaUrl,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      targets: { create: input.pageIds.map((pageId) => ({ pageId })) },
    },
  });

  revalidatePath("/posts");
  return post.id;
}

export async function publishNow(postId: string): Promise<void> {
  const targets = await prisma.postTarget.findMany({
    where: { postId, status: "PENDING" },
    select: { id: true },
  });

  for (const target of targets) {
    await publishTarget(target.id);
  }

  revalidatePath("/posts");
}
