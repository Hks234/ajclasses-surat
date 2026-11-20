import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { ProgrammeGrid } from "@/components/site-ui";
import { getCourses, getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { mergeProgrammeCourses } from "@/lib/site-defaults";

export const metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await ready();
  const [loaded, settings] = await Promise.all([getCourses(), getSettings()]);
  const courses = mergeProgrammeCourses(loaded);
  return (
    <>
      <PageHero kicker="CA · CS · CMA" title="Courses" text={settings.courses_intro || "Nine coaching programmes. Fees appear only after a batch is published."} />
      <section className="bg-plum py-12">
        <div className="container-aj">
          <ProgrammeGrid courses={courses} />
          <div className="mt-8 text-center">
            <Link href="/shop" className="btn-ghost">Our Batches</Link>
          </div>
        </div>
      </section>
    </>
  );
}
