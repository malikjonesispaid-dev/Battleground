import { prisma } from "@/lib/db";
import { StatusBadge } from "@/app/page";
import { PublishButton } from "./PublishButton";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { targets: { include: { page: { include: { client: true } } } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Posts</h1>
        <p className="mt-1 text-sm opacity-70">
          Everything you&apos;ve queued, with per-page publish status. The worker
          (<code>npm run worker</code>) auto-publishes anything due; or hit
          &quot;Publish now&quot; to skip the wait.
        </p>
      </div>

      {posts.length === 0 && (
        <p className="text-sm opacity-70">
          Nothing queued yet — go to{" "}
          <a href="/compose" className="underline">
            Compose
          </a>
          .
        </p>
      )}

      <div className="flex flex-col gap-4">
        {posts.map((post) => {
          const hashtags = JSON.parse(post.hashtags) as string[];
          const pendingCount = post.targets.filter((t) => t.status === "PENDING").length;

          return (
            <div key={post.id} className="rounded-md border border-black/10 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{post.hook}</p>
                  <p className="mt-1 text-sm opacity-80">{post.caption}</p>
                  <p className="mt-1 text-xs opacity-60">{hashtags.join(" ")}</p>
                  {post.mediaUrl && (
                    <p className="mt-1 text-xs opacity-60">media: {post.mediaUrl}</p>
                  )}
                  <p className="mt-2 text-xs opacity-50">
                    idea: &quot;{post.idea}&quot;
                    {post.scheduledAt ? ` · scheduled for ${post.scheduledAt.toLocaleString()}` : ""}
                  </p>
                </div>
                {pendingCount > 0 && <PublishButton postId={post.id} />}
              </div>

              <ul className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3 dark:border-white/10">
                {post.targets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span>
                      {t.page.client.name} / {t.page.displayName} ({t.page.platform})
                    </span>
                    <div className="flex items-center gap-2">
                      {t.error && <span className="text-xs text-red-500">{t.error}</span>}
                      <StatusBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
