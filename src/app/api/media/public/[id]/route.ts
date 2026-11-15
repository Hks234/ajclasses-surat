import fs from "fs";
import path from "path";
import { one, ready, run } from "@/lib/db";
import { asFileBuffer, mediaDiskPath } from "@/lib/files";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ready();
  const { id } = await ctx.params;
  let media: any = null;
  try {
    media = await one<any>(
      "SELECT id, mime, path, filename, file_data, file_b64, is_public FROM media_assets WHERE id = ? AND is_public = 1",
      [id],
    );
  } catch {
    media = await one<any>(
      "SELECT id, mime, path, filename, file_data, is_public FROM media_assets WHERE id = ? AND is_public = 1",
      [id],
    );
  }
  if (!media) return new Response("Not found", { status: 404 });

  let file = asFileBuffer(media.file_b64) || asFileBuffer(media.file_data);
  const disk = mediaDiskPath(media.path || "", media.filename);
  if (!file && disk && fs.existsSync(disk)) file = fs.readFileSync(disk);
  if (!file) return new Response("Not found", { status: 404 });

  if (!media.file_b64) {
    try {
      await run("UPDATE media_assets SET file_b64 = ? WHERE id = ?", [file.toString("base64"), id]);
    } catch {}
  }
  if (!media.file_data) {
    try {
      await run("UPDATE media_assets SET file_data = ? WHERE id = ?", [file, id]);
    } catch {}
  }
  if (disk && !fs.existsSync(disk)) {
    try {
      fs.mkdirSync(path.dirname(disk), { recursive: true });
      fs.writeFileSync(disk, file);
    } catch {}
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": media.mime || "application/octet-stream",
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
