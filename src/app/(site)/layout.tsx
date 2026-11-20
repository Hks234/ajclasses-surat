import { ready } from "@/lib/db";
import { getAnnouncements, getBranding, getBranches, getCourses } from "@/lib/content";
import { defaultBranches, defaultCourses, mergeProgrammeCourses } from "@/lib/site-defaults";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/widgets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let branding: any = { name: "AJ Classes", line: "Aditya Jhawar Education", tagline: "Learn Today. Lead Tomorrow.", email: "info@ajclasses.com", phone: "7984344294", logoUrl: "", logoDark: "", logoLight: "", favicon: "", logoHeight: 52, logoBg: "transparent", instagram: "", facebook: "", youtube: "", linkedin: "", whatsapp: "917984344294", footer: "AJ Classes is the coaching institute of Aditya Jhawar for CA, CS and CMA students, with classrooms in Surat and an online learning portal.", resourceLinks: [["/about", "About Us"], ["/faculty", "Faculty"], ["/achievements", "Achievements"], ["/testimonials", "Testimonials"], ["/test-series", "Test Series"], ["/shop", "Our Batches"], ["/books", "Books"], ["/branches", "Offline Classrooms"], ["/contact", "Contact"], ["/login", "Student Login"]], navCoursesLabel: "View Courses", navShopLabel: "Shop", navResourcesLabel: "Resources", navEnquireLabel: "Enquire Now" };
  let courses: any[] = defaultCourses;
  let branches: any[] = defaultBranches;
  let bars: any[] = [];
  try {
    await ready();
    const loaded = await Promise.all([getBranding(), getCourses(), getBranches(), getAnnouncements("bar")]);
    branding = loaded[0] || branding;
    courses = mergeProgrammeCourses(loaded[1] as any[]);
    branches = (loaded[2] as any[]).length ? loaded[2] as any[] : defaultBranches;
    bars = loaded[3] as any[];
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
