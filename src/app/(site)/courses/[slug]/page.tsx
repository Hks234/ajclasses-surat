import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { getBanners, getBatches, getCourse, getFaculty } from "@/lib/content";
import { ready } from "@/lib/db";
import { defaultCourses } from "@/lib/site-defaults";
import { inr } from "@/lib/utils";
import { BannerSlider } from "@/components/widgets";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await ready();
  const { slug } = await params;
  const course = await getCourse(slug);
  const preset = defaultCourses.find((item) => item.slug === slug);
  return { title: course?.seo_title || course?.name || preset?.name || "Course", description: course?.seo_description || course?.description || preset?.description };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await ready();
  const { slug } = await params;
  const course = await getCourse(slug);
  const preset = defaultCourses.find((item) => item.slug === slug);
  if (!course || course.status !== "published") {
    if (!preset) notFound();
    return (
      <>
        <PageHero kicker="AJ Classes" title={preset.name} text={preset.description} />
        <section className="bg-paper py-12">
          <div className="container-aj max-w-3xl">
            <p className="text-slate-600">Classes for {preset.name} are taught by Aditya Jhawar and the AJ Classes faculty, in Surat classrooms and through the student portal once a batch is published.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/enquiry?course=${encodeURIComponent(preset.name)}`} className="btn-orange">Enquire Now</Link>
              <Link href="/shop" className="btn-line">Our Batches</Link>
            </div>
          </div>
        </section>
      </>
    );
  }
  const [batches, banners, faculty] = await Promise.all([getBatches(course.id), getBanners("course"), getFaculty()]);
  const teacher = faculty.find((person) => person.id === course.faculty_id);
  const highlights = String(course.highlights || "").split("\n").filter(Boolean);
  return (
    <>
      <PageHero kicker={course.category_name} title={course.name} text={course.description} />
      {course.banner ? <img src={course.banner} alt="" className="h-72 w-full object-cover" /> : null}
      <BannerSlider banners={banners} />
      <section className="bg-paper">
      <div className="container-aj grid gap-8 py-12 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {course.duration ? <span className="chip">{course.duration}</span> : null}
            {course.learning_mode ? <span className="chip">{course.learning_mode}</span> : <span className="chip">Classroom & student portal</span>}
            {course.career_line ? <span className="chip">{course.career_line}</span> : null}
          </div>
          <h2 className="font-display text-3xl text-plum">Highlights</h2>
          <ul className="mt-4 space-y-2">{highlights.map((item) => <li key={item} className="rounded-2xl bg-paper px-4 py-3 text-sm font-semibold">{item}</li>)}</ul>
          {course.brochure_url ? <a href={course.brochure_url} className="btn-line mt-6">Download brochure</a> : null}
          <h2 className="mt-10 font-display text-3xl text-plum">Batches you can buy</h2>
          <div className="mt-4 space-y-4">
            {batches.length ? batches.map((batch) => (
              <article key={batch.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold">{batch.name}</h3>
                    <p className="text-sm text-slate-500">{batch.start_date || "Start date to be announced"}{batch.end_date ? ` to ${batch.end_date}` : ""} · {batch.validity_days} days access</p>
                    <p className="mt-2 text-sm">{batch.description}</p>
                  </div>
                  <div className="text-right">
                    {batch.compare_at_paise > batch.price_paise ? <p className="text-sm text-slate-400 line-through">{inr(batch.compare_at_paise)}</p> : null}
                    <p className="text-2xl font-extrabold text-orange">{inr(batch.price_paise)}</p>
                    <Link href={batch.price_paise > 0 ? `/checkout/batch/${batch.id}` : "/enquiry"} className="btn-orange mt-3">{batch.price_paise > 0 ? "Buy Now" : "Enquire"}</Link>
                    {batch.price_paise > 0 ? <Link href="/shop" className="mt-2 block text-sm font-semibold text-purple">Our Batches</Link> : null}
                  </div>
                </div>
              </article>
            )) : <p className="rounded-2xl bg-cream p-4 text-sm font-semibold">No published batch yet. Enquire and the institute will share the next schedule.</p>}
          </div>
        </div>
        <aside className="card h-fit p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-orange">Faculty</p>
          <p className="mt-2 text-xl font-extrabold">{teacher?.full_name || "AJ Classes faculty"}</p>
          <p className="text-sm text-slate-600">{teacher?.qualification}</p>
          <Link href="/enquiry" className="btn-orange mt-5 w-full">Enquire Now</Link>
          <Link href="/shop" className="btn-line mt-3 w-full">Our Batches</Link>
        </aside>
      </div>
      </section>
    </>
  );
}
