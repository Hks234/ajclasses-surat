"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { courseDisplayName } from "@/lib/site-defaults";
import { inr, initials } from "@/lib/utils";
import { HScroll } from "./motion";

export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id || null);
  return (
    <div className="divide-y divide-black/5 overflow-hidden rounded-[12px] bg-white">
      {items.map((item) => {
        const active = open === item.id;
        return (
          <button key={item.id} type="button" className="block w-full px-5 py-5 text-left" onClick={() => setOpen(active ? null : item.id)}>
            <span className="flex items-start justify-between gap-4">
              <span className="font-display text-lg font-semibold text-plum">{item.question}</span>
              <span className={`mt-1 text-orange transition ${active ? "rotate-180" : ""}`}>▾</span>
            </span>
            <span className={`grid transition-all duration-300 ${active ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <span className="overflow-hidden text-sm leading-6 text-slate-600">{item.answer}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LogoStrip({ items }: { items: { id: string; name: string; logo_url?: string; href?: string }[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden py-8">
      <div className="marquee-track flex w-max items-center gap-16">
        {loop.map((item, index) => {
          const inner = item.logo_url
            ? <img src={item.logo_url} alt={item.name} className="h-10 w-auto max-w-[160px] object-contain grayscale transition hover:grayscale-0" />
            : <span className="font-display text-xl font-semibold text-plum/80">{item.name}</span>;
          return item.href
            ? <a key={`${item.id}-${index}`} href={item.href} className="shrink-0">{inner}</a>
            : <span key={`${item.id}-${index}`} className="shrink-0">{inner}</span>;
        })}
      </div>
    </div>
  );
}

const programmeColumns = [
  { title: "Chartered Accountancy", test: (name: string) => name.startsWith("ca ") },
  { title: "Cost & Management Accountancy", test: (name: string) => name.startsWith("cma ") },
  { title: "Company Secretary", test: (name: string) => name.startsWith("cs ") },
];

const programmeOrder = [
  "ca foundation", "ca intermediate", "ca final",
  "cma foundation", "cma intermediate", "cma final",
  "cs cseet", "cs executive", "cs professional",
];

function levelKey(name: string) {
  return courseDisplayName(name).toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export function ProgrammeGrid({ courses }: { courses: any[] }) {
  const columns = programmeColumns.map((column) => ({
    title: column.title,
    items: courses
      .map((course) => ({ ...course, name: courseDisplayName(course.name).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() }))
      .filter((course) => column.test(levelKey(course.name)))
      .sort((a, b) => programmeOrder.indexOf(levelKey(a.name)) - programmeOrder.indexOf(levelKey(b.name))),
  }));
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {columns.map((column) => (
        <div key={column.title} className="flex flex-col gap-4">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-orange">{column.title}</p>
          {column.items.map((course) => (
            <article key={course.id} className="flex flex-1 flex-col rounded-[12px] bg-white p-5 text-ink">
              <h3 className="font-display text-[22px] font-semibold leading-7 text-ink">{course.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.learning_mode ? <span className="chip">{course.learning_mode}</span> : <span className="chip">Classroom & student portal</span>}
                {Number(course.start_price) > 0 ? <span className="chip">From {inr(Number(course.start_price))}</span> : <span className="chip">Enquire for fees</span>}
              </div>
              <div className="mt-auto space-y-2 pt-4">
                <Link href={`/courses/${course.slug}`} className="btn-orange w-full">Know More <ArrowRight size={16} /></Link>
                {course.brochure_url
                  ? <a href={course.brochure_url} className="btn-outline w-full">Download Brochure <Download size={16} /></a>
                  : <Link href={`/enquiry?course=${encodeURIComponent(course.name)}`} className="btn-outline w-full">Enquire / Brochure <Download size={16} /></Link>}
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProgrammeRail({ courses }: { courses: any[] }) {
  return (
    <HScroll>
      {courses.map((course) => (
        <article key={course.id} className="programme-card hover-lift relative flex min-h-[513px] flex-col rounded-[12px] bg-white p-[30px]">
          {course.badge ? <span className="badge-pop">{course.badge}</span> : null}
          <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl bg-paper">
            {course.thumbnail ? <img src={course.thumbnail} alt="" className="zoom-img h-full w-full object-contain" /> : <span className="font-display text-lg font-bold text-purple">{String(course.name).slice(0, 3).toUpperCase()}</span>}
          </div>
          <h3 className="mt-5 font-display text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink">{course.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {course.duration ? <span className="chip">{course.duration}</span> : null}
            {course.learning_mode ? <span className="chip">{course.learning_mode}</span> : <span className="chip">Classroom & student portal</span>}
            {course.career_line ? <span className="chip">{course.career_line}</span> : course.start_price ? <span className="chip">From {inr(Number(course.start_price))}</span> : <span className="chip">Enquire for fees</span>}
          </div>
          <div className="mt-auto space-y-3 pt-6">
            <Link href={`/courses/${course.slug}`} className="btn-orange w-full">Know More <ArrowRight size={16} /></Link>
            {course.brochure_url
              ? <a href={course.brochure_url} className="btn-outline w-full">Download Brochure <Download size={16} /></a>
              : <Link href={`/enquiry?course=${encodeURIComponent(course.name)}`} className="btn-outline w-full">Enquire / Brochure <Download size={16} /></Link>}
            {Number(course.start_price) > 0 ? <Link href="/shop" className="block text-center text-sm font-semibold text-purple">Our Batches</Link> : null}
          </div>
        </article>
      ))}
    </HScroll>
  );
}

export function ShopRail({ items }: { items: any[] }) {
  if (!items.length) return <p className="rounded-[12px] bg-white/10 p-5 text-sm">Our batches appear here after a selling price is published under Batches in the admin portal.</p>;
  return (
    <HScroll>
      {items.map((item) => (
        <article key={item.id} className="programme-card flex min-h-[360px] flex-col rounded-[12px] bg-white p-6 text-ink">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange">{item.course_name}</p>
          <h3 className="mt-2 font-display text-[22px] font-semibold leading-7">{item.name}</h3>
          <p className="mt-2 text-sm text-slate-500">{item.faculty_name || "AJ Classes faculty"}{item.start_date ? ` · ${item.start_date}` : ""}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
          <div className="mt-auto pt-5">
            {item.compare_at_paise > item.price_paise ? <p className="text-sm text-slate-400 line-through">{inr(item.compare_at_paise)}</p> : null}
            <p className="text-2xl font-bold text-orange">{inr(item.price_paise)}</p>
            <Link href={`/checkout/batch/${item.id}`} className="btn-orange mt-4 w-full">Buy Now</Link>
          </div>
        </article>
      ))}
    </HScroll>
  );
}

export function FacultyRail({ faculty }: { faculty: any[] }) {
  if (!faculty.length) return null;
  return (
    <HScroll>
      {faculty.map((person) => (
        <Link key={person.id} href="/faculty" className="faculty-card programme-card min-w-[280px]">
          {person.photo_url ? <img src={person.photo_url} alt={person.full_name} /> : <div className="faculty-fallback flex items-center justify-center bg-purple font-display text-5xl font-bold text-white">{initials(person.full_name)}</div>}
          <span className="faculty-overlay">Know more</span>
          <div className="faculty-meta">
            <p className="font-display text-lg font-semibold">{person.full_name}</p>
            <p className="text-sm text-orange">{person.qualification}</p>
          </div>
        </Link>
      ))}
    </HScroll>
  );
}

export function ReviewRail({ items }: { items: any[] }) {
  if (!items.length) return null;
  return (
    <HScroll light>
      {items.map((item) => (
        <article key={item.id} className="programme-card min-h-[280px] rounded-[12px] bg-white p-6 shadow-card">
          {item.rating ? <p className="mb-3 text-orange">{"★".repeat(Number(item.rating))}</p> : null}
          <p className="text-sm leading-7 text-slate-600">“{item.review_text}”</p>
          <div className="mt-6 flex items-center gap-3">
            {item.photo_url ? <img src={item.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-plum font-bold text-white">{initials(item.student_name)}</div>}
            <div>
              <p className="font-semibold text-plum">{item.student_name}</p>
              <p className="text-xs text-slate-500">{item.course_name}</p>
            </div>
          </div>
        </article>
      ))}
    </HScroll>
  );
}

export function EventRail({ items }: { items: any[] }) {
  if (!items.length) return <p className="text-white/70">Events appear here when published from the admin portal.</p>;
  return (
    <HScroll>
      {items.map((item) => (
        <article key={item.id} className="programme-card overflow-hidden rounded-[12px] bg-white text-ink">
          {item.image_url ? <img src={item.image_url} alt="" className="h-48 w-full object-cover" /> : <div className="h-32 bg-paper" />}
          <div className="p-5">
            {item.subtitle ? <p className="text-xs font-semibold uppercase tracking-wider text-orange">{item.subtitle}</p> : null}
            <h3 className="mt-2 font-display text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            {item.href ? <a href={item.href} className="mt-3 inline-block font-semibold text-purple">Read more</a> : null}
          </div>
        </article>
      ))}
    </HScroll>
  );
}

export function AchieverRail({ items }: { items: any[] }) {
  if (!items.length) return <p className="text-white/75">Achievements will appear here when AJ Classes publishes them from the admin dashboard.</p>;
  return (
    <HScroll>
      {items.map((item) => (
        <article key={item.id} className="programme-card overflow-hidden rounded-[12px] bg-white text-ink">
          {item.image_url ? <img src={item.image_url} alt="" className="h-52 w-full object-cover" /> : null}
          <div className="p-5">
            {item.rank_line ? <p className="text-sm font-semibold text-orange">{item.rank_line}</p> : null}
            <h3 className="font-display text-xl font-semibold">{item.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.category ? <span className="chip">{item.category}</span> : null}
              {item.paper ? <span className="chip">{item.paper}</span> : null}
              {item.city ? <span className="chip">{item.city}</span> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        </article>
      ))}
    </HScroll>
  );
}

export function CommunityForm({ title }: { title?: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        mobile: form.get("mobile"),
        course: "Community updates",
        message: "Please send course and batch updates.",
        source: "community",
        company_website: form.get("company_website"),
      }),
    });
    const data = await res.json();
    setPending(false);
    setMessage(res.ok ? "You are on the updates list. AJ Classes will contact you when mail is configured." : data.error || "Could not submit.");
    if (res.ok) event.currentTarget.reset();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input className="hidden" name="company_website" tabIndex={-1} autoComplete="off" />
      <input name="fullName" required placeholder="Your name" className="field" />
      <input name="email" type="email" required placeholder="Email address" className="field" />
      <input name="mobile" required placeholder="Mobile" className="field" />
      <button className="btn-orange shrink-0" disabled={pending}>{pending ? "Saving…" : title || "Notify me"}</button>
      {message ? <p className="self-center text-sm font-semibold text-white">{message}</p> : null}
    </form>
  );
}
