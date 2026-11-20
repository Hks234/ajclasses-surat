"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ImageUploadField, MediaLibraryUpload } from "./image-upload";

const links = [
  ["dashboard", "Dashboard"], ["settings", "Website Settings"], ["branding", "Logo, Colours & Look"], ["homepage", "Homepage"],
    ["faqs", "FAQs"], ["partners", "Partner Logos"], ["events", "Events & Highlights"],
    ["banners", "Promotional Banners"], ["courses", "Courses"], ["categories", "Categories"], ["batches", "Batches (sell)"], ["books", "Books (sell)"], ["shipments", "Book Shipments"],
  ["subjects", "Subjects"], ["chapters", "Chapters"], ["videos", "Video Lectures"], ["storage", "Video Storage"],
  ["materials", "Notes & Materials"], ["test-series", "Test Series"], ["tests", "Tests & Questions"], ["students", "Students"],
  ["faculty", "Faculty"], ["achievements", "Achievements"], ["testimonials", "Testimonials"], ["enquiries", "Enquiries"],
  ["payments", "Payments"], ["refunds", "Refunds"], ["coupons", "Coupons"], ["announcements", "Announcements"],
  ["branches", "Branches"], ["emails", "Email Templates"], ["media", "Media Library"], ["roles", "Admin Roles"],
  ["logs", "Activity Logs"], ["security", "Security"],
];

export function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-[270px_1fr]">
      <aside className="bg-deep text-white md:min-h-screen">
        <div className="px-5 py-6"><p className="text-xl font-extrabold">AJ Classes</p><p className="text-xs uppercase tracking-[0.16em] text-orange">Admin</p><p className="mt-2 text-sm text-white/70">{name}</p></div>
        <nav className="max-h-[70vh] space-y-1 overflow-auto px-3 pb-8">
          {links.map(([href, label]) => <Link key={href} href={`/admin/${href}`} className={`block rounded-xl px-3 py-2 text-sm font-semibold ${path === `/admin/${href}` ? "bg-orange text-white" : "text-white/80 hover:bg-white/10"}`}>{label}</Link>)}
        </nav>
        <button className="m-3 text-sm font-bold text-orange" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/admin/login"; }}>Sign out</button>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}

