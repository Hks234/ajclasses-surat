import bcrypt from "bcryptjs";
import { insert, one, run } from "./db";
import { readIntegrations } from "./secrets";
import { now } from "./utils";

const permissions = [
  ["dashboard.view", "View the admin dashboard"],
  ["settings.manage", "Edit website settings and policies"],
  ["branding.manage", "Manage logos and favicon"],
  ["homepage.manage", "Edit homepage sections and statistics"],
  ["banners.manage", "Manage promotional banners"],
  ["courses.manage", "Manage courses, categories and batches"],
  ["content.manage", "Manage subjects, chapters, notes and announcements"],
  ["videos.manage", "Upload and manage lecture videos"],
  ["tests.manage", "Manage test series, tests and questions"],
  ["students.view", "View student accounts"],
  ["students.manage", "Suspend or restore student accounts"],
  ["faculty.manage", "Manage faculty profiles"],
  ["achievements.manage", "Manage achievements"],
  ["testimonials.manage", "Moderate testimonials"],
  ["enquiries.manage", "Manage enquiries"],
  ["payments.view", "View payments"],
  ["payments.manage", "Refund and export payments"],
  ["coupons.manage", "Manage coupons"],
  ["emails.manage", "Manage email templates and queue"],
  ["media.manage", "Use the media library"],
  ["roles.manage", "Change admin roles"],
  ["logs.view", "View activity logs"],
  ["branches.manage", "Manage branch locations"],
];

const roleMap: Record<string, string[]> = {
  super_admin: permissions.map((p) => p[0]),
  content_manager: [
    "dashboard.view",
    "homepage.manage",
    "banners.manage",
    "courses.manage",
    "content.manage",
    "media.manage",
    "achievements.manage",
    "testimonials.manage",
    "faculty.manage",
    "branding.manage",
  ],
  faculty_manager: ["dashboard.view", "faculty.manage", "videos.manage", "content.manage", "courses.manage"],
  accounts_manager: ["dashboard.view", "payments.view", "payments.manage", "coupons.manage", "students.view"],
  support_staff: ["dashboard.view", "enquiries.manage", "students.view", "content.manage"],
};

const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  content_manager: "Content Manager",
  faculty_manager: "Faculty Manager",
  accounts_manager: "Accounts Manager",
  support_staff: "Support Staff",
};

const categories = [
  ["ca-foundation", "CA Foundation", "The entry level of the Chartered Accountancy course."],
  ["ca-inter", "CA Intermediate", "The intermediate level of the Chartered Accountancy course."],
  ["ca-final", "CA Final", "The final level of the Chartered Accountancy course."],
  ["cma-foundation", "CMA Foundation", "The foundation level of the Cost and Management Accountancy course."],
  ["cma-inter", "CMA Intermediate", "The intermediate level of the Cost and Management Accountancy course."],
  ["cma-final", "CMA Final", "The final level of the Cost and Management Accountancy course."],
  ["cs-eet", "CS CSEET", "The Company Secretary Executive Entrance Test."],
  ["cs-executive", "CS Executive", "The executive level of the Company Secretary course."],
  ["cs-professional", "CS Professional", "The professional level of the Company Secretary course."],
];

async function ensureInitialAdmin(stamp: string) {
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminEmail || !adminPassword) return;
  const existing = await one("SELECT id FROM users WHERE email = ?", [adminEmail.toLowerCase()]);
  if (existing) return;
  const userId = "admin-initial";
  const passwordHash = bcrypt.hashSync(adminPassword, 12);
  await insert("users", {
    id: userId,
    email: adminEmail.toLowerCase(),
    mobile: null,
    password_hash: passwordHash,
    full_name: "AJ Classes Admin",
    role: "admin",
    status: "active",
    email_verified: 1,
    must_change_password: 1,
    google_sub: null,
    avatar_url: null,
    created_at: stamp,
    updated_at: stamp,
    deleted_at: null,
  });
  await insert("admin_users", { user_id: userId, role_id: "super_admin", last_login_at: null });
}

