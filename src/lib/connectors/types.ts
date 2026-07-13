import type { Page } from "@/generated/prisma/client";
import type { GeneratedContent } from "@/lib/content-generator";

export interface PublishInput {
  page: Page;
  content: GeneratedContent;
  mediaUrl: string | null;
}

export type PublishStatus = "PUBLISHED" | "DRY_RUN" | "FAILED";

export interface PublishResult {
  status: PublishStatus;
  externalPostId?: string;
  error?: string;
}

export interface Connector {
  /** Human-readable name, used in dry-run logs. */
  name: string;
  publish(input: PublishInput): Promise<PublishResult>;
}

export function isDryRun(): boolean {
  return process.env.DRY_RUN !== "false";
}
