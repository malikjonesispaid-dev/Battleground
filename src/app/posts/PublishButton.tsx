"use client";

import { useState, useTransition } from "react";
import { publishNow } from "@/app/actions";

export function PublishButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await publishNow(postId);
            } catch (err) {
              setError((err as Error).message);
            }
          })
        }
        className="shrink-0 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium disabled:opacity-40 dark:border-white/15"
      >
        {isPending ? "Publishing..." : "Publish now"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
