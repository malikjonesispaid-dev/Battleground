import { prisma } from "@/lib/db";
import { resolveConnector } from "@/lib/connectors";

/** Publishes a single PostTarget now, updating its status in the DB. */
export async function publishTarget(postTargetId: string): Promise<void> {
  const target = await prisma.postTarget.findUniqueOrThrow({
    where: { id: postTargetId },
    include: { post: true, page: true },
  });

  await prisma.postTarget.update({
    where: { id: target.id },
    data: { status: "PUBLISHING" },
  });

  const connector = resolveConnector(target.page);
  const result = await connector.publish({
    page: target.page,
    mediaUrl: target.post.mediaUrl,
    content: {
      hook: target.post.hook,
      caption: target.post.caption,
      hashtags: JSON.parse(target.post.hashtags) as string[],
    },
  });

  await prisma.postTarget.update({
    where: { id: target.id },
    data: {
      status: result.status,
      externalPostId: result.externalPostId ?? null,
      error: result.error ?? null,
      publishedAt: result.status === "PUBLISHED" || result.status === "DRY_RUN" ? new Date() : null,
    },
  });
}

/**
 * Finds every PostTarget that is due (post.scheduledAt is null/past, target
 * still PENDING) and publishes it. Meant to be run on a timer — see
 * scripts/worker.ts.
 */
export async function publishDueTargets(): Promise<{ published: number; failed: number }> {
  const now = new Date();

  const due = await prisma.postTarget.findMany({
    where: {
      status: "PENDING",
      post: {
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
      },
    },
    select: { id: true },
  });

  let published = 0;
  let failed = 0;

  for (const target of due) {
    try {
      await publishTarget(target.id);
      published += 1;
    } catch (err) {
      console.error(`[publish] target ${target.id} threw:`, err);
      await prisma.postTarget.update({
        where: { id: target.id },
        data: { status: "FAILED", error: (err as Error).message },
      });
      failed += 1;
    }
  }

  return { published, failed };
}
