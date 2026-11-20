import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";
import {
  studentAttempts,
  studentBatches,
  studentNotes,
  studentNotifications,
  studentPayments,
  studentProfile,
  studentPurchases,
  studentSeries,
  studentTests,
} from "@/lib/student";
import { ProfileForm, StartTestButton } from "@/components/student/forms";

export const dynamic = "force-dynamic";

function Empty({ text }: { text: string }) {
  return <p className="card p-6 text-slate-600">{text}</p>;
}

function ShippingNote({ raw }: { raw?: string | null }) {
  if (!raw) return null;
  try {
    const ship = JSON.parse(raw);
    if (!ship?.line1) return null;
    return <p className="mt-2 text-sm text-slate-600">Shipping to {ship.name}, {ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}, {ship.city}, {ship.state} {ship.pincode}</p>;
  } catch {
    return null;
  }
}

export default async function StudentSection({ params }: { params: Promise<{ section: string }> }) {
  await ready();
  const session = await getSession();
  if (!session) return null;
  const { section } = await params;
  if (section === "dashboard") {
    const [batches, series, payments, notes] = await Promise.all([
      studentBatches(session.id),
      studentSeries(session.id),
      studentPayments(session.id),
      studentNotes(session.id),
    ]);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Welcome, {session.fullName}</h1>
        <p className="mt-2 text-slate-600">Your courses, tests and notes appear here after a successful purchase.</p>
        {!session.emailVerified ? <p className="mt-4 rounded-2xl bg-cream p-4 text-sm font-semibold">Verify your email before buying a paid course.</p> : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["Courses", batches.length], ["Test series", series.length], ["Payments", payments.length], ["Notes", notes.length]].map(([label, value]) => (
            <article key={String(label)} className="card p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-extrabold text-navy">{value}</p></article>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card p-5">
            <h2 className="font-bold">My courses</h2>
            {batches.length ? batches.slice(0, 4).map((row) => <p key={row.enrollment_id} className="mt-2"><Link className="font-semibold text-royal" href={`/student/my-courses/${row.batch_id}`}>{row.course_name} · {row.batch_name}</Link></p>) : <p className="mt-2 text-sm text-slate-500">No enrolled batches yet.</p>}
          </article>
          <article className="card p-5">
            <h2 className="font-bold">Recent payments</h2>
            {payments.length ? payments.slice(0, 4).map((row) => <p key={row.id} className="mt-2 text-sm">{row.status} · {inr(row.amount_paise)}</p>) : <p className="mt-2 text-sm text-slate-500">No payments yet.</p>}
          </article>
        </div>
      </div>
    );
  }
  if (section === "my-courses") {
    const batches = await studentBatches(session.id);
    if (!batches.length) return <><h1 className="font-display text-4xl text-navy">My Courses</h1><div className="mt-6"><Empty text="You have not been enrolled in a batch yet. Buy a course from the website to see lectures here." /></div></>;
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">My Courses</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {batches.map((row) => (
            <Link key={row.enrollment_id} href={`/student/my-courses/${row.batch_id}`} className="card p-5">
              <p className="text-sm font-semibold text-orange">{row.course_name}</p>
              <h2 className="mt-1 text-xl font-extrabold text-navy">{row.batch_name}</h2>
              {row.expires_at ? <p className="mt-2 text-sm text-slate-500">Access until {String(row.expires_at).slice(0, 10)}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    );
  }
  if (section === "my-purchases") {
    const purchases = await studentPurchases(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">My Purchases</h1>
        <div className="mt-6 space-y-4">
          {purchases.length ? purchases.map((row) => (
            <article key={row.id} className="card p-5">
              <p className="font-bold text-navy">{row.status} · {inr(row.total_paise)}</p>
              <p className="text-sm text-slate-500">{String(row.created_at).slice(0, 10)}</p>
              <ul className="mt-2 text-sm">{row.items.map((item: any) => <li key={item.id}>{item.title}{item.item_type === "book" ? " · physical shipping" : ""}</li>)}</ul>
              <ShippingNote raw={row.shipping_json} />
            </article>
          )) : <Empty text="No purchases yet." />}
        </div>
      </div>
    );
  }
  if (section === "my-test-series") {
    const series = await studentSeries(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">My Test Series</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {series.length ? series.map((row) => (
            <article key={row.enrollment_id} className="card p-5">
              <h2 className="text-xl font-extrabold text-navy">{row.title}</h2>
              <p className="text-sm text-slate-500">{row.subject}</p>
              <Link href="/student/tests" className="mt-3 inline-block font-bold text-orange">Open tests</Link>
            </article>
          )) : <Empty text="Purchase a test series to attempt tests here." />}
        </div>
      </div>
    );
  }
  if (section === "tests") {
    const tests = await studentTests(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Online Tests</h1>
        <div className="mt-6 space-y-4">
          {tests.length ? tests.map((row) => (
            <article key={row.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-orange">{row.series_title}</p>
                <h2 className="text-xl font-extrabold text-navy">{row.title}</h2>
                <p className="text-sm text-slate-500">{row.duration_minutes} minutes</p>
              </div>
              <StartTestButton testId={row.id} />
            </article>
          )) : <Empty text="No published tests are available on your enrolled series." />}
        </div>
      </div>
    );
  }
  if (section === "results") {
    const attempts = await studentAttempts(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Results</h1>
        <div className="mt-6 space-y-3">
          {attempts.length ? attempts.map((row) => (
            <Link key={row.id} href={`/student/results/${row.id}`} className="card block p-5">
              <p className="font-bold text-navy">{row.test_title}</p>
              <p className="text-sm">{row.status === "submitted" ? `Score ${row.score / 100} / ${row.max_score / 100}` : "In progress"}</p>
            </Link>
          )) : <Empty text="No attempts yet." />}
        </div>
      </div>
    );
  }
  if (section === "notes") {
    const notes = await studentNotes(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Notes</h1>
        <div className="mt-6 space-y-3">
          {notes.length ? notes.map((row) => (
            <a key={row.id} href={`/api/student?material=${row.id}`} className="card block p-5 font-bold text-navy">{row.title}</a>
          )) : <Empty text="No study material has been published for your batches." />}
        </div>
      </div>
    );
  }
  if (section === "payments") {
    const payments = await studentPayments(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Payments</h1>
        <div className="mt-6 overflow-auto card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-navy text-white"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Provider</th></tr></thead>
            <tbody>
              {payments.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{String(row.created_at).slice(0, 10)}</td>
                  <td className="px-3 py-2">{inr(row.amount_paise)}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length ? <p className="p-4 text-slate-500">No payments yet.</p> : null}
        </div>
      </div>
    );
  }
  if (section === "notifications") {
    const rows = await studentNotifications(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Notifications</h1>
        <div className="mt-6 space-y-3">
          {rows.length ? rows.map((row) => (
            <article key={row.id} className="card p-5">
              <h2 className="font-bold">{row.title}</h2>
              <p className="text-sm text-slate-600">{row.body}</p>
              {row.href ? <Link href={row.href} className="mt-2 inline-block font-bold text-orange">Open</Link> : null}
            </article>
          )) : <Empty text="No notifications yet." />}
        </div>
      </div>
    );
  }
  if (section === "profile") {
    const profile = await studentProfile(session.id);
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Profile</h1>
        <div className="mt-6"><ProfileForm profile={profile || { email: session.email, full_name: session.fullName, mobile: session.mobile }} /></div>
      </div>
    );
  }
  if (section === "support") {
    return (
      <div>
        <h1 className="font-display text-4xl text-navy">Help</h1>
        <div className="card mt-6 max-w-xl space-y-3 p-6">
          <p>Need help with a lecture, test or payment? Send an enquiry and the institute will follow up.</p>
          <Link href="/enquiry" className="btn-orange inline-flex">Contact AJ Classes</Link>
        </div>
      </div>
    );
  }
  notFound();
}
