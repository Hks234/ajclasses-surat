import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!match || process.env[match[1]]) continue;
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  process.env[match[1]] = value;
}

async function main() {
const { ready, one, all, run, dbMode, closeDb } = await import("../src/lib/db.ts");
const { hashPassword, checkPassword } = await import("../src/lib/auth.ts");
const { savePublicMedia } = await import("../src/lib/files.ts");

await ready();
console.log("mode", dbMode());

const students = await one("SELECT COUNT(*) AS c FROM users WHERE role = 'student' AND deleted_at IS NULL");
const admins = await one("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND deleted_at IS NULL");
const media = await one("SELECT COUNT(*) AS c, SUM(CASE WHEN file_b64 IS NOT NULL AND file_b64 <> '' THEN 1 ELSE 0 END) AS in_db FROM media_assets");
const columns = await one("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_assets' AND COLUMN_NAME = 'file_b64'");
console.log("students", Number(students?.c || 0));
console.log("admins", Number(admins?.c || 0));
console.log("media", Number(media?.c || 0), "with_image_bytes", Number(media?.in_db || 0));
console.log("file_b64_column", Boolean(columns));

const email = "login-check@ajclasses.local";
const password = "AjClasses1";
await run("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)", [email]);
await run("DELETE FROM student_profiles WHERE user_id IN (SELECT id FROM users WHERE email = ?)", [email]);
await run("DELETE FROM users WHERE email = ?", [email]);
const userId = "login-check-user";
const hash = await hashPassword(password);
const stamp = new Date().toISOString();
await run(
  "INSERT INTO users (id, email, mobile, password_hash, full_name, role, status, email_verified, must_change_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'student', 'active', 1, 0, ?, ?)",
  [userId, email, "9000000000", hash, "Login Check", stamp, stamp],
);
await run("INSERT INTO student_profiles (user_id, preferred_course, city, bio) VALUES (?, NULL, NULL, NULL)", [userId]);
const row = await one("SELECT * FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL", [email]);
const match = await checkPassword(password, row?.password_hash || "");
console.log("email_login", Boolean(row && row.role === "student" && match && row.email_verified));

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const saved = await savePublicMedia(png, "pixel.png", userId, "pixel");
const stored = await one("SELECT CHAR_LENGTH(file_b64) AS n, mime FROM media_assets WHERE id = ?", [saved.id]);
console.log("image_stored", saved.url, Number(stored?.n || 0) > 20, stored?.mime || "");
await run("DELETE FROM media_assets WHERE id = ?", [saved.id]);
await run("DELETE FROM student_profiles WHERE user_id = ?", [userId]);
await run("DELETE FROM users WHERE id = ?", [userId]);
console.log("cleanup", "ok");
const accounts = await all<{ email: string; has_password: number; email_verified: number }>(
  "SELECT email, CASE WHEN password_hash IS NULL OR password_hash = '' THEN 0 ELSE 1 END AS has_password, email_verified FROM users WHERE role = 'student' AND deleted_at IS NULL",
);
console.log("student_accounts", accounts.map((row) => ({ email: row.email.replace(/^(.).+(@.*)$/, "$1***$2"), password: Boolean(Number(row.has_password)), verified: Boolean(Number(row.email_verified)) })));
const missing = await one("SELECT COUNT(*) AS c FROM media_assets WHERE file_b64 IS NULL OR file_b64 = ''");
console.log("images_still_missing", Number(missing?.c || 0));
await closeDb();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
