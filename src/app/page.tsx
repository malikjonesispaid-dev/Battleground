import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [clientCount, pageCount, postCount, dryRun] = await Promise.all([
    prisma.client.count(),
    prisma.page.count(),
    prisma.post.count(),
    Promise.resolve(process.env.DRY_RUN !== "false"),
  ]);

  const recentTargets = await prisma.postTarget.findMany({
    take: 5,
    orderBy: { id: "desc" },
    include: { post: true, page: { include: { client: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm opacity-70">
          Idea in, generated content out, scheduled to the pages you manage.
        </p>
      </div>

      {dryRun && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <strong>Dry-run mode is on.</strong> Nothing is actually posted to any
          platform — publishes are logged only. Set <code>DRY_RUN=false</code>{" "}
          and configure real page credentials to go live.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Clients" value={clientCount} />
        <Stat label="Pages" value={pageCount} />
        <Stat label="Posts" value={postCount} />
      </div>

      <div>
        <h2 className="text-lg font-medium">Recent activity</h2>
        {recentTargets.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">
            Nothing yet — add a client and page, then compose your first post.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recentTargets.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-black/10 px-4 py-2 text-sm dark:border-white/10"
              >
                <span>
                  {t.page.client.name} / {t.page.displayName} ({t.page.platform})
                </span>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/10 px-4 py-3 dark:border-white/10">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-zinc-500/10 text-zinc-500",
    SCHEDULED: "bg-blue-500/10 text-blue-500",
    PUBLISHING: "bg-amber-500/10 text-amber-500",
    PUBLISHED: "bg-green-500/10 text-green-600",
    DRY_RUN: "bg-purple-500/10 text-purple-500",
    FAILED: "bg-red-500/10 text-red-500",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