export function ResourceManager({ resource }: { resource: string }) {
  const [data, setData] = useState<any>(null);
  const [edit, setEdit] = useState<any>(null);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  async function load(page = 1) {
    const res = await fetch(`/api/admin/resource/${resource}?page=${page}&q=${encodeURIComponent(q)}`);
    const body = await res.json().catch(() => ({ error: "Could not load this section." }));
    if (!res.ok) {
      setMessage(body.error || "Could not load this section.");
      setData({ title: resource, fields: [], rows: [], allowCreate: false, allowDelete: false });
      return;
    }
    setData(body);
  }
  useEffect(() => { void load(); }, [resource]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of data.fields) {
      if (field.type === "boolean") payload[field.name] = form.get(field.name) === "on";
      else if (field.type === "image") payload[field.name] = form.get(field.name) || edit?.[field.name] || "";
      else if (field.type === "password") {
        const value = String(form.get(field.name) || "");
        if (value) payload[field.name] = value;
      }
      else payload[field.name] = form.get(field.name);
    }
    const res = await fetch(edit?.id ? `/api/admin/resource/${resource}/${edit.id}` : `/api/admin/resource/${resource}`, { method: edit?.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await res.json();
    setMessage(res.ok ? "Saved." : body.error);
    if (res.ok) { setEdit(null); await load(); }
  }
  if (!data) return <p>Loading…</p>;
  const listFields = (data.fields || []).filter((field: any) => field.list);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">{data.title}</h1>
        {data.allowCreate ? <button className="btn-orange" onClick={() => setEdit({})}>Add</button> : null}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void load(); }} className="mb-4 flex gap-2"><input value={q} onChange={(event) => setQ(event.target.value)} className="field" placeholder="Search" /><button className="btn-line">Search</button></form>
      {message ? <p className="mb-3 text-sm font-semibold text-navy">{message}</p> : null}
      {resource === "media" ? <MediaLibraryUpload onUploaded={() => void load()} /> : null}
      <div className="overflow-auto card"><table className="min-w-full text-left text-sm"><thead className="bg-navy text-white"><tr><th className="px-3 py-2">ID</th>{listFields.map((field: any) => <th key={field.name} className="px-3 py-2">{field.label}</th>)}<th className="px-3 py-2">Actions</th></tr></thead>
        <tbody>{rows.map((row: any) => <tr key={row.id} className="border-t"><td className="px-3 py-2 font-mono text-xs">{String(row.id || "").slice(0, 8)}</td>{listFields.map((field: any) => <td key={field.name} className="px-3 py-2">{field.type === "image" && row[field.name] ? <img src={row[field.name]} alt="" className="h-12 w-20 rounded-lg object-cover" /> : String(row[field.name] ?? "").slice(0, 80)}</td>)}<td className="px-3 py-2">{data.fields?.length ? <button className="font-bold text-royal" onClick={() => setEdit(row)}>Edit</button> : null}{data.allowDelete ? <button className="ml-3 font-bold text-red-700" onClick={async () => { if (!confirm("Delete this record?")) return; await fetch(`/api/admin/resource/${resource}/${row.id}`, { method: "DELETE" }); await load(); }}>Delete</button> : null}</td></tr>)}</tbody>
      </table></div>
      {edit ? <form onSubmit={save} className="card mt-4 space-y-3 p-4"><h2 className="text-xl font-extrabold">{edit.id ? "Edit" : "Create"}</h2>{data.fields.map((field: any) => field.type === "image" ? <div key={field.name}><span className="label">{field.label}</span><ImageUploadField name={field.name} required={field.required} value={edit[field.name] || ""} onChange={async (url) => {
        const next = { ...edit, [field.name]: url };
        setEdit(next);
        if (!edit.id) return;
        const res = await fetch(`/api/admin/resource/${resource}/${edit.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [field.name]: url }) });
        const body = await res.json().catch(() => ({ error: "Could not save image." }));
        setMessage(res.ok ? "Image saved." : body.error || "Could not save image.");
        if (res.ok) await load();
      }} /></div> : <label key={field.name} className="block"><span className="label">{field.label}</span>{field.type === "textarea" ? <textarea name={field.name} defaultValue={edit[field.name] || ""} className="field" rows={4} /> : field.type === "boolean" ? <input name={field.name} type="checkbox" defaultChecked={edit.id ? Boolean(edit[field.name]) : field.name === "email_verified" || Boolean(edit[field.name])} /> : field.type === "select" ? <select name={field.name} defaultValue={edit[field.name] || (field.name === "status" ? "active" : "")} className="field">{(field.options || []).map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={field.name} type={field.type === "number" || field.type === "money" ? "number" : field.type === "date" ? "date" : field.type === "password" ? "password" : field.type === "email" ? "email" : "text"} step="0.01" autoComplete={field.type === "password" ? "new-password" : undefined} placeholder={field.type === "password" && edit.id ? "Leave blank to keep the current password" : ""} defaultValue={field.type === "password" ? "" : edit[field.name] ?? ""} className="field" />}</label>)}<div className="flex gap-2"><button className="btn-orange">Save</button><button type="button" className="btn-line" onClick={() => setEdit(null)}>Close</button></div></form> : null}
    </div>
  );
}

export function VideoManager() {
  const [meta, setMeta] = useState<any>({ chapters: [], progress: "" });
  useEffect(() => { fetch("/api/admin/resource/chapters").then((res) => res.json()).then((data) => setMeta((m: any) => ({ ...m, chapters: data.rows || [] }))); }, []);
  async function onFile(file: File, form: HTMLFormElement) {
    const body = new FormData(form);
    const init = await fetch("/api/admin/videos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "init", fileName: file.name, size: file.size, mime: file.type, title: body.get("title"), description: body.get("description"), chapterId: body.get("chapterId"), sortOrder: body.get("sortOrder"), publish: body.get("publish") === "on" }) });
    const started = await init.json();
    if (!init.ok) { setMeta((m: any) => ({ ...m, progress: started.error })); return; }
    const chunk = 8 * 1024 * 1024;
    let offset = started.received || 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunk);
      const res = await fetch("/api/admin/videos", { method: "PUT", headers: { "x-upload-id": started.uploadId, "x-offset": String(offset) }, body: slice });
      const data = await res.json();
      if (!res.ok) { setMeta((m: any) => ({ ...m, progress: data.error || "Upload failed" })); return; }
      offset = data.received;
      setMeta((m: any) => ({ ...m, progress: `Uploaded ${Math.round(offset / file.size * 100)}%` }));
    }
    const done = await fetch("/api/admin/videos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "complete", uploadId: started.uploadId }) });
    const result = await done.json();
    setMeta((m: any) => ({ ...m, progress: done.ok ? "Upload saved. Processing has been queued." : result.error }));
  }
  return <form className="card space-y-3 p-5" onSubmit={(event) => { event.preventDefault(); const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0]; if (file) void onFile(file, event.currentTarget); }}><h1 className="font-display text-4xl text-navy">Video lectures</h1><p className="text-sm text-slate-600">Create the batch, subject and chapter first. Videos are stored on this server, outside the public website folder.</p><input name="title" required placeholder="Lesson title" className="field" /><textarea name="description" placeholder="Description" className="field" /><select name="chapterId" required className="field"><option value="">Chapter</option>{meta.chapters.map((chapter: any) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select><input name="sortOrder" type="number" defaultValue={1} className="field" /><label className="text-sm font-semibold"><input name="publish" type="checkbox" /> Publish when ready</label><input name="file" type="file" accept="video/*" required /><button className="btn-orange">Upload video</button>{meta.progress ? <p className="font-semibold">{meta.progress}</p> : null}</form>;
}

export function StoragePanel() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/storage").then((res) => res.json()).then(setData); }, []);
  if (!data) return <p>Checking disk…</p>;
  if (data.error) return <p className="font-semibold text-red-700">{data.error}</p>;
  if (!data.total) return <p className="card p-5">Disk capacity could not be read on this computer. Uploads can still work; storage totals will appear once the disk reports capacity.</p>;
  const gb = (n: number) => `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return <div><h1 className="font-display text-4xl text-navy">Video storage</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{[["Capacity", gb(data.total)], ["Used", gb(data.used)], ["Free", gb(data.free)], ["Videos", gb(data.videoBytes)]].map(([label, value]) => <article key={label} className="card p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-extrabold text-navy">{value}</p></article>)}</div>{data.warning ? <p className="mt-4 rounded-2xl bg-cream p-4 font-bold text-navy">Disk usage is at {data.percent}%. Free space before adding more lectures.</p> : <p className="mt-4 text-sm text-slate-600">Disk usage is {data.percent}%. Uploads are blocked when the file would fill the disk.</p>}<p className="mt-2 text-sm">Stored on {data.path}. {data.videoCount} video records. This screen reads the real disk; it does not assume 1 TB is installed.</p></div>;
}

export function SettingsForm({ keys, values }: { keys: { key: string; label: string; area?: boolean; image?: boolean }[]; values: Record<string, string> }) {
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>(values);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    keys.forEach((item) => { payload[item.key] = String(form.get(item.key) || fields[item.key] || ""); });
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    setMessage(res.ok ? "Saved." : "Could not save.");
  }
  return <form onSubmit={onSubmit} className="card space-y-3 p-5">{keys.map((item) => item.image ? <div key={item.key}><span className="label">{item.label}</span><ImageUploadField name={item.key} value={fields[item.key] || ""} onChange={async (url) => {
    setFields((current) => ({ ...current, [item.key]: url }));
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ [item.key]: url }) });
    setMessage(res.ok ? "Image saved." : "Could not save image.");
  }} /></div> : <label key={item.key} className="block"><span className="label">{item.label}</span>{item.area ? <textarea name={item.key} defaultValue={values[item.key] || ""} className="field" rows={5} /> : <input name={item.key} defaultValue={values[item.key] || ""} className="field" />}</label>)}<button className="btn-orange">Save</button>{message ? <p className="font-semibold">{message}</p> : null}</form>;
}

