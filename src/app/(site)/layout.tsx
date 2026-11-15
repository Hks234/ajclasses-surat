import { ready } from "@/lib/db";
import { getAnnouncements, getBranding, getBranches, getCourses } from "@/lib/content";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/widgets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let branding: any = { name: "AJ Classes", line: "Aditya Jhawar Education", tagline: "", email: "", phone: "", logoUrl: "", logoDark: "", logoLight: "", favicon: "", logoHeight: 52, logoBg: "transparent", instagram: "", facebook: "", youtube: "", linkedin: "", whatsapp: "", footer: "" };
  let courses: any[] = [];
  let branches: any[] = [];
  let bars: any[] = [];
  try {
    await ready();
    [branding, courses, branches, bars] = await Promise.all([getBranding(), getCourses(), getBranches(), getAnnouncements("bar")]);
  } catch (error) {
    console.error("[aj-classes] Public layout could not load database content.", error);
  }
  return (
    <>
      <Header branding={branding} bar={bars[0]} courses={courses} />
      <main>{children}</main>
      <Footer branding={branding} courses={courses} branches={branches} />
      <WhatsAppButton phone={branding.whatsapp} />
    </>
  );
}
