import { PageHero } from "@/components/page-hero";
import { getBranches, getSettings } from "@/lib/content";
import { ready } from "@/lib/db";
import { telLink, waLink } from "@/lib/utils";

export const metadata = { title: "Offline Classrooms" };
export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  await ready();
  const [branches, settings] = await Promise.all([getBranches(), getSettings()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "AJ Classes",
    email: settings.email,
    department: branches.map((branch) => ({ "@type": "EducationalOrganization", name: `AJ Classes ${branch.name}`, address: branch.address, telephone: branch.phone })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero kicker="Surat" title="Offline Classrooms" text="Classroom coaching at the Parvat Patiya, Vesu and Pal branches of AJ Classes." />
      <section className="bg-paper py-12"><div className="container-aj grid gap-6">
        {branches.map((branch) => (
          <article key={branch.id} className="card grid gap-4 p-5 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold text-navy">{branch.name}</h2>
              <p className="mt-2 leading-7">{branch.address}</p>
              <div className="mt-4 flex gap-3 font-bold">
                <a href={telLink(branch.phone)}>Call {branch.phone}</a>
                <a className="text-orange" href={waLink(branch.whatsapp || branch.phone)}>WhatsApp</a>
                <a href={`/enquiry?branch=${branch.id}`}>Enquire</a>
              </div>
            </div>
            <iframe title={branch.name} className="h-64 w-full rounded-2xl border-0" src={`https://maps.google.com/maps?q=${encodeURIComponent(branch.map_query || branch.address)}&z=15&output=embed`} />
          </article>
        ))}
      </div></section>
    </>
  );
}
