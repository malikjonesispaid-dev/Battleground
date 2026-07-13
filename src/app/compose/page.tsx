import { prisma } from "@/lib/db";
import { ComposeForm } from "./ComposeForm";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const clients = await prisma.client.findMany({
    include: { pages: true },
    orderBy: { createdAt: "desc" },
  });

  const hasPages = clients.some((c) => c.pages.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Compose</h1>
        <p className="mt-1 text-sm opacity-70">
          Drop in an idea, generate a hook/caption/hashtags, review it, then
          queue it to the pages you pick. Nothing posts until you queue it —
          and nothing actually publishes unless DRY_RUN is off and the target
          page has real credentials.
        </p>
      </div>

      {!hasPages ? (
        <p className="text-sm opacity-70">
          You don&apos;t have any pages yet.{" "}
          <a href="/clients" className="underline">
            Add a client and a page
          </a>{" "}
          first.
        </p>
      ) : (
        <ComposeForm clients={clients} />
      )}
    </div>
  );
}
