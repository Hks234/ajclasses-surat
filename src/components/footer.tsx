import Link from "next/link";
import { BrandLogo } from "./brand";
import { CommunityForm } from "./site-ui";
import { accentLast } from "./heading";

export function Footer({ branding, courses, branches }: { branding: any; courses: any[]; branches: any[] }) {
  const socials = [
    ["Instagram", branding.instagram],
    ["Facebook", branding.facebook],
    ["YouTube", branding.youtube],
    ["LinkedIn", branding.linkedin],
  ].filter((item) => item[1]);
  return (
    <footer className="bg-plum text-white">
      <div className="border-b border-white/10">
        <div className="container-aj py-14">
          <div className="rounded-[18px] bg-white/5 p-8">
            <p className="font-display text-[32px] font-normal leading-10">{accentLast(branding.communityTitle || "Join Our Community")}</p>
            <p className="mt-2 text-white/70">{branding.communitySubtitle || "Stay up to date on courses, batches and events."}</p>
            <div className="mt-6 max-w-3xl"><CommunityForm /></div>
            {socials.length ? (
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                {socials.map(([label, href]) => <a key={label} href={href} className="hover:text-orange">{label}</a>)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="container-aj grid gap-10 py-16 md:grid-cols-4">
        <div>
          <div className="inline-block rounded-[10px] bg-white px-4 py-3"><BrandLogo name={branding.name} line={branding.line} logoUrl={branding.logoLight || branding.logoUrl} height={48} /></div>
          <p className="mt-4 text-sm leading-6 text-white/75">{branding.footer}</p>
          <p className="mt-4 text-sm font-semibold text-orange">{branding.tagline}</p>
        </div>
        <div>
          <p className="font-display text-lg font-semibold">Courses</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {courses.slice(0, 9).map((course) => <Link key={course.id} className="block hover:text-orange" href={`/courses/${course.slug}`}>{course.name}</Link>)}
            <Link className="block font-semibold text-orange" href="/shop">Our Batches</Link>
          </div>
        </div>
        <div>
          <p className="font-display text-lg font-semibold">Quick links</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {[["/about", "About"], ["/faculty", "Faculty"], ["/test-series", "Test Series"], ["/shop", "Our Batches"], ["/books", "Books"], ["/branches", "Offline Classrooms"], ["/contact", "Contact"], ["/login", "Student login"], ["/privacy-policy", "Privacy policy"], ["/terms-and-conditions", "Terms"], ["/refund-policy", "Refund policy"]].map(([href, label]) => <Link key={href} href={href} className="block hover:text-orange">{label}</Link>)}
          </div>
        </div>
        <div>
          <p className="font-display text-lg font-semibold">Branches</p>
          <div className="mt-3 space-y-4 text-sm text-white/80">
            {branches.map((branch) => <p key={branch.id}><span className="block font-semibold text-white">{branch.name}</span>{branch.address}<a className="mt-1 block text-orange" href={`tel:+91${branch.phone}`}>{branch.phone}</a></p>)}
            <a className="block text-orange" href={`mailto:${branding.email}`}>{branding.email}</a>
          </div>
        </div>
      </div>
      <div className="bg-black/30 py-4 text-center text-xs text-white/70">© {new Date().getFullYear()} AJ Classes · Aditya Jhawar Education</div>
    </footer>
  );
}
