/**
 * Next.js instrumentation hook runs once when the server process boots
 *
 * It is invoked for every runtime Next compiles for, including the Edge
 * runtime used by `proxy.ts`, so we guard on `NEXT_RUNTIME` and import the
 * jobs module dynamically: a static import would drag `pg-boss` (and `pg`)
 * into the Edge bundle where Node APIs don't exist.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startWorkers } = await import("@/lib/jobs/workers");
  await startWorkers();
}
