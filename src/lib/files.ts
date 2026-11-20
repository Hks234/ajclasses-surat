import fs from "fs";
import path from "path";
import { all, insert, run, storageRoot } from "./db";
import { id, now } from "./utils";

type SniffedFile = {
  ext: string;
  mime: string;
  svg?: string;
};

export function sniffImage(buffer: Buffer): SniffedFile | null {
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return { ext: ".png", mime: "image/png" };
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: ".jpg", mime: "image/jpeg" };
  if (buffer.length > 6 && buffer.subarray(0, 3).toString() === "GIF") return { ext: ".gif", mime: "image/gif" };
  if (buffer.length > 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return { ext: ".webp", mime: "image/webp" };
  if (buffer.length > 4 && buffer.subarray(0, 4).toString() === "\x00\x00\x01\x00") return { ext: ".ico", mime: "image/x-icon" };
  const text = buffer.subarray(0, 400).toString("utf8").trim().toLowerCase();
  if (text.startsWith("<svg") || text.startsWith("<?xml")) {
    const raw = buffer.toString("utf8");
    if (/<script|onload=|javascript:|foreignobject/i.test(raw)) return null;
    return { ext: ".svg", mime: "image/svg+xml", svg: raw };
  }
  return null;
}

export function sniffPdf(buffer: Buffer): SniffedFile | null {
  if (buffer.subarray(0, 4).toString() === "%PDF") return { ext: ".pdf", mime: "application/pdf" };
  return null;
}

export function mediaDiskPath(storedPath: string, filename?: string) {
  if (storedPath && path.isAbsolute(storedPath)) return storedPath;
  if (storedPath) return path.join(storageRoot(), storedPath);
  if (filename) return path.join(storageRoot(), "media", filename);
  return "";
}

export function asFileBuffer(value: unknown) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    if (/^[0-9a-f]+$/i.test(text) && text.length % 2 === 0 && text.length > 16) {
      try {
        return Buffer.from(text, "hex");
      } catch {
        return Buffer.from(text, "base64");
      }
    }
    return Buffer.from(text, "base64");
  }
  if (typeof value === "object" && value && Array.isArray((value as { data?: unknown }).data)) {
    return Buffer.from((value as { data: number[] }).data);
  }
  return null;
}

export async function savePublicMedia(buffer: Buffer, originalName: string, createdBy: string, alt = "") {
  const kind = sniffImage(buffer) || sniffPdf(buffer);
  if (!kind) throw new Error("Upload a PNG, JPG, WEBP, GIF, SVG or PDF.");
  if (buffer.length > 4 * 1024 * 1024) throw new Error("Keep logos and photos under 4 MB so they stay saved on the live website.");
  const mediaId = id();
  const filename = `${mediaId}${kind.ext}`;
  const relative = path.join("media", filename);
  const payload = kind.ext === ".svg" && typeof kind.svg === "string" ? Buffer.from(kind.svg, "utf8") : buffer;
  await insert("media_assets", {
    id: mediaId,
    filename,
    original_name: originalName.slice(0, 180),
    mime: kind.mime,
    size_bytes: payload.length,
    path: relative,
    file_data: payload,
    file_b64: payload.toString("base64"),
    alt,
    folder: "library",
    is_public: 1,
    created_by: createdBy,
    created_at: now(),
  });
  return { id: mediaId, url: `/api/media/public/${mediaId}`, mime: kind.mime, size: payload.length };
}

export async function backfillMediaToDatabase() {
  const rows = await all<{ id: string; path: string; filename: string; file_data: unknown; file_b64: string | null }>(
    "SELECT id, path, filename, file_data, file_b64 FROM media_assets WHERE file_b64 IS NULL OR file_b64 = ''",
  );
  let saved = 0;
  for (const row of rows) {
    const fromColumn = asFileBuffer(row.file_data);
    const disk = mediaDiskPath(row.path || "", row.filename);
    const fromDisk = !fromColumn?.length && disk && fs.existsSync(disk) ? fs.readFileSync(disk) : null;
    const file = fromColumn?.length ? fromColumn : fromDisk;
    if (!file?.length) continue;
    await run("UPDATE media_assets SET file_data = ?, file_b64 = ?, size_bytes = ? WHERE id = ?", [file, file.toString("base64"), file.length, row.id]);
    saved += 1;
  }
  if (saved) console.log(`[aj-classes] Stored ${saved} image file(s) in TiDB.`);
  return saved;
}
