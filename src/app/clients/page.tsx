import { prisma } from "@/lib/db";
import { createClient, createPage } from "@/app/actions";

export const dynamic = "force-dynamic";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "WEBHOOK"] as const;

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { pages: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Clients & Pages</h1>
        <p className="mt-1 text-sm opacity-70">
          A client is whoever you&apos;re posting on behalf of. Each page is one
          social account you&apos;re allowed to post to for them.
        </p>
      </div>

      <form action={createClient} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="New client name"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add client
        </button>
      </form>

      <div className="flex flex-col gap-8">
        {clients.length === 0 && (
          <p className="text-sm opacity-70">No clients yet — add one above.</p>
        )}

        {clients.map((client) => (
          <div key={client.id} className="rounded-md border border-black/10 p-4 dark:border-white/10">
            <h2 className="font-medium">{client.name}</h2>

            <ul className="mt-3 flex flex-col gap-2">
              {client.pages.map((page) => (
                <li key={page.id} className="flex items-center justify-between text-sm">
                  <span>
                    {page.displayName} · {page.platform}
                    {page.webhookUrl ? " · via webhook" : ""}
                  </span>
                  <span className="text-xs opacity-60">
                    {page.accessToken || page.webhookUrl ? "credentials set" : "no credentials — dry-run only"}
                  </span>
                </li>
              ))}
              {client.pages.length === 0 && (
                <li className="text-sm opacity-60">No pages yet.</li>
              )}
            </ul>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">Add a page</summary>
              <form action={createPage} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="clientId" value={client.id} />
                <select
                  name="platform"
                  required
                  className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  name="displayName"
                  required
                  placeholder="Display name (e.g. @handle)"
                  className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
                <input
                  name="externalId"
                  placeholder="Platform page/account ID (optional)"
                  className="col-span-2 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
                <input
                  name="accessToken"
                  placeholder="Access token (optional — leave blank to stay dry-run)"
                  className="col-span-2 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
                <input
                  name="webhookUrl"
                  placeholder="Webhook URL instead (optional, e.g. Zapier/Make inbound hook)"
                  className="col-span-2 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
                <button
                  type="submit"
                  className="col-span-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
                >
                  Add page
                </button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
