"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { BrandLogo } from "./brand";
import { HeaderShade } from "./motion";

const primary = [
  ["/login", "Student Login"],
  ["/branches", "Offline Classrooms"],
  ["/books", "Books"],
  ["/shop", "Our Batches"],
];

export function Header({ branding, bar, courses }: { branding: any; bar: any; courses: any[] }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"courses" | "resources" | null>(null);
  const resourceLinks: string[][] = branding.resourceLinks || [];
  return (
    <HeaderShade>
      {bar ? (
        <a href={bar.href || "/enquiry"} className="block px-4 py-2 text-center text-sm font-semibold" style={{ background: bar.bg_color || "var(--plum)", color: bar.text_color || "#fff" }}>
          {bar.message}
        </a>
      ) : null}
      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto flex h-[78px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" aria-label="AJ Classes home"><BrandLogo name={branding.name} line={branding.line} logoUrl={branding.logoUrl} height={branding.logoHeight} background={branding.logoBg} /></Link>
            <div className="relative hidden xl:block" onMouseEnter={() => setMenu("courses")} onMouseLeave={() => setMenu(null)}>
              <Link href="/courses" className="btn-pill">{branding.navCoursesLabel || "View Courses"} <ChevronDown size={16} /></Link>
              {menu === "courses" ? (
                <div className="absolute left-0 top-full z-50 pt-2">
                  <div className="w-80 rounded-[14px] bg-white py-2 shadow-lift">
                    {courses.map((course) => <Link key={course.id} href={`/courses/${course.slug}`} className="block px-4 py-3 text-sm font-medium text-ink hover:bg-paper">{course.name}</Link>)}
                    <Link href="/courses" className="block border-t px-4 py-3 text-sm font-semibold text-purple">All programmes</Link>
                    <Link href="/shop" className="block px-4 py-3 text-sm font-semibold text-orange">Our Batches</Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <nav className="hidden items-center xl:flex">
            {primary.map(([href, label]) => <Link key={href} href={href} className="nav-link px-3">{label}</Link>)}
            <div className="relative" onMouseEnter={() => setMenu("resources")} onMouseLeave={() => setMenu(null)}>
              <button className="nav-link flex items-center gap-1 px-3" type="button">{branding.navResourcesLabel || "Resources"} <ChevronDown size={14} /></button>
              {menu === "resources" ? (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-56 rounded-[14px] bg-white py-2 shadow-lift">
                    {resourceLinks.map(([href, label]) => <Link key={href} href={href} className="block px-4 py-2.5 text-sm font-semibold text-ink/70 hover:text-purple">{label}</Link>)}
                  </div>
                </div>
              ) : null}
            </div>
            <Link href="/enquiry" className="nav-link px-3">{branding.navEnquireLabel || "Enquire Now"}</Link>
          </nav>
          <button className="rounded-full border border-slate-200 p-2 xl:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open ? (
          <div className="space-y-2 border-t border-slate-100 px-4 py-4 xl:hidden">
            {primary.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold text-navy">{label}</Link>)}
            <Link href="/courses" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold text-navy">{branding.navCoursesLabel || "View Courses"}</Link>
            {courses.map((course) => <Link key={course.id} href={`/courses/${course.slug}`} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold text-navy">{course.name}</Link>)}
            {resourceLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold text-navy">{label}</Link>)}
            <Link href="/enquiry" onClick={() => setOpen(false)} className="btn-orange w-full">{branding.navEnquireLabel || "Enquire Now"}</Link>
          </div>
        ) : null}
      </div>
    </HeaderShade>
  );
}
