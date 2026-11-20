import { dbMode, ready } from "../src/lib/db";

ready()
  .then(() => console.log("ready", dbMode()))
  .catch((error) => {
    console.error("READY_FAIL", error instanceof Error ? error.message : error);
    process.exit(1);
  });
