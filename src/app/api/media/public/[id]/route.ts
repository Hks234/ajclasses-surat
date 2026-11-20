import { one, ready } from "@/lib/db";
import { asFileBuffer } from "@/lib/files";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ready();
  const { id } = await ctx.params;
  const media = await one<any>("SELECT mime, file_data, file_b64 FROM media_assets WHERE id = ? AND is_public = 1", [id]);
  if (!media) return new Response("Not found", { status: 404 });
  const file = asFileBuffer(media.file_b64) || asFileBuffer(media.file_data);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": media.mime || "application/octet-stream",
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
