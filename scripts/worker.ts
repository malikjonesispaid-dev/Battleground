import "dotenv/config";
import { publishDueTargets } from "@/lib/publish";

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS) || 60_000;

async function tick() {
  const { published, failed } = await publishDueTargets();
  if (published || failed) {
    console.log(`[worker] published=${published} failed=${failed} at ${new Date().toISOString()}`);
  }
}

async function main() {
  console.log(
    `[worker] starting, poll interval ${POLL_INTERVAL_MS}ms, DRY_RUN=${process.env.DRY_RUN !== "false"}`,
  );
  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
