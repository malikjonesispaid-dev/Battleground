"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generatePreview, createPost } from "@/app/actions";
import type { Client, Page } from "@/generated/prisma/client";
import type { Platform } from "@/generated/prisma/enums";

const PLATFORMS: Platform[] = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "WEBHOOK"];

type ClientWithPages = Client & { pages: Page[] };

export function ComposeForm({ clients }: { clients: ClientWithPages[] }) {
  const router = useRouter();

  const [idea, setIdea] = useState("");
  const [platformHint, setPlatformHint] = useState<Platform>("WEBHOOK");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const content = await generatePreview(idea, platformHint);
      setHook(content.hook);
      setCaption(content.caption);
      setHashtags(content.hashtags.join(" "));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function togglePage(id: string) {
    setPageIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const postId = await createPost({
        idea,
        hook,
        caption,
        hashtags: hashtags.split(/\s+/).filter(Boolean),
        mediaUrl: mediaUrl.trim() || null,
        scheduledAt: scheduledAt || null,
        pageIds,
      });
      router.push(`/posts?highlight=${postId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const hasDraft = hook || caption;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Idea</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          placeholder="e.g. 3 mistakes people make when setting up a home espresso station"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <div className="flex items-center gap-2">
          <select
            value={platformHint}
            onChange={(e) => setPlatformHint(e.target.value as Platform)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                Style for {p}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!idea.trim() || generating}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {hasDraft && (
        <div className="flex flex-col gap-4 rounded-md border border-black/10 p-4 dark:border-white/10">
          <h2 className="text-sm font-medium opacity-70">Review &amp; edit before queuing</h2>

          <Field label="Hook" value={hook} onChange={setHook} />
          <Field label="Caption" value={caption} onChange={setCaption} textarea />
          <Field label="Hashtags (space separated)" value={hashtags} onChange={setHashtags} />
          <Field
            label="Media URL (image/video — required by Instagram, TikTok, YouTube)"
            value={mediaUrl}
            onChange={setMediaUrl}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Schedule (leave blank to post ASAP)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Target pages</label>
            {clients.map((client) => (
              <div key={client.id}>
                <div className="text-xs font-medium opacity-60">{client.name}</div>
                {client.pages.map((page) => (
                  <label key={page.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={pageIds.includes(page.id)}
                      onChange={() => togglePage(page.id)}
                    />
                    {page.displayName} ({page.platform})
                  </label>
                ))}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || pageIds.length === 0}
            className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            {saving ? "Queuing..." : "Queue post"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      )}
    </div>
  );
}
