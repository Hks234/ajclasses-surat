import fs from "fs";
import { resourceByKey } from "@/lib/admin-resources";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/content";
import { one, ready, run } from "@/lib/db";
import { mediaDiskPath } from "@/lib/files";
import { bad, json, originBlock } from "@/lib/http";
import { clientIp, normalizeMobile, now, passwordOk, rupeesToPaise, slugify } from "@/lib/utils";

export async function PATCH(req: Request, ctx: { params: Promise<{ resource: string; id: string }> }) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const { resource: key, id } = await ctx.params;
  const resource = resourceByKey(key);
  if (!resource || resource.readOnly) return bad("This record cannot be edited.", 405);
  const auth = await requireAdmin(resource.permission);
  if (auth.status !== 200 || !auth.session) return bad("You do not have access.", auth.status);
  const body = await req.json().catch(() => null);
  if (!body) return bad("Nothing to update.");
  const data: Record<string, string | number | null> = {};
  for (const field of resource.fields) {
    if (field.virtual && field.name !== "password") continue;
    if (!(field.name in body)) continue;
    let value = body[field.name];
    if (field.type === "boolean") value = value ? 1 : 0;
    else if (field.type === "money") value = value === "" || value === null ? null : rupeesToPaise(value);
    else if (field.type === "number") value = value === "" || value === null ? null : Number(value);
    else value = String(value ?? "").trim();
    if (field.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      value = field.name === "end_at" || field.name === "expires_at" ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
    }
    data[field.name] = value === "" ? null : value;
  }
  if (resource.key === "students" && "password" in data) {
    const password = data.password ? String(data.password) : "";
    delete data.password;
    if (password) {
      if (!passwordOk(password)) return bad("Set a password with 10 or more characters, including upper case, lower case and a number.");
      data.password_hash = await hashPassword(password);
    }
  }
  if (resource.key === "students" && data.email) data.email = String(data.email).toLowerCase();
  if (resource.key === "students" && data.mobile) data.mobile = normalizeMobile(String(data.mobile));
  if (resource.key === "coupons" && data.discount_type === "fixed" && typeof data.discount_value === "number") data.discount_value = Math.round(data.discount_value * 100);
  if (resource.key === "coupons" && data.code) data.code = String(data.code).toUpperCase();
  if (!Object.keys(data).length) return bad("Nothing to update.");
  if (resource.table === "courses" || resource.table === "users") data.updated_at = now();
  if (resource.table === "email_templates") data.updated_at = now();
  const keys = Object.keys(data);
  await run(`UPDATE ${resource.table} SET ${keys.map((column) => `${column} = ?`).join(", ")} WHERE id = ?`, [...keys.map((column) => data[column]), id]);
  const logged = { ...data };
  delete logged.password_hash;
  await logActivity(auth.session.id, "update", resource.table, id, logged, clientIp(req));
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ resource: string; id: string }> }) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const { resource: key, id } = await ctx.params;
  const resource = resourceByKey(key);
  if (!resource || resource.readOnly || resource.allowDelete === false) return bad("This record cannot be deleted.", 405);
  const auth = await requireAdmin(resource.permission);
  if (auth.status !== 200 || !auth.session) return bad("You do not have access.", auth.status);
  if (resource.softDelete) await run(`UPDATE ${resource.table} SET deleted_at = ? WHERE id = ?`, [now(), id]);
  else {
    if (resource.table === "media_assets") {
      const media = await one<any>("SELECT path, filename FROM media_assets WHERE id = ?", [id]);
      const disk = media ? mediaDiskPath(media.path || "", media.filename) : "";
      if (disk && fs.existsSync(disk)) fs.unlinkSync(disk);
    }
    await run(`DELETE FROM ${resource.table} WHERE id = ?`, [id]);
  }
  await logActivity(auth.session.id, "delete", resource.table, id, {}, clientIp(req));
  void slugify;
  return json({ ok: true });
}
