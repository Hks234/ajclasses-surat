export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // On the live host, wait until the first page request. Opening the database
  // during boot can exceed the host timeout, so the build succeeds but the
  // website never appears.
  if (process.env.VERCEL) return;
  try {
    const { ready } = await import("./lib/db");
    await ready();
    const { startWorkers } = await import("./lib/jobs");
    startWorkers();
  } catch (error) {
    console.error("[aj-classes] Database startup failed. Check DATABASE_URL, SSL, and that the TiDB cluster is awake.");
    console.error(error);
  }
}