export async function seed() {
  const stamp = now();
  const already = await one("SELECT setting_key FROM website_settings WHERE setting_key = ?", ["institute_name"]);
  if (already) {
    await ensureInitialAdmin(stamp);
    await ensureSiteExtras(stamp);
    return;
  }
  for (const [pid, description] of permissions) {
    const existing = await one("SELECT id FROM permissions WHERE id = ?", [pid]);
    if (!existing) await insert("permissions", { id: pid, description });
  }
  for (const roleId of Object.keys(roleMap)) {
    const existing = await one("SELECT id FROM roles WHERE id = ?", [roleId]);
    if (!existing) {
      await insert("roles", {
        id: roleId,
        name: roleNames[roleId],
        description: roleNames[roleId],
        is_system: 1,
      });
    }
    for (const permissionId of roleMap[roleId]) {
      const link = await one("SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?", [roleId, permissionId]);
      if (!link) await insert("role_permissions", { role_id: roleId, permission_id: permissionId });
    }
  }

  const settings: Record<string, string> = {
    institute_name: "AJ Classes",
    brand_line: "Aditya Jhawar Education",
    tagline: "Learn Today. Lead Tomorrow.",
    email: "info@ajclasses.com",
    phone: "7984344294",
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
    logo_url: "",
    logo_dark_url: "",
    logo_light_url: "",
    favicon_url: "",
    logo_height: "52",
    logo_bg: "transparent",
    completion_threshold: "90",
    lock_completed_lessons: "0",
    support_whatsapp: "917984344294",
    seo_title: "AJ Classes | CA, CS & CMA Coaching",
    seo_description: "AJ Classes by Aditya Jhawar Education. Coaching for CA, CS and CMA in Surat. Learn Today. Lead Tomorrow.",
    footer_about: "AJ Classes is the coaching institute of Aditya Jhawar for CA, CS and CMA students, with classrooms in Surat and an online learning portal.",
    stat_students: "",
    stat_courses: "",
    stat_faculty: "",
    stat_years: "",
    about_html: `<p>AJ Classes is the professional coaching institute of Aditya Jhawar for CA, CS and CMA preparation.</p><p>Students can explore courses, enquire for a batch, purchase published programmes, and learn through the student portal. Course fees, faculty details, results and announcements are published by the institute from the admin dashboard.</p><p>The institute teaches from three Surat branches: Parvat Patiya, Vesu (VIP Road) and Pal (Adajan).</p>`,
    privacy_html: `<p>AJ Classes collects the name, mobile number, email address and course interest that you submit through enquiry, registration and payment forms. This information is used to respond to enquiries, create student accounts, deliver purchased courses and keep payment records.</p><p>Passwords are stored only as hashes. Payment card details are handled by Razorpay and are not stored on this website.</p><p>Student videos and notes are shown only to accounts that have an active purchase. For a privacy request, email info@ajclasses.com.</p>`,
    terms_html: `<p>By creating an account or purchasing a course, you agree to use AJ Classes content for your own study. Access is personal and ends when the published validity period ends, or if the account is suspended for misuse.</p><p>Course fees, batch dates and included materials are the figures published on the course page at the time of payment. The institute can update unpublished or future batches from the admin dashboard.</p><p>These terms are a working policy and can be edited by AJ Classes.</p>`,
    refund_html: `<p>Refund requests are reviewed by AJ Classes against the policy published on this page and applicable law. Contact info@ajclasses.com with the registered email and transaction reference.</p><p>Approved refunds are recorded in the admin payment ledger. If a refund is completed, access to the refunded course or test series is withdrawn.</p><p>Replace this starter text with the institute’s confirmed refund rules before accepting live payments.</p>`,
  };
  for (const [key, value] of Object.entries(settings)) {
    const existing = await one("SELECT setting_key FROM website_settings WHERE setting_key = ?", [key]);
    if (!existing) await insert("website_settings", { setting_key: key, setting_value: value, updated_at: stamp });
  }

  const features = [
    ["India's Youngest CA, CS & CMA", "Aditya Jhawar holds CA, CS and CMA and teaches the programmes himself."],
    ["One Mentor, Three Courses", "Chartered Accountancy, Company Secretary and Cost Accountancy under one faculty team."],
    ["Concepts Before Questions", "Every topic is explained for understanding, then practised the way the exam asks it."],
    ["Surat Classrooms", "Offline batches at Parvat Patiya, Vesu and Pal, with a student portal after you buy a batch."],
    ["Notes With the Batch", "Study material is released with the lectures, not sold as a separate download."],
    ["Exam Practice", "Test series and chapter practice so students know where they stand before the attempt."],
    ["Level by Level", "Foundation, intermediate and final for CA and CMA, and CSEET, Executive and Professional for CS."],
    ["A Counsellor on Call", "Branch desks answer course, batch and book questions before you join."],
  ];
  const hero = await one("SELECT id FROM homepage_sections WHERE section_key = ?", ["hero"]);
  if (!hero) {
    await insert("homepage_sections", {
      id: "section-hero",
      section_key: "hero",
      title: "Your Journey to CA, CS & CMA Starts Here.",
      subtitle: "Learn from India's Youngest CA, CS & CMA Aditya Jhawar and build the professional career you've always dreamed of.",
      body: "",
      image_url: "",
      cta_label: "Explore Our Courses",
      cta_href: "/courses",
      background: "#081B38",
      enabled: 1,
      sort_order: 1,
      extra_json: JSON.stringify({
        highlight: "CA, CS & CMA",
        form_title: "The right course can transform your future.",
        ctas: [
          { label: "Explore Our Courses", href: "/courses" },
          { label: "Enquire Now", href: "/enquiry" },
          { label: "Student Login", href: "/login" },
        ],
        trust: [
          { label: "India's youngest CA, CS and CMA — Aditya Jhawar teaches the course himself" },
          { label: "One mentor for Chartered Accountancy, Company Secretary and Cost Accountancy" },
          { label: "Clear concepts, exam practice and personal guidance at every level" },
        ],
      }),
    });
    await insert("homepage_sections", {
      id: "section-why",
      section_key: "why",
      title: "Why Students Choose Us",
      subtitle: "A structured coaching experience for CA, CS and CMA.",
      body: "",
      image_url: "",
      cta_label: "",
      cta_href: "",
      background: "",
      enabled: 1,
      sort_order: 2,
      extra_json: JSON.stringify(features.map(([title, body]) => ({ title, body }))),
    });
  }

  const branches = [
    ["branch-parvat", "Parvat Patiya", "parvat", "AJ Classes, 2nd & 3rd Floor, Near Nandini Sweets, Kabutar Circle, Parvat Patiya, Surat, Gujarat.", "7984344294", "7984344294", 1],
    ["branch-vesu", "Vesu (VIP Road)", "vesu", "M-12-15, 2nd Floor, Roongta Shopping Centre, Near Vijay Sales, VIP Road, Vesu, Surat, Gujarat.", "7600069918", "7600069918", 2],
    ["branch-pal", "Pal (Adajan)", "pal", "306-307, 3rd Floor, Raj Corner, Opposite Vasu Pujya Residency, Near LP Savani Road, Pal, Adajan, Surat, Gujarat.", "7600069968", "7600069968", 3],
  ];
  for (const [bid, name, code, address, phone, whatsapp, sort] of branches) {
    const existing = await one("SELECT id FROM branches WHERE id = ?", [bid]);
    if (!existing) {
      await insert("branches", {
        id: String(bid),
        name: String(name),
        code: String(code),
        address: String(address),
        phone: String(phone),
        whatsapp: String(whatsapp),
        email: "info@ajclasses.com",
        map_query: String(address),
        sort_order: Number(sort),
        enabled: 1,
      });
    }
  }

  const faculty = await one("SELECT id FROM faculties WHERE id = ?", ["faculty-aditya"]);
  if (!faculty) {
    await insert("faculties", {
      id: "faculty-aditya",
      full_name: "Aditya Jhawar",
      qualification: "CA, CS & CMA",
      specialization: "CA, CS & CMA",
      experience: "",
      biography: "Aditya Jhawar leads AJ Classes for CA, CS and CMA coaching. Qualification details, photograph and biography can be updated from the admin dashboard.",
      subjects: "CA, CS, CMA",
      photo_url: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      sort_order: 1,
      published: 1,
    });
  }

  for (let i = 0; i < categories.length; i++) {
    const [slug, name, description] = categories[i];
    const categoryId = `cat-${slug}`;
    const existingCat = await one("SELECT id FROM course_categories WHERE slug = ?", [slug]);
    if (!existingCat) {
      await insert("course_categories", {
        id: categoryId,
        name,
        slug,
        short_description: description,
        sort_order: i + 1,
        enabled: 1,
      });
    }
    const existingCourse = await one("SELECT id FROM courses WHERE slug = ?", [slug]);
    if (!existingCourse) {
      await insert("courses", {
        id: `course-${slug}`,
        category_id: categoryId,
        name,
        slug,
        thumbnail: "",
        banner: "",
        description,
        highlights: "Batch-wise video lectures\nStudy material inside the student portal\nTest series available separately\nFees published by the institute",
        faculty_id: "faculty-aditya",
        duration: "As scheduled for each batch",
        status: "published",
        seo_title: `${name} Coaching | AJ Classes`,
        seo_description: `${name} coaching at AJ Classes, Aditya Jhawar Education, Surat.`,
        sort_order: i + 1,
        created_at: stamp,
        updated_at: stamp,
        deleted_at: null,
      });
    }
  }

  const demo = await one("SELECT id FROM testimonials WHERE is_demo = 1 LIMIT 1");
  if (!demo) {
    for (let i = 1; i <= 6; i++) {
      await insert("testimonials", {
        id: `demo-review-${i}`,
        student_name: `Sample Student ${i}`,
        photo_url: "",
        course_name: categories[(i - 1) % categories.length][1],
        rating: null,
        review_text: "Demonstration card only. This is not a genuine student review. Replace it after a student submits a review and the institute approves it.",
        review_date: stamp.slice(0, 10),
        status: "approved",
        featured: 1,
        is_demo: 1,
        sort_order: i,
        created_at: stamp,
      });
    }
  }

  const bar = await one("SELECT id FROM announcements WHERE id = ?", ["announce-bar"]);
  if (!bar) {
    await insert("announcements", {
      id: "announce-bar",
      message: "Admissions open for CA, CS and CMA. Enquire for the current batch schedule.",
      href: "/enquiry",
      bg_color: "#071A36",
      text_color: "#FFFFFF",
      start_at: null,
      end_at: null,
      enabled: 1,
      audience: "public",
      kind: "bar",
      sort_order: 1,
      created_at: stamp,
    });
    await insert("announcements", {
      id: "announce-update",
      message: "Batch dates and fees are published by AJ Classes from the admin dashboard. Contact a Surat branch for the latest schedule.",
      href: "/branches",
      bg_color: "#FFF0E4",
      text_color: "#17243A",
      start_at: null,
      end_at: null,
      enabled: 1,
      audience: "public",
      kind: "update",
      sort_order: 1,
      created_at: stamp,
    });
  }

  const templates: [string, string, string][] = [
    [
      "purchase_confirmation",
      "Thank You for Choosing AJ Classes – Your Purchase is Confirmed!",
      `<p>Dear {{student_name}},</p><p>Thank you for choosing AJ Classes for your CA, CS and CMA preparation.</p><p>We are delighted to welcome you to the AJ Classes learning community.</p><p>Your purchase has been successfully confirmed. You can now log in to your student dashboard and begin your learning journey.</p><p><strong>Course:</strong> {{course_name}}<br/><strong>Batch:</strong> {{batch_name}}<br/><strong>Amount:</strong> {{amount}}<br/><strong>Status:</strong> {{status}}<br/><strong>Transaction:</strong> {{transaction_id}}<br/><strong>Date:</strong> {{purchase_date}}</p><p><a href="{{portal_link}}">Open the student portal</a></p><p>We wish you great success in your professional career.</p><p>Regards,<br/>Team AJ Classes<br/>Aditya Jhawar Education.</p>`,
    ],
    [
      "verify_email",
      "Verify your AJ Classes account",
      `<p>Dear {{student_name}},</p><p>Confirm your email address to activate your AJ Classes student account.</p><p><a href="{{verify_link}}">Verify email</a></p><p>If you did not register, you can ignore this email.</p><p>Team AJ Classes</p>`,
    ],
    [
      "password_reset",
      "Reset your AJ Classes password",
      `<p>Dear {{student_name}},</p><p>Use the link below to choose a new password. The link expires in one hour.</p><p><a href="{{reset_link}}">Reset password</a></p><p>Team AJ Classes</p>`,
    ],
    [
      "enquiry_notice",
      "New enquiry received – AJ Classes",
      `<p>A new enquiry was submitted.</p><p><strong>Name:</strong> {{student_name}}<br/><strong>Mobile:</strong> {{mobile}}<br/><strong>Email:</strong> {{email}}<br/><strong>Course:</strong> {{course_name}}<br/><strong>Message:</strong> {{message}}</p>`,
    ],
    [
      "announcement",
      "{{subject}}",
      `<p>Dear {{student_name}},</p><p>{{message}}</p><p>Team AJ Classes</p>`,
    ],
    [
      "test_reminder",
      "Test reminder from AJ Classes",
      `<p>Dear {{student_name}},</p><p>{{message}}</p><p><a href="{{portal_link}}">Open your tests</a></p><p>Team AJ Classes</p>`,
    ],
  ];
  for (const [key, subject, body] of templates) {
    const existing = await one("SELECT id FROM email_templates WHERE template_key = ?", [key]);
    if (!existing) {
      await insert("email_templates", { id: key, template_key: key, subject, body_html: body, updated_at: stamp });
    }
  }

  await ensureInitialAdmin(stamp);
  await ensureSiteExtras(stamp);
}

