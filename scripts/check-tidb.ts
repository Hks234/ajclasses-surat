import { all, dbMode, one, ready } from "../src/lib/db";

async function main() {
  await ready();
  console.log("mode", dbMode());
  const tables = await all<Record<string, string>>("SHOW TABLES");
  console.log("tables", tables.length);
  const cols = await all<{ Field: string }>("SHOW COLUMNS FROM media_assets");
  console.log("media_cols", cols.map((column) => column.Field).join(","));
  const users = await one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role = ?", ["student"]);
  const readyUsers = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM users WHERE role = ? AND password_hash IS NOT NULL AND password_hash <> ''",
    ["student"],
  );
  console.log("students", Number(users?.c || 0));
  console.log("with_password", Number(readyUsers?.c || 0));
  const rows = await all<any>("SELECT role, status, email_verified, CHAR_LENGTH(password_hash) AS hash_len, LEFT(password_hash, 4) AS hash_prefix FROM users");
  console.log("users", JSON.stringify(rows));
  const media = await one<any>("SELECT COUNT(*) AS c, SUM(CASE WHEN file_b64 IS NULL OR file_b64 = '' THEN 1 ELSE 0 END) AS no_b64 FROM media_assets");
  const verified = await one<any>("SELECT SUM(email_verified = 1) AS verified FROM users WHERE role = 'student'");
  console.log("media_missing_b64", Number(media?.no_b64 || 0), "of", Number(media?.c || 0));
  console.log("students_verified", Number(verified?.verified || 0));
  process.exit(0);
}

main().catch((error) => {
  const err = error as { code?: string; message?: string };
  console.error("FAIL", err.code || "", err.message || String(error));
  process.exit(1);
});
