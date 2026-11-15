"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="page-hero py-24">
      <div className="container-aj">
        <p className="kicker">AJ Classes</p>
        <h1 className="mt-4">This page is reconnecting</h1>
        <p className="mt-4 max-w-xl text-white/80">
          Refresh in a moment. On the live host, set DATABASE_URL to MySQL so the public website, logo and faculty photos do not disappear.
        </p>
        <button className="btn-orange mt-8" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </section>
  );
}