export function SecurityPanel({ status }: { status: any }) {
  const [message, setMessage] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = { action: "integrations" };
    for (const [key, value] of form.entries()) payload[key] = String(value);
    const res = await fetch("/api/admin/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? "Saved. Environment variables still override these values." : data.error);
  }
  return <div className="space-y-6"><h1 className="font-display text-4xl text-navy">Security & integrations</h1><form onSubmit={onSubmit} className="card grid gap-3 p-5 md:grid-cols-2">{["razorpayKeyId", "razorpayKeySecret", "razorpayWebhookSecret", "googleClientId", "googleClientSecret", "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "emailFrom"].map((key) => <label key={key} className="block text-sm font-semibold">{key}<input name={key} className="field" placeholder={status?.[key] || ""} /></label>)}<button className="btn-orange">Save keys</button></form><PasswordChange />{message ? <p className="font-semibold">{message}</p> : null}<p className="text-sm">Razorpay {status?.razorpay ? "is configured" : "is not configured"}. Google {status?.google ? "is configured" : "is not configured"}. SMTP {status?.smtp ? "is configured" : "is not configured"}.</p></div>;
}

function PasswordChange() {
  const [message, setMessage] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current: form.get("current"), password: form.get("password") }) });
    const data = await res.json();
    setMessage(res.ok ? "Password changed." : data.error);
  }
  return <form onSubmit={onSubmit} className="card space-y-3 p-5"><h2 className="text-xl font-extrabold">Change password</h2><input name="current" type="password" required className="field" placeholder="Current password" /><input name="password" type="password" required className="field" placeholder="New password" /><button className="btn-navy">Update password</button>{message ? <p className="text-sm font-semibold">{message}</p> : null}</form>;
}

