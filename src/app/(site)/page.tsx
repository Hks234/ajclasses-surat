import Link from "next/link";
import { ArrowDown, MapPin, Phone } from "lucide-react";
import { getAchievements, getBanners, getBranches, getCourses, getEvents, getFaculty, getFaqs, getPartners, getSection, getSettings, getShopItems, getTestimonials, parseExtra } from "@/lib/content";
import { ready } from "@/lib/db";
import { BannerSlider, EnquiryForm, Stats } from "@/components/widgets";
import { telLink, waLink } from "@/lib/utils";
import { HeroFloats, Reveal } from "@/components/motion";
import { AchieverRail, CommunityForm, EventRail, FacultyRail, FaqList, LogoStrip, ProgrammeRail, ReviewRail, ShopRail } from "@/components/site-ui";
import { accentLast, Kicker } from "@/components/heading";
import { defaultBranches, defaultCourses, defaultFaculty, defaultFaqs, defaultFeatures, defaultHero, defaultSections, defaultTestimonials } from "@/lib/site-defaults";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function highlightTitle(title: string, highlight?: string) {
  if (highlight && title.includes(highlight)) {
    const [before, after] = title.split(highlight);
    return <>{before}<span className="text-orange">{highlight}</span>{after}</>;
  }
  const match = title.match(/(CA, CS & CMA|CA · CS · CMA|CA, CS and CMA)/i);
  if (match && match.index !== undefined) {
    return <>{title.slice(0, match.index)}<span className="text-orange">{match[0]}</span>{title.slice(match.index + match[0].length)}</>;
  }
  const words = title.split(" ");
  if (words.length > 3) {
    return <>{words.slice(0, -3).join(" ")} <span className="text-orange">{words.slice(-3).join(" ")}</span></>;
  }
  return title;
}