async function ensureSiteExtras(stamp: string) {
  const extraSettings: Record<string, string> = {
    color_plum: "#071A36",
    color_purple: "#1A4BCC",
    color_orange: "#EE8F22",
    shop_title: "Our Batches",
    shop_subtitle: "Classroom and online batches published by AJ Classes. Choose a batch and continue in the student portal after payment.",
    nav_courses_label: "View Courses",
    nav_shop_label: "Shop",
    nav_resources_label: "Resources",
    nav_enquire_label: "Enquire Now",
    community_title: "Join Our Community",
    community_subtitle: "Stay up to date on courses, batches and classroom updates.",
    counsellor_title: "Our Counsellor Can Clear Any Confusion",
    counsellor_subtitle: "Share your name, course interest and branch. The AJ Classes team will call you back.",
    reviews_title: "Our Students Say We're Gamechangers",
    reviews_kicker: "Reviews",
    reviews_cta: "View More Testimonials",
    faculty_section_title: "Industry Leaders Helping You Find The Way",
    faculty_section_kicker: "Faculty",
    faculty_section_cta: "View More",
    awards_title: "Our Excellence Attested",
    awards_kicker: "Recognition",
    experts_title: "Contact Our Programme Experts",
    why_kicker: "The AJ Classes Advantage",
    about_title: "About AJ Classes",
    about_kicker: "Aditya Jhawar Education",
    courses_intro: "Nine coaching programmes. Fees appear only after a batch is published.",
    faculty_page_title: "Industry Leaders Helping You Find The Way",
    hero_form_title: "The right course can transform your future.",
    trust_line: "Trusted coaching for CA, CS and CMA in Surat",
    nav_resources_json: JSON.stringify([
      { href: "/about", label: "About Us" },
      { href: "/faculty", label: "Faculty" },
      { href: "/achievements", label: "Achievements" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/test-series", label: "Test Series" },
      { href: "/shop", label: "Our Batches" },
      { href: "/books", label: "Books" },
      { href: "/branches", label: "Offline Classrooms" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Student Login" },
    ]),
  };
  for (const [key, value] of Object.entries(extraSettings)) {
    const existing = await one<{ setting_key: string; setting_value: string }>(
      "SELECT setting_key, setting_value FROM website_settings WHERE setting_key = ?",
      [key],
    );
    if (!existing) {
      await insert("website_settings", { setting_key: key, setting_value: value, updated_at: stamp });
      continue;
    }
    if (
      (key === "color_plum" && existing.setting_value.toLowerCase() === "#24082b") ||
      (key === "color_purple" && existing.setting_value.toLowerCase() === "#6c1e74")
    ) {
      await run("UPDATE website_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ?", [value, stamp, key]);
    }
  }

  const extraSections: Array<Record<string, string | number>> = [
    {
      id: "section-programmes",
      section_key: "programmes",
      title: "Explore Our Programmes",
      subtitle: "CA, CS and CMA coaching with classroom batches in Surat and an online student portal.",
      body: "",
      image_url: "",
      cta_label: "View All Programmes",
      cta_href: "/courses",
      background: "",
      enabled: 1,
      sort_order: 3,
      extra_json: JSON.stringify({ kicker: "Our Courses" }),
    },
    {
      id: "section-alumni",
      section_key: "alumni",
      title: "Our Students Learn Here",
      subtitle: "Logos and partner names appear when AJ Classes publishes them from the admin portal.",
      body: "",
      image_url: "",
      cta_label: "",
      cta_href: "",
      background: "",
      enabled: 0,
      sort_order: 4,
      extra_json: JSON.stringify({ kicker: "Classroom & Online" }),
    },
    {
      id: "section-faqs",
      section_key: "faqs",
      title: "You Asked, We Answered",
      subtitle: "Questions students usually ask before joining AJ Classes.",
      body: "",
      image_url: "",
      cta_label: "",
      cta_href: "",
      background: "",
      enabled: 1,
      sort_order: 8,
      extra_json: "{}",
    },
    {
      id: "section-community",
      section_key: "community",
      title: "Join Our Community",
      subtitle: "Stay up to date on courses, batches and events.",
      body: "",
      image_url: "",
      cta_label: "Notify me",
      cta_href: "/enquiry",
      background: "",
      enabled: 1,
      sort_order: 9,
      extra_json: "{}",
    },
    {
      id: "section-counsellor",
      section_key: "counsellor",
      title: "Our Counsellor Can Clear Any Confusion",
      subtitle: "Contact a programme desk or send an enquiry. Branch numbers are published by the institute.",
      body: "",
      image_url: "",
      cta_label: "Enquire Now",
      cta_href: "/enquiry",
      background: "",
      enabled: 1,
      sort_order: 10,
      extra_json: "{}",
    },
    {
      id: "section-shop",
      section_key: "shop",
      title: "Our Batches",
      subtitle: "Classroom and online batches published by AJ Classes. Choose a batch and continue in the student portal after payment.",
      body: "",
      image_url: "",
      cta_label: "View our batches",
      cta_href: "/shop",
      background: "",
      enabled: 1,
      sort_order: 5,
      extra_json: JSON.stringify({ kicker: "Our Batches" }),
    },
    {
      id: "section-placement",
      section_key: "placement",
      title: "Classroom Coaching, Online Learning",
      subtitle: "Figures on this row are published by AJ Classes from the admin portal.",
      body: "",
      image_url: "",
      cta_label: "View Achievements",
      cta_href: "/achievements",
      background: "",
      enabled: 0,
      sort_order: 6,
      extra_json: JSON.stringify({ kicker: "Results" }),
    },
    {
      id: "section-events",
      section_key: "events",
      title: "Building Futures Beyond The Classroom",
      subtitle: "Events and campus highlights published by AJ Classes.",
      body: "",
      image_url: "",
      cta_label: "",
      cta_href: "",
      background: "",
      enabled: 1,
      sort_order: 7,
      extra_json: JSON.stringify({ kicker: "Campus" }),
    },
    {
      id: "section-reviews",
      section_key: "reviews",
      title: "Our Students Say We're Gamechangers",
      subtitle: "Approved student reviews. Demonstration cards are labelled until genuine reviews are published.",
      body: "",
      image_url: "",
      cta_label: "View More Testimonials",
      cta_href: "/testimonials",
      background: "",
      enabled: 1,
      sort_order: 11,
      extra_json: JSON.stringify({ kicker: "Reviews" }),
    },
    {
      id: "section-faculty-home",
      section_key: "faculty_home",
      title: "Industry Leaders Helping You Find The Way",
      subtitle: "Faculty profiles are published from the admin portal.",
      body: "",
      image_url: "",
      cta_label: "View More",
      cta_href: "/faculty",
      background: "",
      enabled: 1,
      sort_order: 12,
      extra_json: JSON.stringify({ kicker: "Faculty" }),
    },
  ];
  for (const section of extraSections) {
    const existing = await one("SELECT id FROM homepage_sections WHERE section_key = ?", [section.section_key]);
    if (!existing) await insert("homepage_sections", section);
  }

  const faqs: [string, string, string, number][] = [
    ["faq-1", "Why should I choose AJ Classes for CA, CS and CMA?", "AJ Classes is the coaching institute of Aditya Jhawar for CA, CS and CMA, with classrooms in Surat and an online student portal for purchased batches. Faculty, fees and schedules are published from the admin dashboard.", 1],
    ["faq-2", "How do I buy a course and start learning?", "Open Shop or a course page, choose a published batch with a fee, and complete checkout. After payment, lectures and notes appear in the student portal for that batch.", 2],
    ["faq-3", "What learning support is provided?", "Purchased batches include recorded lectures, notes the institute uploads, and published test series. Classroom support is available at the Parvat Patiya, Vesu and Pal branches.", 3],
    ["faq-4", "Is there a refund policy?", "Refund requests are reviewed against the policy published on the Refund Policy page. Write to the institute email with your registered address and payment reference.", 4],
    ["faq-5", "How do I speak to a counsellor?", "Use Enquire Now, WhatsApp, or call the branch numbers listed on the Contact and Branches pages.", 5],
  ];
  for (const [id, question, answer, sort] of faqs) {
    const existing = await one("SELECT id FROM faqs WHERE id = ?", [id]);
    if (!existing) {
      await insert("faqs", { id, question, answer, sort_order: sort, enabled: 1, created_at: stamp });
    }
  }

  const heroRow = await one<any>("SELECT * FROM homepage_sections WHERE section_key = ?", ["hero"]);
  if (heroRow) {
    let extra: any = {};
    try { extra = JSON.parse(heroRow.extra_json || "{}") || {}; } catch { extra = {}; }
    const labels = Array.isArray(extra.trust) ? extra.trust.map((item: any) => String(item?.label || "")) : [];
    const retiredTrust = /classroom batches in parvat|student portal for purchased|programmes taught by aditya jhawar/i;
    if (!labels.length || labels.some((label: string) => retiredTrust.test(label))) {
      extra.highlight = extra.highlight || "CA, CS & CMA";
      extra.form_title = extra.form_title || "The right course can transform your future.";
      extra.trust = [
        { label: "India's youngest CA, CS and CMA — Aditya Jhawar teaches the course himself" },
        { label: "One mentor for Chartered Accountancy, Company Secretary and Cost Accountancy" },
        { label: "Clear concepts, exam practice and personal guidance at every level" },
      ];
      extra.ctas = extra.ctas?.length ? extra.ctas : [
        { label: heroRow.cta_label || "Explore Our Courses", href: heroRow.cta_href || "/courses" },
        { label: "Enquire Now", href: "/enquiry" },
      ];
      await run("UPDATE homepage_sections SET extra_json = ? WHERE id = ?", [JSON.stringify(extra), heroRow.id]);
    }
  }
  await run("UPDATE courses SET name = ?, seo_title = ?, seo_description = ?, description = ?, updated_at = ? WHERE slug = ? AND name IN ('CS-EET', 'CS EET', 'CSEET')", [
    "CS CSEET",
    "CS CSEET Coaching | AJ Classes",
    "CS CSEET coaching at AJ Classes, Aditya Jhawar Education, Surat.",
    "The Company Secretary Executive Entrance Test.",
    stamp,
    "cs-eet",
  ]);
  await run("UPDATE course_categories SET name = ?, short_description = ? WHERE slug = ? AND name IN ('CS-EET', 'CS EET', 'CSEET')", [
    "CS CSEET",
    "The Company Secretary Executive Entrance Test.",
    "cs-eet",
  ]);
  const navRow = await one<{ setting_value: string }>("SELECT setting_value FROM website_settings WHERE setting_key = ?", ["nav_resources_json"]);
  if (navRow && !String(navRow.setting_value || "").includes('"/books"') && !String(navRow.setting_value || "").includes("'/books'")) {
    await run("UPDATE website_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ?", [
      JSON.stringify([
        { href: "/about", label: "About Us" },
        { href: "/faculty", label: "Faculty" },
        { href: "/achievements", label: "Achievements" },
        { href: "/testimonials", label: "Testimonials" },
        { href: "/test-series", label: "Test Series" },
        { href: "/shop", label: "Our Batches" },
        { href: "/books", label: "Books" },
        { href: "/branches", label: "Offline Classrooms" },
        { href: "/contact", label: "Contact" },
        { href: "/login", label: "Student Login" },
      ]),
      stamp,
      "nav_resources_json",
    ]);
  }
  await run(
    "UPDATE homepage_sections SET title = ?, subtitle = ?, extra_json = ? WHERE section_key = 'why' AND extra_json LIKE ?",
    [
      "Why Students Choose Us",
      "Coaching led by Aditya Jhawar for CA, CS and CMA.",
      JSON.stringify([
        { title: "India's Youngest CA, CS & CMA", body: "Aditya Jhawar holds CA, CS and CMA and teaches the programmes himself." },
        { title: "One Mentor, Three Courses", body: "Chartered Accountancy, Company Secretary and Cost Accountancy under one faculty team." },
        { title: "Concepts Before Questions", body: "Every topic is explained for understanding, then practised the way the exam asks it." },
        { title: "Surat Classrooms", body: "Offline batches at Parvat Patiya, Vesu and Pal, with a student portal after you buy a batch." },
        { title: "Notes With the Batch", body: "Study material is released with the lectures, not sold as a separate download." },
        { title: "Exam Practice", body: "Test series and chapter practice so students know where they stand before the attempt." },
        { title: "Level by Level", body: "Foundation, intermediate and final for CA and CMA, and CSEET, Executive and Professional for CS." },
        { title: "A Counsellor on Call", body: "Branch desks answer course, batch and book questions before you join." },
      ]),
      "%Expert Guidance%",
    ],
  );
  if (!readIntegrations().smtpHost) {
    await run("UPDATE users SET email_verified = 1, updated_at = ? WHERE role = 'student' AND password_hash IS NOT NULL AND password_hash <> '' AND email_verified = 0", [stamp]);
  }
  await run("UPDATE homepage_sections SET enabled = 0 WHERE section_key IN ('alumni', 'placement')");
  await run(
    "UPDATE homepage_sections SET title = ? WHERE section_key = 'why' AND title LIKE ?",
    ["Why Students Choose Us", "%Why Students Choose AJ Classes%"],
  );
  await run(
    "UPDATE homepage_sections SET title = ?, subtitle = ?, cta_label = ?, extra_json = ? WHERE section_key = 'shop' AND (title LIKE ? OR title LIKE ? OR cta_label LIKE ?)",
    [
      "Our Batches",
      "Classroom and online batches published by AJ Classes. Choose a batch and continue in the student portal after payment.",
      "View our batches",
      JSON.stringify({ kicker: "Our Batches" }),
      "%Buy a published%",
      "%Open the shop%",
      "%Open the shop%",
    ],
  );
  for (const [key, value, pattern] of [
    ["shop_title", "Our Batches", "%Buy a published%"],
    ["shop_subtitle", "Classroom and online batches published by AJ Classes. Choose a batch and continue in the student portal after payment.", "%Pay for a live batch%"],
  ] as const) {
    await run("UPDATE website_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ? AND setting_value LIKE ?", [value, stamp, key, pattern]);
  }
  const bar = await one<any>("SELECT * FROM announcements WHERE id = ?", ["announce-bar"]);
  if (bar && (!bar.bg_color || ["#24082b", "#24082B", "#102A56"].includes(bar.bg_color))) {
    await run("UPDATE announcements SET bg_color = ? WHERE id = ?", ["#071A36", bar.id]);
  }
}
