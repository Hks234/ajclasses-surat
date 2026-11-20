import { all, one, ready } from "@/lib/db";
import { demoCheckoutAllowed } from "@/lib/secrets";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await ready();
  const count = async (sql: string, params: (string | number | null)[] = []) => Number((await one<any>(sql, params))?.c || 0);
  const students = await count("SELECT COUNT(*) AS c FROM users WHERE role = 'student' AND deleted_at IS NULL");
  const active = await count("SELECT COUNT(*) AS c FROM users WHERE role = 'student' AND status = 'active'");
  const courses = await count("SELECT COUNT(*) AS c FROM courses WHERE deleted_at IS NULL");
  const batches = await count("SELECT COUNT(*) AS c FROM batches WHERE deleted_at IS NULL");
  const series = await count("SELECT COUNT(*) AS c FROM test_series WHERE deleted_at IS NULL");
  const enquiries = await count("SELECT COUNT(*) AS c FROM enquiries");
  const purchases = await count("SELECT COUNT(*) AS c FROM purchases WHERE status = 'paid'");
  const revenue = Number((await one<any>("SELECT COALESCE(SUM(amount_paise),0) AS c FROM payments WHERE status = 'paid'"))?.c || 0);
  const recentStudents = await all<any>("SELECT full_name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC LIMIT 5");
  const recentPayments = await all<any>("SELECT id, amount_paise, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5");
  const recentEnquiries = await all<any>("SELECT full_name, course_interest, status, created_at FROM enquiries ORDER BY created_at DESC LIMIT 5");
  const cards = [["Students", students], ["Active students", active], ["Courses", courses], ["Batches", batches], ["Test series", series], ["Enquiries", enquiries], ["Purchases", purchases], ["Revenue ₹", (revenue / 100).toFixed(2)]];
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Dashboard</h1>
      {demoCheckoutAllowed() ? <p className="mt-3 rounded-2xl bg-cream p-4 text-sm font-semibold">Demo checkout is on because Razorpay keys are missing. Students are told that no real money is collected. Add keys under Security before going live.</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <article key={String(label)} className="card p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-extrabold text-navy">{value}</p></article>)}</div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <List title="Recent students" rows={recentStudents.map((row) => `${row.full_name} · ${row.email}`)} />
        <List title="Recent payments" rows={recentPayments.map((row) => `${row.status} · ₹${(row.amount_paise / 100).toFixed(2)}`)} />
        <List title="Recent enquiries" rows={recentEnquiries.map((row) => `${row.full_name} · ${row.status}`)} />
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
        <Link href="/admin/batches" className="text-orange">Sell a batch (set price and publish)</Link>
        <Link href="/admin/books" className="text-orange">Sell a book (physical shipping)</Link>
        <Link href="/admin/shipments" className="text-orange">Book shipments</Link>
        <Link href="/admin/courses" className="text-orange">Edit courses on the website</Link>
        <Link href="/admin/homepage" className="text-orange">Edit homepage sections</Link>
        <Link href="/admin/branding" className="text-orange">Logo and colours</Link>
        <Link href="/admin/storage" className="text-orange">Video storage</Link>
      </div>
    </div>
  );
}

function List({ title, rows }: { title: string; rows: string[] }) {
  return <article className="card p-4"><h2 className="font-bold">{title}</h2><ul className="mt-3 space-y-2 text-sm">{rows.length ? rows.map((row) => <li key={row}>{row}</li>) : <li>None yet.</li>}</ul></article>;
}
