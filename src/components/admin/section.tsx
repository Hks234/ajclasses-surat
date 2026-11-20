"use client";

import { Extras, ResourceManager, SecurityPanel, SettingsForm, StoragePanel, VideoManager } from "./shell";

const resources = ["banners", "courses", "categories", "batches", "books", "shipments", "subjects", "chapters", "faculty", "achievements", "testimonials", "enquiries", "coupons", "branches", "announcements", "homepage", "faqs", "partners", "events", "emails", "students", "logs", "payments", "refunds", "media", "test-series"];

export function AdminSection({ section, settings, integrationStatus }: { section: string; settings: Record<string, string>; integrationStatus: any }) {
  if (resources.includes(section)) {
    return <div><ResourceManager resource={section} />{["enquiries", "payments", "refunds", "emails", "materials", "tests"].includes(section) ? null : section === "enquiries" ? null : null}{(section === "enquiries" || section === "payments" || section === "emails") ? <Extras /> : null}</div>;
  }
  if (section === "materials") return <div><ResourceManager resource="materials" /><Extras /></div>;
  if (section === "tests") return <div><ResourceManager resource="tests" /><Extras /></div>;
  if (section === "videos") return <VideoManager />;
  if (section === "storage") return <StoragePanel />;
  if (section === "settings") return <SettingsForm values={settings} keys={[
    { key: "institute_name", label: "Coaching name" }, { key: "brand_line", label: "Brand line" }, { key: "tagline", label: "Tagline" },
    { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "support_whatsapp", label: "WhatsApp number" },
    { key: "instagram", label: "Instagram" }, { key: "facebook", label: "Facebook" }, { key: "youtube", label: "YouTube" }, { key: "linkedin", label: "LinkedIn" },
    { key: "footer_about", label: "Footer text", area: true }, { key: "seo_title", label: "SEO title" }, { key: "seo_description", label: "SEO description", area: true },
    { key: "about_html", label: "About page", area: true }, { key: "privacy_html", label: "Privacy policy", area: true }, { key: "terms_html", label: "Terms", area: true }, { key: "refund_html", label: "Refund policy", area: true },
    { key: "hero_form_title", label: "Homepage enquiry card title" },
    { key: "trust_line", label: "Homepage trust line" },
    { key: "shop_title", label: "Shop heading" },
    { key: "shop_subtitle", label: "Shop subtitle", area: true },
    { key: "nav_courses_label", label: "Header courses button" },
    { key: "nav_shop_label", label: "Header shop button" },
    { key: "nav_resources_label", label: "Header resources button" },
    { key: "nav_enquire_label", label: "Header enquire button" },
    { key: "community_title", label: "Community heading" },
    { key: "community_subtitle", label: "Community subtitle", area: true },
    { key: "counsellor_title", label: "Counsellor heading" },
    { key: "counsellor_subtitle", label: "Counsellor subtitle", area: true },
    { key: "reviews_title", label: "Homepage reviews heading" },
    { key: "reviews_kicker", label: "Homepage reviews kicker" },
    { key: "reviews_cta", label: "Homepage reviews link text" },
    { key: "faculty_section_title", label: "Homepage faculty heading" },
    { key: "faculty_section_kicker", label: "Homepage faculty kicker" },
    { key: "faculty_section_cta", label: "Homepage faculty link text" },
    { key: "awards_title", label: "Awards heading" },
    { key: "awards_kicker", label: "Awards kicker" },
    { key: "experts_title", label: "Branch experts heading" },
    { key: "why_kicker", label: "Advantage kicker" },
    { key: "about_title", label: "About page heading" },
    { key: "about_kicker", label: "About page kicker" },
    { key: "courses_intro", label: "Courses page intro", area: true },
    { key: "faculty_page_title", label: "Faculty page heading" },
    { key: "nav_resources_json", label: "Resources menu JSON (array of {href,label})", area: true },
    { key: "stat_students", label: "Stat: students" }, { key: "stat_courses", label: "Stat: courses" }, { key: "stat_faculty", label: "Stat: faculty" }, { key: "stat_years", label: "Stat: years" },
    { key: "completion_threshold", label: "Lesson completion percent" }, { key: "lock_completed_lessons", label: "Lock completed lessons (1 or 0)" },
  ]} />;
  if (section === "branding") return <div><h1 className="mb-4 font-display text-4xl text-navy">Logo & branding</h1><p className="mb-4 text-sm text-slate-600">Colours, logos and the public look are edited here. Course names, fees and copy stay as you publish them in the other admin sections.</p><SettingsForm values={settings} keys={[{ key: "logo_url", label: "Logo", image: true }, { key: "logo_dark_url", label: "Dark logo", image: true }, { key: "logo_light_url", label: "Light logo", image: true }, { key: "favicon_url", label: "Favicon", image: true }, { key: "logo_height", label: "Logo height (px)" }, { key: "logo_bg", label: "Logo background" }, { key: "color_plum", label: "Navy background colour (hex)" }, { key: "color_purple", label: "Royal blue colour (hex)" }, { key: "color_orange", label: "Orange accent colour (hex)" }]} /></div>;
  if (section === "security") return <SecurityPanel status={integrationStatus} />;
  if (section === "roles") return <RolesEditor />;
  return <p>This section is not available.</p>;
}

function RolesEditor() {
  return <form className="card space-y-3 p-5" onSubmit={async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const permissionIds = String(form.get("permissions") || "").split(",").map((item) => item.trim()).filter(Boolean);
    const res = await fetch("/api/admin/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "roles", roleId: form.get("roleId"), permissionIds }) });
    const data = await res.json();
    alert(res.ok ? "Role updated." : data.error);
  }}>
    <h1 className="font-display text-4xl text-navy">Roles</h1>
    <p className="text-sm">Super Admin keeps every permission. For another role, paste permission ids separated by commas. Available ids include courses.manage, videos.manage, payments.manage, enquiries.manage, students.view, content.manage.</p>
    <select name="roleId" className="field"><option value="content_manager">Content Manager</option><option value="faculty_manager">Faculty Manager</option><option value="accounts_manager">Accounts Manager</option><option value="support_staff">Support Staff</option></select>
    <textarea name="permissions" className="field" rows={4} placeholder="courses.manage, content.manage" />
    <button className="btn-orange">Save role</button>
  </form>;
}
