"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="page-hero py-24">
      <div className="container-aj">
        <p className="kicker">AJ Classes</p>
        <h1 className="mt-4">The page could not open</h1>
        <p className="mt-4 max-w-xl text-white/80">
          The live website needs DATABASE_URL pointed at MySQL so pages, logos and faculty photos stay saved after a refresh.
        </p>
        <button className="btn-orange mt-8" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </section>
  );
}
