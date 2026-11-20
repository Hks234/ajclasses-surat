export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "money" | "select" | "boolean" | "date" | "email" | "url" | "image" | "password";
  required?: boolean;
  virtual?: boolean;
  options?: { label: string; value: string }[];
  optionsFrom?: { table: string; value: string; label: string; where?: string };
  list?: boolean;
};

export type Resource = {
  key: string;
  title: string;
  table: string;
  permission: string;
  fields: Field[];
  columns: string[];
  search?: string[];
  orderBy: string;
  softDelete?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
  readOnly?: boolean;
  fixed?: Record<string, string | number>;
};

const published = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Hidden", value: "hidden" },
];

export const resources: Record<string, Resource> = {
  banners: {
    key: "banners", title: "Promotional banners", table: "promotional_banners", permission: "banners.manage",
    orderBy: "sort_order, created_at DESC",
    columns: ["id", "title", "placement", "enabled", "sort_order", "start_at", "end_at", "image_desktop"],
    search: ["title", "description"],
    fields: [
      { name: "title", label: "Title", type: "text", list: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "href", label: "Destination URL", type: "text" },
      { name: "image_desktop", label: "Desktop image", type: "image", required: true, list: true },
      { name: "image_mobile", label: "Mobile image", type: "image" },
      { name: "duration_ms", label: "Display duration (ms)", type: "number" },
      { name: "animation", label: "Animation", type: "select", options: [{ label: "Fade", value: "fade" }, { label: "Slide", value: "slide" }] },
      { name: "placement", label: "Placement", type: "select", options: [{ label: "Homepage top", value: "home_top" }, { label: "Homepage middle", value: "home_mid" }, { label: "Course pages", value: "course" }] },
      { name: "start_at", label: "Start", type: "date" },
      { name: "end_at", label: "Expiry", type: "date" },
      { name: "sort_order", label: "Order", type: "number", list: true },
      { name: "enabled", label: "Enabled", type: "boolean", list: true },
    ],
  },
  courses: {
    key: "courses", title: "Courses", table: "courses", permission: "courses.manage", softDelete: true,
    orderBy: "sort_order, name", search: ["name", "slug"],
    columns: ["id", "name", "slug", "status", "category_id", "sort_order"],
    fields: [
      { name: "name", label: "Course name", type: "text", required: true, list: true },
      { name: "slug", label: "URL slug", type: "text", required: true, list: true },
      { name: "category_id", label: "Category", type: "select", required: true, optionsFrom: { table: "course_categories", value: "id", label: "name" } },
      { name: "thumbnail", label: "Thumbnail", type: "image" },
      { name: "banner", label: "Banner", type: "image" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "highlights", label: "Highlights (one per line)", type: "textarea" },
      { name: "faculty_id", label: "Faculty", type: "select", optionsFrom: { table: "faculties", value: "id", label: "full_name" } },
      { name: "duration", label: "Duration", type: "text" },
      { name: "badge", label: "Card badge (e.g. Most Popular)", type: "text", list: true },
      { name: "learning_mode", label: "Learning options line", type: "text" },
      { name: "career_line", label: "Career / seats line", type: "text" },
      { name: "brochure_url", label: "Brochure file or URL", type: "url" },
      { name: "status", label: "Status", type: "select", options: published, list: true },
      { name: "seo_title", label: "SEO title", type: "text" },
      { name: "seo_description", label: "SEO description", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  categories: {
    key: "categories", title: "Course categories", table: "course_categories", permission: "courses.manage",
    orderBy: "sort_order, name", columns: ["id", "name", "slug", "enabled", "sort_order"], search: ["name"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, list: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "short_description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "enabled", label: "Enabled", type: "boolean", list: true },
    ],
  },
  batches: {
    key: "batches", title: "Batches", table: "batches", permission: "courses.manage", softDelete: true,
    orderBy: "created_at DESC", search: ["name"],
    columns: ["id", "name", "course_id", "price_paise", "status", "seats", "seats_sold"],
    fields: [
      { name: "name", label: "Batch name", type: "text", required: true, list: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "course_id", label: "Course", type: "select", required: true, optionsFrom: { table: "courses", value: "id", label: "name", where: "deleted_at IS NULL" } },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date" },
      { name: "price_paise", label: "Selling price (₹)", type: "money", required: true, list: true },
      { name: "compare_at_paise", label: "Original price (₹)", type: "money" },
      { name: "seats", label: "Seats (0 = no limit)", type: "number" },
      { name: "validity_days", label: "Access validity (days)", type: "number" },
      { name: "faculty_id", label: "Faculty", type: "select", optionsFrom: { table: "faculties", value: "id", label: "full_name" } },
      { name: "status", label: "Status", type: "select", options: published, list: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  subjects: {
    key: "subjects", title: "Subjects", table: "subjects", permission: "content.manage",
    orderBy: "sort_order, name", columns: ["id", "name", "batch_id", "sort_order"], search: ["name"],
    fields: [
      { name: "name", label: "Subject", type: "text", required: true, list: true },
      { name: "batch_id", label: "Batch", type: "select", required: true, optionsFrom: { table: "batches", value: "id", label: "name", where: "deleted_at IS NULL" } },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  chapters: {
    key: "chapters", title: "Chapters", table: "chapters", permission: "content.manage",
    orderBy: "sort_order, name", columns: ["id", "name", "subject_id", "sort_order"], search: ["name"],
    fields: [
      { name: "name", label: "Chapter", type: "text", required: true, list: true },
      { name: "subject_id", label: "Subject", type: "select", required: true, optionsFrom: { table: "subjects", value: "id", label: "name" } },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  materials: {
    key: "materials", title: "Notes and study material", table: "study_materials", permission: "content.manage",
    orderBy: "created_at DESC", columns: ["id", "title", "batch_id", "published", "allow_download"], search: ["title"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, list: true },
      { name: "course_id", label: "Course", type: "select", optionsFrom: { table: "courses", value: "id", label: "name", where: "deleted_at IS NULL" } },
      { name: "batch_id", label: "Batch", type: "select", optionsFrom: { table: "batches", value: "id", label: "name", where: "deleted_at IS NULL" } },
      { name: "subject_id", label: "Subject", type: "select", optionsFrom: { table: "subjects", value: "id", label: "name" } },
      { name: "chapter_id", label: "Chapter", type: "select", optionsFrom: { table: "chapters", value: "id", label: "name" } },
      { name: "file_path", label: "File", type: "image", required: true },
      { name: "allow_download", label: "Allow download", type: "boolean", list: true },
      { name: "published", label: "Published", type: "boolean", list: true },
    ],
  },
  "test-series": {
    key: "test-series", title: "Test series", table: "test_series", permission: "tests.manage", softDelete: true,
    orderBy: "created_at DESC", search: ["title"],
    columns: ["id", "title", "price_paise", "status", "course_id"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, list: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "course_id", label: "Course", type: "select", optionsFrom: { table: "courses", value: "id", label: "name", where: "deleted_at IS NULL" } },
      { name: "category_id", label: "Category", type: "select", optionsFrom: { table: "course_categories", value: "id", label: "name" } },
      { name: "subject", label: "Subject", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "thumbnail", label: "Thumbnail", type: "image" },
      { name: "price_paise", label: "Price (₹)", type: "money", list: true },
      { name: "compare_at_paise", label: "Original price (₹)", type: "money" },
      { name: "validity_days", label: "Validity days", type: "number" },
      { name: "instructions", label: "Instructions", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: published, list: true },
      { name: "seo_title", label: "SEO title", type: "text" },
      { name: "seo_description", label: "SEO description", type: "textarea" },
    ],
  },
  tests: {
    key: "tests", title: "Tests", table: "tests", permission: "tests.manage",
    orderBy: "created_at DESC", search: ["title"], columns: ["id", "title", "series_id", "published", "duration_minutes"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, list: true },
      { name: "series_id", label: "Test series", type: "select", required: true, optionsFrom: { table: "test_series", value: "id", label: "title", where: "deleted_at IS NULL" } },
      { name: "duration_minutes", label: "Duration minutes", type: "number" },
      { name: "scheduled_at", label: "Schedule", type: "date" },
      { name: "result_publish_at", label: "Publish results", type: "date" },
      { name: "allow_review", label: "Allow review", type: "boolean" },
      { name: "published", label: "Published", type: "boolean", list: true },
      { name: "instructions", label: "Instructions", type: "textarea" },
    ],
  },
  faculty: {
    key: "faculty", title: "Faculty", table: "faculties", permission: "faculty.manage",
    orderBy: "sort_order, full_name", search: ["full_name"],
    columns: ["id", "full_name", "qualification", "published", "sort_order"],
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true, list: true },
      { name: "qualification", label: "Qualification", type: "text", list: true },
      { name: "specialization", label: "Specialization", type: "text" },
      { name: "experience", label: "Experience", type: "text" },
      { name: "biography", label: "Biography", type: "textarea" },
      { name: "subjects", label: "Subjects", type: "text" },
      { name: "photo_url", label: "Photograph", type: "image" },
      { name: "instagram", label: "Instagram", type: "url" },
      { name: "linkedin", label: "LinkedIn", type: "url" },
      { name: "youtube", label: "YouTube", type: "url" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "published", label: "Published", type: "boolean", list: true },
    ],
  },
  achievements: {
    key: "achievements", title: "Achievements", table: "achievements", permission: "achievements.manage",
    orderBy: "sort_order, event_date DESC", search: ["title"],
    columns: ["id", "title", "category", "featured", "enabled"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, list: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image_url", label: "Image", type: "image" },
      { name: "event_date", label: "Date", type: "date" },
      { name: "category", label: "Category / course tag", type: "text" },
      { name: "city", label: "City or branch", type: "text" },
      { name: "paper", label: "Paper / subject tag", type: "text" },
      { name: "rank_line", label: "Rank line (e.g. 01 All India)", type: "text" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "enabled", label: "Visible", type: "boolean", list: true },
    ],
  },
  testimonials: {
    key: "testimonials", title: "Testimonials", table: "testimonials", permission: "testimonials.manage",
    orderBy: "sort_order, created_at DESC", search: ["student_name", "review_text"],
    columns: ["id", "student_name", "course_name", "status", "is_demo", "featured"],
    fields: [
      { name: "student_name", label: "Student name", type: "text", required: true, list: true },
      { name: "photo_url", label: "Photo", type: "image" },
      { name: "course_name", label: "Course", type: "text" },
      { name: "rating", label: "Rating (1-5, blank if not given)", type: "number" },
      { name: "review_text", label: "Review", type: "textarea", required: true },
      { name: "review_date", label: "Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: [{ label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }], list: true },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "is_demo", label: "Demonstration content", type: "boolean", list: true },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  enquiries: {
    key: "enquiries", title: "Enquiries", table: "enquiries", permission: "enquiries.manage",
    allowCreate: false, orderBy: "created_at DESC", search: ["full_name", "email", "mobile"],
    columns: ["id", "full_name", "mobile", "email", "course_interest", "status", "created_at"],
    fields: [
      { name: "status", label: "Status", type: "select", options: [
        { label: "New", value: "new" }, { label: "Contacted", value: "contacted" }, { label: "Interested", value: "interested" }, { label: "Converted", value: "converted" }, { label: "Not Interested", value: "not_interested" },
      ], list: true },
      { name: "assigned_to", label: "Assigned admin id", type: "text" },
    ],
  },
  coupons: {
    key: "coupons", title: "Coupons", table: "coupons", permission: "coupons.manage",
    orderBy: "created_at DESC", search: ["code"], columns: ["id", "code", "discount_type", "discount_value", "active"],
    fields: [
      { name: "code", label: "Code", type: "text", required: true, list: true },
      { name: "discount_type", label: "Type", type: "select", options: [{ label: "Percent", value: "percent" }, { label: "Fixed paise amount entered in ₹", value: "fixed" }] },
      { name: "discount_value", label: "Percent or fixed ₹", type: "number", required: true },
      { name: "max_discount_paise", label: "Maximum discount ₹", type: "money" },
      { name: "expires_at", label: "Expiry", type: "date" },
      { name: "min_order_paise", label: "Minimum order ₹", type: "money" },
      { name: "usage_limit", label: "Usage limit (0 = unlimited)", type: "number" },
      { name: "per_user_limit", label: "Per student limit", type: "number" },
      { name: "applicable_json", label: "Product ids JSON or [\"all\"]", type: "textarea" },
      { name: "active", label: "Active", type: "boolean", list: true },
    ],
  },
  branches: {
    key: "branches", title: "Branches", table: "branches", permission: "branches.manage",
    orderBy: "sort_order", columns: ["id", "name", "phone", "enabled"], search: ["name", "address"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, list: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "address", label: "Address", type: "textarea", required: true },
      { name: "phone", label: "Phone", type: "text", required: true, list: true },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "map_query", label: "Map search text", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "enabled", label: "Visible", type: "boolean" },
    ],
  },
  announcements: {
    key: "announcements", title: "Announcements", table: "announcements", permission: "content.manage",
    orderBy: "sort_order, created_at DESC", search: ["message"],
    columns: ["id", "message", "kind", "enabled", "audience"],
    fields: [
      { name: "message", label: "Message", type: "textarea", required: true, list: true },
      { name: "href", label: "Link", type: "text" },
      { name: "bg_color", label: "Background colour", type: "text" },
      { name: "text_color", label: "Text colour", type: "text" },
      { name: "start_at", label: "Start", type: "date" },
      { name: "end_at", label: "End", type: "date" },
      { name: "kind", label: "Kind", type: "select", options: [{ label: "Top bar", value: "bar" }, { label: "Update card", value: "update" }, { label: "Student notice", value: "student" }] },
      { name: "audience", label: "Audience", type: "select", options: [{ label: "Public", value: "public" }, { label: "Students", value: "student" }] },
      { name: "enabled", label: "Enabled", type: "boolean", list: true },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  homepage: {
    key: "homepage", title: "Homepage sections", table: "homepage_sections", permission: "homepage.manage",
    allowCreate: false, allowDelete: false, orderBy: "sort_order",
    columns: ["id", "section_key", "title", "enabled", "sort_order"],
    fields: [
      { name: "title", label: "Heading", type: "textarea", list: true },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "image_url", label: "Image", type: "image" },
      { name: "cta_label", label: "Primary CTA label", type: "text" },
      { name: "cta_href", label: "Primary CTA link", type: "text" },
      { name: "background", label: "Background", type: "text" },
      { name: "extra_json", label: "Extra JSON (hero CTAs, trust, stats, or advantage cards with title/body/image)", type: "textarea" },
      { name: "enabled", label: "Visible", type: "boolean" },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  emails: {
    key: "emails", title: "Email templates", table: "email_templates", permission: "emails.manage",
    allowCreate: false, allowDelete: false, orderBy: "template_key",
    columns: ["id", "template_key", "subject"],
    fields: [
      { name: "subject", label: "Subject", type: "text", required: true, list: true },
      { name: "body_html", label: "HTML body", type: "textarea", required: true },
    ],
  },
  students: {
    key: "students", title: "Students", table: "users", permission: "students.manage",
    allowCreate: true, allowDelete: false, fixed: { role: "student" },
    orderBy: "created_at DESC", search: ["full_name", "email", "mobile"],
    columns: ["id", "full_name", "email", "mobile", "status", "email_verified", "created_at"],
    fields: [
      { name: "full_name", label: "Name", type: "text", required: true, list: true },
      { name: "email", label: "Login email", type: "email", required: true, list: true },
      { name: "mobile", label: "Mobile", type: "text", list: true },
      { name: "password", label: "Password for email login", type: "password", virtual: true },
      { name: "status", label: "Status", type: "select", options: [{ label: "Active", value: "active" }, { label: "Suspended", value: "suspended" }], list: true },
      { name: "email_verified", label: "Email verified", type: "boolean" },
    ],
  },
  logs: {
    key: "logs", title: "Activity logs", table: "admin_activity_logs", permission: "logs.view",
    readOnly: true, allowCreate: false, allowDelete: false, orderBy: "created_at DESC",
    columns: ["id", "action", "entity", "entity_id", "admin_id", "created_at"],
    fields: [],
  },
  payments: {
    key: "payments", title: "Payments", table: "payments", permission: "payments.view",
    readOnly: true, allowCreate: false, allowDelete: false, orderBy: "created_at DESC",
    search: ["id", "razorpay_order_id", "razorpay_payment_id", "status"],
    columns: ["id", "user_id", "amount_paise", "status", "provider", "razorpay_payment_id", "created_at"],
    fields: [],
  },
  refunds: {
    key: "refunds", title: "Refunds", table: "refunds", permission: "payments.manage",
    readOnly: true, allowCreate: false, allowDelete: false, orderBy: "created_at DESC",
    columns: ["id", "payment_id", "amount_paise", "status", "reason", "created_at"],
    fields: [],
  },
  "email-queue": {
    key: "email-queue", title: "Email queue", table: "email_queue", permission: "emails.manage",
    readOnly: true, allowCreate: false, allowDelete: false, orderBy: "created_at DESC",
    columns: ["id", "to_email", "subject", "status", "attempts", "last_error", "created_at"],
    fields: [],
  },
  faqs: {
    key: "faqs", title: "FAQs", table: "faqs", permission: "homepage.manage",
    orderBy: "sort_order, created_at DESC", search: ["question", "answer"],
    columns: ["id", "question", "enabled", "sort_order"],
    fields: [
      { name: "question", label: "Question", type: "text", required: true, list: true },
      { name: "answer", label: "Answer", type: "textarea", required: true },
      { name: "sort_order", label: "Order", type: "number", list: true },
      { name: "enabled", label: "Visible", type: "boolean", list: true },
    ],
  },
  events: {
    key: "events", title: "Events & highlights", table: "site_events", permission: "homepage.manage",
    orderBy: "sort_order, created_at DESC", search: ["title", "body"],
    columns: ["id", "title", "enabled", "sort_order"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, list: true },
      { name: "subtitle", label: "Label / kicker", type: "text" },
      { name: "body", label: "Description", type: "textarea" },
      { name: "image_url", label: "Image", type: "image" },
      { name: "href", label: "Link (optional)", type: "url" },
      { name: "sort_order", label: "Order", type: "number", list: true },
      { name: "enabled", label: "Visible", type: "boolean", list: true },
    ],
  },
  partners: {
    key: "partners", title: "Partner & alumni logos", table: "partners", permission: "homepage.manage",
    orderBy: "sort_order, name", search: ["name"],
    columns: ["id", "name", "kind", "enabled", "sort_order"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, list: true },
      { name: "logo_url", label: "Logo", type: "image" },
      { name: "href", label: "Link (optional)", type: "url" },
      { name: "kind", label: "Row", type: "select", options: [
        { label: "Alumni / companies", value: "alumni" },
        { label: "Universities", value: "university" },
        { label: "Awards", value: "award" },
      ], list: true },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "enabled", label: "Visible", type: "boolean", list: true },
    ],
  },
  books: {
    key: "books", title: "Books (physical shipping)", table: "books", permission: "courses.manage", softDelete: true,
    orderBy: "sort_order, title", search: ["title", "description"],
    columns: ["id", "title", "price_paise", "stock", "status"],
    fields: [
      { name: "title", label: "Book title", type: "text", required: true, list: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image_url", label: "Cover image", type: "image" },
      { name: "price_paise", label: "Selling price (₹)", type: "money", required: true, list: true },
      { name: "compare_at_paise", label: "Original price (₹)", type: "money" },
      { name: "stock", label: "Copies in stock", type: "number", required: true, list: true },
      { name: "status", label: "Status", type: "select", options: published, list: true },
      { name: "sort_order", label: "Order", type: "number" },
    ],
  },
  shipments: {
    key: "shipments", title: "Book shipments", table: "book_shipments", permission: "courses.manage",
    allowCreate: false, allowDelete: false,
    orderBy: "created_at DESC", search: ["title", "buyer_name", "phone", "city", "pincode", "tracking"],
    columns: ["id", "title", "buyer_name", "phone", "city", "pincode", "status", "tracking", "created_at"],
    fields: [
      { name: "status", label: "Shipping status", type: "select", options: [
        { label: "Pending dispatch", value: "pending" },
        { label: "Packed", value: "packed" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Awaiting stock", value: "awaiting_stock" },
      ], list: true },
      { name: "tracking", label: "Tracking number", type: "text", list: true },
      { name: "notes", label: "Internal notes", type: "textarea" },
    ],
  },
  media: {
    key: "media", title: "Media library", table: "media_assets", permission: "media.manage",
    allowCreate: false, orderBy: "created_at DESC", search: ["original_name", "alt"],
    columns: ["id", "original_name", "mime", "size_bytes", "created_at"],
    fields: [{ name: "alt", label: "Alt text", type: "text" }, { name: "folder", label: "Folder", type: "text" }],
  },
};

export function resourceByKey(key: string) {
  return resources[key] || null;
}
