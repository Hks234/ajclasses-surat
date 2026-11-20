import fs from "fs";
import mysql from "mysql2/promise";

const raw = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = raw.split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim();
const parsed = new URL(url);
const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
const pool = mysql.createPool({
  host: parsed.hostname,
  port: Number(parsed.port || 4000),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectTimeout: 20000,
});

const [users] = await pool.query(
  "SELECT role, status, email_verified, (password_hash IS NULL OR password_hash = '') AS no_password, COUNT(*) AS c FROM users WHERE deleted_at IS NULL GROUP BY role, status, email_verified, no_password",
);
const [cols] = await pool.query("SHOW COLUMNS FROM media_assets");
let media = null;
try {
  const [rows] = await pool.query("SELECT COUNT(*) AS c, SUM(file_data IS NOT NULL) AS blobs, SUM(CHAR_LENGTH(IFNULL(file_b64,'')) > 0) AS texts FROM media_assets");
  media = rows;
} catch (error) {
  media = { error: error.message };
}
const [settings] = await pool.query("SELECT setting_key FROM website_settings WHERE setting_key IN ('institute_name')");
console.log(JSON.stringify({
  users,
  mediaCols: cols.map((column) => column.Field),
  media,
  hasInstitute: settings.length,
}, null, 2));
await pool.end();
