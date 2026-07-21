import Link from "next/link";
import { Mic2, Sparkles, SlidersHorizontal, Wand2 } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Beat Engine",
    body: "Generate original trap, drill, boom bap, lo-fi, R&B, pop, afrobeats and house instrumentals on the fly — pick a genre, key and length, or upload your own beat.",
  },
  {
    icon: Mic2,
    title: "Record Over Any Beat",
    body: "Punch in vocal takes straight from your browser mic with built-in noise gating, stack unlimited takes, and mix each one with gain, pan and reverb.",
  },
  {
    icon: SlidersHorizontal,
    title: "AI Pitch Assist",
    body: "Optional per-track pitch correction snaps your vocal toward the beat's key and scale, blended to taste — write your own bars, let the studio handle the rest.",
  },
  {
    icon: Wand2,
    title: "AI Mastering Chain",
    body: "One-click mastering with auto EQ, dual-band compression, warmth, stereo width and loudness-targeted limiting. Export a broadcast-ready WAV in seconds.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <Mic2 className="text-fuchsia-400" size={22} />
          Gordo Loops
        </div>
        <Link
          href="/studio"
          className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_-4px_rgba(217,70,239,0.6)] hover:bg-fuchsia-400"
        >
          Open Studio
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-16 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <span className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">
            All in your browser · nothing leaves your device
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            A studio in your pocket, <span className="text-fuchsia-400">AI-powered</span> end to end.
          </h1>
          <p className="max-w-2xl text-lg text-neutral-400">
            Write your own lyrics, generate a beat, record your vocals, and master the final record — all
            without leaving one tab.
          </p>
          <Link
            href="/studio"
            className="rounded-xl bg-fuchsia-500 px-8 py-3 text-base font-semibold text-white shadow-[0_0_30px_-4px_rgba(217,70,239,0.7)] hover:bg-fuchsia-400"
          >
            Start Making Music
          </Link>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
              <Icon className="mb-3 text-fuchsia-400" size={22} />
              <h3 className="mb-1 font-semibold text-neutral-100">{title}</h3>
              <p className="text-sm text-neutral-400">{body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-600">
        Runs fully client-side using the Web Audio API — your recordings stay on your device.
      </footer>
    </div>
  );
}