export function Extras() {
  const [message, setMessage] = useState("");
  return <div className="mt-6 grid gap-4 lg:grid-cols-2">
    <form className="card space-y-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const res = await fetch("/api/admin/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "followup", enquiryId: form.get("enquiryId"), note: form.get("note") }) }); setMessage(res.ok ? "Follow-up saved." : "Could not save follow-up"); }}><h2 className="font-bold">Enquiry follow-up</h2><input name="enquiryId" required placeholder="Enquiry id" className="field" /><textarea name="note" required className="field" /><button className="btn-orange">Add note</button></form>
    <form className="card space-y-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const res = await fetch("/api/admin/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "refund", paymentId: form.get("paymentId"), amount: form.get("amount"), reason: form.get("reason") }) }); const data = await res.json(); setMessage(res.ok ? "Refund recorded." : data.error); }}><h2 className="font-bold">Refund a payment</h2><input name="paymentId" required className="field" placeholder="Payment id" /><input name="amount" required type="number" step="0.01" className="field" placeholder="Amount in rupees" /><input name="reason" className="field" placeholder="Reason" /><button className="btn-navy">Refund</button></form>
    <form className="card space-y-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const options = [1, 2, 3, 4].map((n) => ({ text: form.get(`o${n}`), correct: form.get("correct") === String(n) })).filter((option) => option.text); const res = await fetch("/api/admin/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "question", testId: form.get("testId"), prompt: form.get("prompt"), explanation: form.get("explanation"), marks: form.get("marks"), negativeMarks: form.get("negative"), options }) }); const data = await res.json(); setMessage(res.ok ? "Question saved." : data.error); }}><h2 className="font-bold">Add an MCQ</h2><input name="testId" required className="field" placeholder="Test id" /><textarea name="prompt" required className="field" placeholder="Question" /><input name="o1" className="field" placeholder="Option 1" /><input name="o2" className="field" placeholder="Option 2" /><input name="o3" className="field" placeholder="Option 3" /><input name="o4" className="field" placeholder="Option 4" /><input name="correct" className="field" placeholder="Correct option number" /><input name="marks" defaultValue={1} className="field" /><input name="negative" defaultValue={0} className="field" placeholder="Negative marks" /><textarea name="explanation" className="field" placeholder="Explanation" /><button className="btn-orange">Save question</button></form>
    <form className="card space-y-2 p-4" onSubmit={async (event) => { event.preventDefault(); const res = await fetch("/api/admin/actions", { method: "PUT", body: new FormData(event.currentTarget) }); const data = await res.json(); setMessage(res.ok ? "Material uploaded." : data.error); }}><h2 className="font-bold">Upload notes</h2><input name="title" required className="field" placeholder="Title" /><input name="courseId" className="field" placeholder="Course id" /><input name="batchId" className="field" placeholder="Batch id" /><label className="text-sm"><input name="allowDownload" value="true" type="checkbox" /> Allow download</label><input name="file" type="file" accept="application/pdf" required /><button className="btn-navy">Upload PDF</button></form>
    {message ? <p className="font-semibold">{message}</p> : null}
    <div className="flex gap-3 text-sm font-bold"><a href="/api/admin/actions?export=payments">Export payments</a><a href="/api/admin/actions?export=enquiries">Export enquiries</a><button onClick={async () => { await fetch("/api/admin/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "retry-email" }) }); setMessage("Held emails queued again."); }}>Retry held emails</button></div>
  </div>;
}
