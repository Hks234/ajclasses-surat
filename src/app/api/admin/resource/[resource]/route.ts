import { resourceByKey, type Field, type Resource } from "@/lib/admin-resources";
import { can, hashPassword, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/content";
import { all, insert, ready, run } from "@/lib/db";
import { bad, json, originBlock } from "@/lib/http";
import { readIntegrations } from "@/lib/secrets";
import { clientIp, id, normalizeMobile, now, passwordOk, rupeesToPaise, slugify } from "@/lib/utils";

const createdTables = new Set(["courses", "batches", "study_materials", "test_series", "tests", "testimonials", "announcements", "coupons", "media_assets", "promotional_banners", "users", "faqs", "site_events", "books"]);
const updatedTables = new Set(["courses", "users", "email_templates"]);

function allowedValueTables(table: string) {
  return ["courses", "course_categories", "batches", "faculties", "subjects", "chapters", "test_series"].includes(table);
}

async function fieldOptions(field: Field) {
  if (field.options) return field.options;
  if (!field.optionsFrom || !allowedValueTables(field.optionsFrom.table)) return [];
  const where = field.optionsFrom.where ? ` WHERE ${field.optionsFrom.where}` : "";
  const rows = await all<any>(`SELECT ${field.optionsFrom.value} AS value, ${field.optionsFrom.label} AS label FROM ${field.optionsFrom.table}${where} ORDER BY ${field.optionsFrom.label}`);
  return [{ label: "None", value: "" }, ...rows.map((row) => ({ label: String(row.label ?? ""), value: String(row.value) }))];
}

function normalize(resource: Resource, body: Record<string, unknown>) {
  const data: Record<string, string | number | null> = {};
  for (const field of resource.fields) {
    if (!(field.name in body)) continue;
    let value = body[field.name];
    if (field.type === "boolean") value = value ? 1 : 0;
    else if (field.type === "money") value = value === "" || value === null || value === undefined ? null : rupeesToPaise(value);
    else if (field.type === "number") value = value === "" || value === null || value === undefined ? null : Number(value);
    else value = String(value ?? "").trim();
    if (field.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      value = field.name === "end_at" || field.name === "expires_at" ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
    }
    if (field.required && (value === "" || value === null || Number.isNaN(value))) {
      throw new Error(`${field.label} is required.`);
    }
    data[field.name] = (value === "" ? null : value) as string | number | null;
  }
  if (resource.key === "coupons" && data.discount_type === "fixed" && typeof data.discount_value === "number") {
    data.discount_value = Math.round(data.discount_value * 100);
  }
  if (resource.table === "batches" && !data.slug && typeof body.name === "string") data.slug = slugify(body.name);
  if (resource.table === "test_series" && !data.slug && typeof body.title === "string") data.slug = slugify(body.title);
  if (resource.table === "courses" && !data.slug && typeof body.name === "string") data.slug = slugify(body.name);
  if (resource.table === "course_categories" && !data.slug && typeof body.name === "string") data.slug = slugify(body.name);
  return data;
}

function present(resource: Resource, row: any) {
  const copy = { ...row };
  delete copy.password_hash;
  for (const field of resource.fields) {
    if (field.type === "money" && copy[field.name] != null) copy[field.name] = Number(copy[field.name]) / 100;
    if (field.type === "date" && typeof copy[field.name] === "string") copy[field.name] = String(copy[field.name]).slice(0, 10);
  }
  if (resource.key === "coupons" && copy.discount_type === "fixed" && copy.discount_value != null) copy.discount_value = Number(copy.discount_value) / 100;
  return copy;
}

export async function GET(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  await ready();
  const { resource: key } = await ctx.params;
  const resource = resourceByKey(key);
  if (!resource) return bad("Unknown section.", 404);
  const auth = await requireAdmin(resource.permission === "payments.view" ? "payments.view" : resource.permission);
  if (auth.status === 401) return bad("Sign in required.", 401);
  if (auth.status === 403 && !(resource.permission === "students.manage" && can(auth.session, "students.view"))) return bad("You do not have access to this section.", 403);
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const q = url.searchParams.get("q")?.trim() || "";
  const where: string[] = [];
  const params: (string | number | null)[] = [];
  if (resource.softDelete) where.push("deleted_at IS NULL");
  if (resource.fixed) {
    for (const [column, value] of Object.entries(resource.fixed)) {
      where.push(`${column} = ?`);
      params.push(value);
    }
  }
  if (q && resource.search?.length) {
    where.push(`(${resource.search.map((column) => `${column} LIKE ?`).join(" OR ")})`);
    resource.search.forEach(() => params.push(`%${q}%`));
  }
  const sqlWhere = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const columns = Array.from(new Set(["id", ...resource.columns, ...resource.fields.filter((field) => !field.virtual).map((field) => field.name)]));
  try {
    const totalRow = await all<any>(`SELECT COUNT(*) AS c FROM ${resource.table}${sqlWhere}`, params);
    const rows = await all<any>(`SELECT ${columns.join(",")} FROM ${resource.table}${sqlWhere} ORDER BY ${resource.orderBy} LIMIT 20 OFFSET ?`, [...params, (page - 1) * 20]);
    const fields = [];
    for (const field of resource.fields) fields.push({ ...field, options: await fieldOptions(field), optionsFrom: undefined });
    return json({
      title: resource.title,
      readOnly: Boolean(resource.readOnly),
      allowCreate: resource.allowCreate !== false && !resource.readOnly,
      allowDelete: resource.allowDelete !== false && !resource.readOnly,
      fields,
      rows: rows.map((row) => present(resource, row)),
      total: Number(totalRow[0]?.c || 0),
      page,
    });
  } catch (error) {
    return bad(error instanceof Error ? error.message : "Could not load this section.", 500);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const { resource: key } = await ctx.params;
  const resource = resourceByKey(key);
  if (!resource || resource.readOnly || resource.allowCreate === false) return bad("This section cannot be created from here.", 405);
  const auth = await requireAdmin(resource.permission);
  if (auth.status !== 200 || !auth.session) return bad("You do not have access.", auth.status);
  try {
    const body = await req.json();
    const data = normalize(resource, body);
    for (const field of resource.fields) {
      if (field.required && !(field.name in data)) return bad(`${field.label} is required.`);
    }
    const rowId = id();
    if (createdTables.has(resource.table)) data.created_at = data.created_at ?? now();
    if (updatedTables.has(resource.table)) data.updated_at = now();
    if (resource.table === "courses" && !data.status) data.status = "draft";
    if (resource.table === "batches" && !data.status) data.status = "draft";
    if (resource.table === "test_series" && !data.status) data.status = "draft";
    if (resource.table === "courses" || resource.table === "batches" || resource.table === "test_series" || resource.table === "books") data.deleted_at = null;
    if (resource.table === "books" && !data.status) data.status = "draft";
    if (resource.table === "books" && (data.stock === null || data.stock === undefined)) data.stock = 0;
    if (resource.key === "students") {
      const password = String(body.password || "");
      delete data.password;
      if (!passwordOk(password)) return bad("Set a password with 10 or more characters, including upper case, lower case and a number.");
      const email = String(data.email || "").toLowerCase();
      if (!email) return bad("Login email is required.");
      data.email = email;
      data.mobile = data.mobile ? normalizeMobile(String(data.mobile)) : null;
      data.password_hash = await hashPassword(password);
      data.role = "student";
      data.status = data.status || "active";
      data.email_verified = readIntegrations().smtpHost && data.email_verified === 0 ? 0 : 1;
      data.must_change_password = 0;
      data.google_sub = null;
      data.avatar_url = null;
      data.updated_at = now();
      data.deleted_at = null;
    }
    if (resource.table === "batches") data.seats_sold = 0;
    if (resource.table === "coupons") data.code = String(data.code || "").toUpperCase();
    await insert(resource.table, { id: rowId, ...data });
    if (resource.key === "students") {
      await insert("student_profiles", { user_id: rowId, preferred_course: null, city: null, bio: null });
    }
    const logged = { ...data };
    delete logged.password_hash;
    await logActivity(auth.session.id, "create", resource.table, rowId, logged, clientIp(req));
    return json({ ok: true, id: rowId });
  } catch (error) {
    return bad(error instanceof Error ? error.message : "Could not save.");
  }
}
