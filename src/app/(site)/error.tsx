"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="bg-paper py-20">
      <div className="container-aj max-w-xl text-center">
        <h1 className="font-display text-4xl text-plum">This page did not open</h1>
        <p className="mt-3 text-slate-600">The address is part of the AJ Classes site. Try again, or use one of the links below.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-orange" onClick={() => reset()}>Try again</button>
          <Link href="/" className="btn-line">Home</Link>
          <Link href="/courses" className="btn-line">Courses</Link>
          <Link href="/books" className="btn-line">Books</Link>
          <Link href="/login" className="btn-line">Student login</Link>
        </div>
      </div>
    </section>
  );
}
