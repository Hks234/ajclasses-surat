import fs from "fs";
import path from "path";
import { AsyncLocalStorage } from "async_hooks";
import mysql from "mysql2/promise";
import { columnPatches, extraSchemaStatements, schemaStatements } from "./schema";

export type SqlValue = string | number | null | Buffer;
type SqliteDb = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...params: SqlValue[]) => unknown[];
    run: (...params: SqlValue[]) => { changes?: number };
  };
};
type Store = { inTx: boolean; conn?: mysql.PoolConnection };

const als = new AsyncLocalStorage<Store>();
let sqlite: SqliteDb | null = null;
let pool: mysql.Pool | null = null;
let mode: "sqlite" | "mysql" = "sqlite";
let phase: "idle" | "init" | "ready" = "idle";
let initPromise: Promise<void> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function sqliteSerial<T>(fn: () => Promise<T>): Promise<T> {
  const job = queue.then(fn, fn);
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

export function dbMode() {
  return mode;
}

function ensureDir(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EPERM" || code === "EACCES") return;
    throw error;
  }
}

export function storageRoot() {
  const configured = process.env.VIDEO_STORAGE_PATH;
  if (configured) return path.resolve(/*turbopackIgnore: true*/ configured);
  if (process.env.VERCEL) return path.join("/tmp", "ajclasses", "storage");
  return path.join(process.cwd(), "storage");
}

function sqlitePath() {
  const dir = process.env.VERCEL
    ? path.join("/tmp", "ajclasses", "data")
    : path.join(process.cwd(), "data");
  ensureDir(dir);
  return path.join(dir, "ajclasses.db");
}

async function exec<T>(fn: () => Promise<T>): Promise<T> {
  if (phase !== "init") await ready();
  const store = als.getStore();
  if (mode === "sqlite" && !store?.inTx && phase !== "init") return sqliteSerial(fn);
  return fn();
}

async function allNow<T>(sql: string, params: SqlValue[]): Promise<T[]> {
  if (mode === "sqlite") {
    return sqlite!.prepare(sql).all(...params) as T[];
  }
  const conn = als.getStore()?.conn;
  const [rows] = await (conn ? conn.query(sql, params) : pool!.query(sql, params));
  return rows as T[];
}

async function runNow(sql: string, params: SqlValue[]) {
  if (mode === "sqlite") {
    const info = sqlite!.prepare(sql).run(...params);
    return { changes: Number(info.changes || 0) };
  }
  const conn = als.getStore()?.conn;
  const [result] = (await (conn ? conn.query(sql, params) : pool!.query(sql, params))) as [
    { affectedRows?: number },
    unknown,
  ];
  return { changes: Number(result?.affectedRows || 0) };
}

export async function all<T = Record<string, any>>(sql: string, params: SqlValue[] = []) {
  return exec(() => allNow<T>(sql, params));
}

export async function one<T = Record<string, any>>(sql: string, params: SqlValue[] = []) {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(sql: string, params: SqlValue[] = []) {
  return exec(() => runNow(sql, params));
}

export async function insert(table: string, data: Record<string, SqlValue>) {
  const keys = Object.keys(data);
  await run(
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    keys.map((key) => data[key]),
  );
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  await ready();
  if (mode === "sqlite") {
    return sqliteSerial(() =>
      als.run({ inTx: true }, async () => {
        sqlite!.exec("BEGIN");
        try {
          const result = await fn();
          sqlite!.exec("COMMIT");
          return result;
        } catch (error) {
          sqlite!.exec("ROLLBACK");
          throw error;
        }
      }),
    );
  }
  const conn = await pool!.getConnection();
  try {
    await conn.beginTransaction();
    const result = await als.run({ inTx: true, conn }, fn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

const reservedMysqlDbs = new Set(["", "sys", "mysql", "information_schema", "performance_schema"]);

function mysqlPoolOptions(url: string) {
  const parsed = new URL(url.replace(/^mysqls:\/\//i, "mysql://"));
  const requested = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const database = reservedMysqlDbs.has(requested.toLowerCase()) ? "ajclasses" : requested;
  const sslRequested =
    url.startsWith("mysqls://") ||
    parsed.searchParams.has("ssl") ||
    parsed.port === "4000" ||
    /\.tidbcloud\.com$/i.test(parsed.hostname);
  const options: mysql.PoolOptions & { remappedFrom: string } = {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectionLimit: 10,
    waitForConnections: true,
    enableKeepAlive: true,
    connectTimeout: process.env.VERCEL ? 8000 : 30000,
    remappedFrom: requested,
  };
  if (sslRequested) options.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: true };
  return options;
}

async function createMysqlPool(url: string) {
  const { remappedFrom, ...options } = mysqlPoolOptions(url);
  if (reservedMysqlDbs.has((remappedFrom || "").toLowerCase())) {
    const { database, ...bootstrapOptions } = options;
    const bootstrap = mysql.createPool(bootstrapOptions);
    try {
      await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    } finally {
      await bootstrap.end();
    }
  }
  let lastError: unknown;
  const attempts = process.env.VERCEL ? 2 : 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const created = mysql.createPool(options);
    try {
      await created.query("SELECT 1");
      return created;
    } catch (error) {
      lastError = error;
      await created.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function tableCount() {
  if (mode === "mysql") {
    const tables = await allNow<Record<string, string>>("SHOW TABLES", []);
    return tables.length;
  }
  const rows = await allNow<{ n: number }>("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'", []);
  return Number(rows[0]?.n || 0);
}

async function runSafe(statement: string) {
  try {
    await run(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists|duplicate|Duplicate|duplicate column/i.test(message)) return;
    throw error;
  }
}

async function migrate() {
  try {
    if ((await tableCount()) < 40) {
      for (const statement of schemaStatements) await runSafe(statement);
    }
  } catch {
    for (const statement of schemaStatements) await runSafe(statement);
  }
  for (const statement of extraSchemaStatements) await runSafe(statement);
  for (const [table, column, type] of columnPatches) {
    await runSafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

export async function ready() {
  if (phase === "ready") return;
  if (phase === "init" && initPromise) return initPromise;
  phase = "init";
  initPromise = (async () => {
    const url = process.env.DATABASE_URL || "";
    ensureDir(path.join(process.cwd(), "data"));
    const root = storageRoot();
    for (const folder of ["course-videos", "hls", "media", "materials", "tmp", "private"]) {
      ensureDir(path.join(/*turbopackIgnore: true*/ root, folder));
    }
    if (url.startsWith("mysql://") || url.startsWith("mysqls://")) {
      mode = "mysql";
      pool = await createMysqlPool(url);
    } else {
      mode = "sqlite";
      const { DatabaseSync } = await import("node:sqlite");
      sqlite = new DatabaseSync(sqlitePath()) as unknown as SqliteDb;
      sqlite.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    }
    await migrate();
    const { seed } = await import("./seed");
    await seed();
    phase = "ready";
  })();
  try {
    await initPromise;
  } catch (error) {
    phase = "idle";
    initPromise = null;
    throw error;
  }
}
