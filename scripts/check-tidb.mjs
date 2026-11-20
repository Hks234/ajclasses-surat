import fs from "fs";

function parseEnv(file) {
  if (!fs.existsSync(file)) return null;
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[match[1]] = value;
  }
  return out;
}

function describe(url) {
  if (!url) return "empty";
  try {
    const parsed = new URL(url.replace(/^mysqls:/, "mysql:"));
    return {
      protocol: url.split(":")[0],
      host: parsed.hostname,
      port: parsed.port || "3306",
      db: parsed.pathname.replace(/^\//, "") || "(none)",
      user: decodeURIComponent(parsed.username || ""),
      hasPassword: Boolean(parsed.password),
      tidb: /\.tidbcloud\.com$/i.test(parsed.hostname),
    };
  } catch (error) {
    return `unparsed: ${error.message}`;
  }
}

for (const file of [".env", ".env.local"]) {
  const env = parseEnv(file);
  if (!env) {
    console.log(file, "absent");
    continue;
  }
  const flags = Object.fromEntries(Object.entries(env).map(([key, value]) => [key, value ? `set:${value.length}` : "empty"]));
  console.log(file, JSON.stringify(flags));
  console.log(file, "DATABASE", JSON.stringify(describe(env.DATABASE_URL || "")));
}
