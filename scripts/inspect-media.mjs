import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const raw = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = raw.split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim();
const parsed = new URL(url);
const pool = mysql.createPool({
  host: parsed.hostname,
  port: Number(parsed.port || 4000),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectTimeout: 20000,
});

const [rows] = await pool.query(
  "SELECT id, filename, path, mime, size_bytes, (file_data IS NULL) AS missing_blob, CHAR_LENGTH(IFNULL(file_b64,'')) AS b64len FROM media_assets",
);
const root = path.join(process.cwd(), "storage");
const summary = rows.map((row) => {
  const relative = row.path || (row.filename ? path.join("media", row.filename) : "");
  const full = relative ? path.join(root, relative) : "";
  return {
    id: String(row.id).slice(0, 8),
    mime: row.mime,
    size: row.size_bytes,
    missing: Boolean(row.missing_blob),
    b64: Number(row.b64len) > 0,
    disk: full ? fs.existsSync(full) : false,
  };
});
console.log(JSON.stringify({
  total: summary.length,
  missingAndOnDisk: summary.filter((row) => row.missing && row.disk).length,
  missingAndGone: summary.filter((row) => row.missing && !row.disk).length,
  stored: summary.filter((row) => !row.missing).length,
}, null, 2));
await pool.end();