export default async function HomePage() {
  let hero: any = defaultHero;
  let why: any = defaultSections.why;
  let programmes: any = defaultSections.programmes;
  let alumni: any = defaultSections.alumni;
  let faqsSection: any = defaultSections.faqs;
  let community: any = defaultSections.community;
  let counsellor: any = defaultSections.counsellor;
  let shopSection: any = defaultSections.shop;
  let placement: any = defaultSections.placement;
  let eventsSection: any = defaultSections.events;
  let reviewsSection: any = defaultSections.reviews;
  let facultySection: any = defaultSections.faculty_home;
  let courses: any[] = defaultCourses;
  let faculty: any[] = defaultFaculty;
  let achievements: any[] = [];
  let testimonials: any[] = defaultTestimonials;
  let settings: Record<string, string> = {};
  let branches: any[] = defaultBranches;
  let topBanners: any[] = [];
  let midBanners: any[] = [];
  let shop: any[] = [];
  let faqs: any[] = defaultFaqs;
  let partners: any[] = [];
  let events: any[] = [];
  try {
    await ready();
    const loaded = await Promise.all([
      getSection("hero"), getSection("why"), getSection("programmes"), getSection("alumni"), getSection("faqs"), getSection("community"), getSection("counsellor"), getSection("shop"), getSection("placement"), getSection("events"), getSection("reviews"), getSection("faculty_home"),
      getCourses(), getFaculty(), getAchievements(), getTestimonials(), getSettings(), getBranches(), getBanners("home_top"), getBanners("home_mid"), getShopItems(), getFaqs(), getPartners(), getEvents(),
    ]);
    hero = loaded[0] || defaultHero;
    why = loaded[1] || defaultSections.why;
    programmes = loaded[2] || defaultSections.programmes;
    alumni = loaded[3] || defaultSections.alumni;
    faqsSection = loaded[4] || defaultSections.faqs;
    community = loaded[5] || defaultSections.community;
    counsellor = loaded[6] || defaultSections.counsellor;
    shopSection = loaded[7] || defaultSections.shop;
    placement = loaded[8] || defaultSections.placement;
    eventsSection = loaded[9] || defaultSections.events;
    reviewsSection = loaded[10] || defaultSections.reviews;
    facultySection = loaded[11] || defaultSections.faculty_home;
    courses = (loaded[12] as any[]).length ? loaded[12] as any[] : defaultCourses;
    faculty = (loaded[13] as any[]).length ? loaded[13] as any[] : defaultFaculty;
    achievements = loaded[14] as any[];
    testimonials = (loaded[15] as any[]).length ? loaded[15] as any[] : defaultTestimonials;
    settings = loaded[16] as Record<string, string>;
    branches = (loaded[17] as any[]).length ? loaded[17] as any[] : defaultBranches;
    topBanners = loaded[18] as any[];
    midBanners = loaded[19] as any[];
    shop = loaded[20] as any[];
    faqs = (loaded[21] as any[]).length ? loaded[21] as any[] : defaultFaqs;
    partners = loaded[22] as any[];
    events = loaded[23] as any[];
  } catch (error) {
    console.error("[aj-classes] Homepage is using built-in content while the database reconnects.", error);
  }
  const extra = parseExtra(hero?.extra_json);
  const ctas = extra.ctas || [];
  const whyExtra = parseExtra(why?.extra_json);
  const features = Array.isArray(whyExtra) && whyExtra.length ? whyExtra : defaultFeatures;
  const trust = extra.trust || [
    { label: settings.trust_line || "Trusted coaching for CA, CS and CMA" },
    { label: "Classroom batches in Surat" },
    { label: "Online student portal for purchased batches" },
  ];
  const heroStats = extra.stats || [
    settings.stat_students ? { value: settings.stat_students, label: "Total Students" } : { value: String(branches.length || 3), label: "Surat Branches" },
    settings.stat_courses ? { value: settings.stat_courses, label: "Courses Offered" } : { value: String(courses.length), label: "Courses Offered" },
    settings.stat_faculty ? { value: settings.stat_faculty, label: "Expert Faculty" } : { value: String(faculty.length || 1), label: "Expert Faculty" },
    settings.stat_years ? { value: settings.stat_years, label: "Years of Experience" } : { value: "CA · CS · CMA", label: "Professional Programmes" },
  ];
  const numericStats = [
    { label: "Total Students", value: settings.stat_students },
    { label: "Courses Offered", value: settings.stat_courses },
    { label: "Expert Faculty", value: settings.stat_faculty },
    { label: "Years of Experience", value: settings.stat_years },
  ].filter((item) => item.value && Number(item.value) > 0);
  const formTitle = extra.form_title || settings.hero_form_title || "The right course can transform your future.";
  const allCtas = ctas.length ? ctas : [{ label: hero?.cta_label || "Explore Our Courses", href: hero?.cta_href || "/courses" }];
  const primaryCta = allCtas[0];
  const secondaryCta = allCtas[1];
  const alumniLogos = partners.filter((item) => item.kind === "alumni");
  const universityLogos = partners.filter((item) => item.kind === "university");
  const awardLogos = partners.filter((item) => item.kind === "award");
  const programmeExtra = parseExtra(programmes?.extra_json);
  const placementExtra = parseExtra(placement?.extra_json);
  const placementStats = Array.isArray(placementExtra.stats) && placementExtra.stats.length ? placementExtra.stats : heroStats;

  return (
    <div>
      <section className="hero-grid">
        {hero?.image_url ? <div className="hero-media"><img src={hero.image_url} alt="" /></div> : <div className="hero-media hero-orbs" />}
        <div className="hero-net" />
        <HeroFloats labels={courses.map((course) => course.name)} />
        <div className="hero-inner container-aj py-12 lg:min-h-[540px] lg:py-16">
          <Reveal className="max-w-[560px]">
            <h1 className="font-display text-[40px] font-bold leading-[50px] tracking-[-0.02em] sm:text-[48px] sm:leading-[60px]">{highlightTitle(hero?.title || "Your Journey to CA, CS & CMA Starts Here.", extra.highlight)}</h1>
            <p className="mt-5 max-w-[540px] text-[16px] leading-6 tracking-[-0.02em] text-white/90">{hero?.subtitle}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={primaryCta.href} className="btn-ghost">
                {primaryCta.label} <ArrowDown size={18} />
              </Link>
              {secondaryCta ? <Link href={secondaryCta.href} className="btn-ghost">{secondaryCta.label}</Link> : null}
            </div>
            <div className="mt-8 space-y-3 text-[15px] font-medium">
              {trust.map((item: any, index: number) => (
                <p key={index} className="flex items-center gap-2.5">
                  <span className="text-orange">★</span> {item.label || item}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={120} className="hero-form-dock mx-4 mb-8 lg:mx-0 lg:mb-0">
          <div className="w-full max-w-[300px] rounded-[10px] bg-white p-4 text-ink shadow-lift">
            <EnquiryForm courses={courses} branches={branches} source="hero" variant="hero" title={formTitle} />
          </div>
        </Reveal>
        <div className="hero-inner">
          <div className="container-aj grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {heroStats.map((item: any, index: number) => (
              <div key={item.label} className={`px-4 ${index ? "lg:border-l lg:border-white/20" : ""}`}>
                <p className="stat-number">{item.value}</p>
                <p className="stat-label">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="stats-line" />
        </div>
      </section>

      <BannerSlider banners={topBanners} />

      <section id="programmes" className="bg-plum py-16 text-white">
        <div className="container-aj text-center">
          <Kicker>{programmeExtra.kicker || "Our Courses"}</Kicker>
          <h2 className="mt-4 font-display text-[32px] font-normal leading-10 text-white">{accentLast(programmes?.title || "Explore Our Programmes")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">{programmes?.subtitle}</p>
        </div>
        <div className="container-aj">
          <ProgrammeRail courses={courses} />
          <div className="mt-4 text-center">
            <Link href={programmes?.cta_href || "/courses"} className="btn-ghost">{programmes?.cta_label || "View All Programmes"}</Link>
          </div>
        </div>
      </section>

      <section className="bg-plum pb-16 text-white">
        <div className="container-aj text-center">
          <Kicker>{parseExtra(shopSection?.extra_json).kicker || "Shop"}</Kicker>
          <h2 className="mt-4 font-display text-[32px] font-normal leading-10">{accentLast(shopSection?.title || settings.shop_title || "Buy a published batch")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">{shopSection?.subtitle || settings.shop_subtitle}</p>
        </div>
        <div className="container-aj mt-4">
          <ShopRail items={shop} />
          <div className="mt-6 text-center"><Link href={shopSection?.cta_href || "/shop"} className="btn-orange">{shopSection?.cta_label || "Open the shop"}</Link></div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-aj text-center">
          <Kicker dark>{parseExtra(alumni?.extra_json).kicker || "Classroom & Online"}</Kicker>
          <h2 className="mt-4 font-display text-[32px] font-normal leading-10 text-plum">{accentLast(alumni?.title || "Our Students Learn Here")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">{alumni?.subtitle}</p>
        </div>
        {alumniLogos.length ? <LogoStrip items={alumniLogos} /> : null}
        {universityLogos.length ? <LogoStrip items={universityLogos} /> : null}
      </section>

      <section className="bg-plum py-16 text-white">
          <div className="container-aj grid items-start gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <Kicker>{placementExtra.kicker || "Results"}</Kicker>
              <h2 className="mt-4 font-display text-[32px] font-normal leading-10">{accentLast(placement?.title || "Classroom Coaching, Online Learning")}</h2>
              <p className="mt-3 text-white/70">{placement?.subtitle}</p>
              {placement?.cta_href ? <Link href={placement.cta_href} className="btn-ghost mt-6">{placement.cta_label || "View more"}</Link> : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {placementStats.map((item: any) => (
                <div key={item.label} className="rounded-[12px] bg-white/5 p-5">
                  <p className="text-sm text-white/70">{item.label}</p>
                  <p className="mt-2 font-display text-[32px] font-bold leading-8 tracking-[-0.02em]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="container-aj mt-10">
            <AchieverRail items={achievements.slice(0, 8)} />
          </div>
        </section>

      {awardLogos.length ? (
        <section className="bg-white py-12">
          <div className="container-aj text-center">
            <Kicker dark>{settings.awards_kicker || "Recognition"}</Kicker>
            <h2 className="mt-4 font-display text-[32px] font-normal leading-10 text-plum">{accentLast(settings.awards_title || "Our Excellence Attested")}</h2>
          </div>
          <LogoStrip items={awardLogos} />
        </section>
      ) : null}

      <BannerSlider banners={midBanners} />

      <section className="bg-plum py-16 text-white">
          <div className="container-aj">
            <Reveal className="text-center">
              <Kicker>{settings.why_kicker || "The AJ Classes Advantage"}</Kicker>
              <h2 className="mt-4 font-display text-[32px] font-normal leading-10">{accentLast(why?.title || "Why Students Choose AJ Classes")}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-white/70">{why?.subtitle}</p>
            </Reveal>
            <div className="mt-10 space-y-8">
              {features.map((feature: any, index: number) => (
                <Reveal key={feature.title} delay={index * 40}>
                  <article className={`advantage-card rounded-[18px] bg-white p-5 text-ink ${index % 2 ? "reverse" : ""}`}>
                    <div className="overflow-hidden rounded-[12px] bg-paper">
                      {feature.image ? <img src={feature.image} alt="" className="h-64 w-full object-cover" /> : <div className="flex h-64 items-center justify-center font-display text-6xl font-bold text-orange">{String(index + 1).padStart(2, "0")}</div>}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-plum">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      <section className="bg-paper py-16">
          <div className="container-aj">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Kicker dark>{parseExtra(reviewsSection?.extra_json).kicker || settings.reviews_kicker || "Reviews"}</Kicker>
                <h2 className="mt-3 font-display text-[32px] font-normal leading-10 text-plum">{accentLast(reviewsSection?.title || settings.reviews_title || "Our Students Say We're Gamechangers")}</h2>
              </div>
              <Link href={reviewsSection?.cta_href || "/testimonials"} className="font-semibold text-orange">{reviewsSection?.cta_label || settings.reviews_cta || "View More Testimonials"}</Link>
            </div>
            {testimonials.some((item) => item.is_demo) ? <p className="mb-4 rounded-[10px] bg-cream px-4 py-3 text-sm font-semibold text-plum">Demonstration cards are shown until genuine student reviews are approved. They are not verified reviews.</p> : null}
            <ReviewRail items={testimonials.slice(0, 8)} />
          </div>
        </section>

      <section className="bg-plum py-16 text-white">
          <div className="container-aj">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Kicker>{parseExtra(facultySection?.extra_json).kicker || settings.faculty_section_kicker || "Faculty"}</Kicker>
                <h2 className="mt-3 font-display text-[32px] font-normal leading-10">{accentLast(facultySection?.title || settings.faculty_section_title || "Industry Leaders Helping You Find The Way")}</h2>
              </div>
              <Link href={facultySection?.cta_href || "/faculty"} className="text-orange">{facultySection?.cta_label || settings.faculty_section_cta || "View More"}</Link>
            </div>
            <FacultyRail faculty={faculty} />
          </div>
        </section>

      <section className="bg-plum py-16 text-white">
          <div className="container-aj">
            <Kicker>{parseExtra(eventsSection?.extra_json).kicker || "Campus"}</Kicker>
            <h2 className="mt-4 font-display text-[32px] font-normal leading-10">{accentLast(eventsSection?.title || "Building Futures Beyond The Classroom")}</h2>
            <p className="mt-3 max-w-2xl text-white/70">{eventsSection?.subtitle}</p>
            <div className="mt-8"><EventRail items={events} /></div>
          </div>
        </section>

      {numericStats.length ? <section className="py-16"><div className="container-aj"><Stats items={numericStats} /></div></section> : null}

        <section className="bg-white py-16">
          <div className="container-aj grid items-start gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <Kicker dark>FAQ</Kicker>
              <h2 className="mt-4 font-display text-[32px] font-normal leading-10 text-plum">{accentLast(faqsSection?.title || "You Asked, We Answered")}</h2>
              <p className="mt-3 text-slate-600">{faqsSection?.subtitle}</p>
            </div>
            <FaqList items={faqs} />
          </div>
        </section>

      <section className="bg-cream py-16">
        <div className="container-aj grid gap-8 lg:grid-cols-2">
          <div>
            <Kicker dark>{parseExtra(counsellor?.extra_json).kicker || "Enquire"}</Kicker>
            <h2 className="mt-4 font-display text-[32px] font-normal leading-10 text-plum">{accentLast(counsellor?.title || settings.counsellor_title || "Our Counsellor Can Clear Any Confusion")}</h2>
            <p className="mt-3 text-slate-600">{counsellor?.subtitle || settings.counsellor_subtitle}</p>
            <div className="mt-6"><EnquiryForm courses={courses} branches={branches} /></div>
          </div>
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold text-plum">{settings.experts_title || "Contact Our Programme Experts"}</h3>
            {branches.map((branch) => (
              <article key={branch.id} className="card p-5">
                <p className="flex items-center gap-2 font-display font-semibold text-plum"><MapPin size={16} className="text-orange" />{branch.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{branch.address}</p>
                <div className="mt-3 flex gap-3 text-sm font-semibold">
                  <a className="text-plum" href={telLink(branch.phone)}><Phone size={14} className="inline" /> {branch.phone}</a>
                  <a className="text-orange" href={waLink(branch.whatsapp || branch.phone, "Hello AJ Classes")}>WhatsApp</a>
                  <Link href={`/enquiry?branch=${branch.id}`}>Enquire</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

        <section className="bg-plum py-12 text-white lg:hidden">
          <div className="container-aj">
            <h2 className="font-display text-3xl font-bold">{community?.title || "Join Our Community"}</h2>
            <p className="mt-2 text-white/70">{community?.subtitle}</p>
            <div className="mt-5"><CommunityForm title={community?.cta_label} /></div>
          </div>
        </section>
    </div>
  );
}
