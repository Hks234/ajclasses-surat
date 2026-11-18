export const defaultCourses = [
  { id: "ca-foundation", slug: "ca-foundation", name: "CA Foundation", description: "The entry level of the Chartered Accountancy course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "ca-intermediate", slug: "ca-intermediate", name: "CA Intermediate", description: "The intermediate level of the Chartered Accountancy course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "ca-final", slug: "ca-final", name: "CA Final", description: "The final level of the Chartered Accountancy course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "cma-foundation", slug: "cma-foundation", name: "CMA Foundation", description: "The foundation level of the Cost and Management Accountancy course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "cma-intermediate", slug: "cma-intermediate", name: "CMA Intermediate", description: "The intermediate level of the Cost and Management Accountancy course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "cma-final", slug: "cma-final", name: "CMA Final", description: "The final level of the Cost and Management Accountancy course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "cs-eet", slug: "cs-eet", name: "CS-EET", description: "The CS Executive Entrance Test.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "cs-executive", slug: "cs-executive", name: "CS Executive", description: "The executive level of the Company Secretary course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
  { id: "cs-professional", slug: "cs-professional", name: "CS Professional", description: "The professional level of the Company Secretary course.", thumbnail: "", badge: "", duration: "", learning_mode: "Classroom & student portal", career_line: "", start_price: 0, brochure_url: "" },
];

export const defaultBranches = [
  { id: "branch-parvat", name: "Parvat Patiya", address: "AJ Classes, 2nd & 3rd Floor, Near Nandini Sweets, Kabutar Circle, Parvat Patiya, Surat, Gujarat.", phone: "7984344294", whatsapp: "7984344294" },
  { id: "branch-vesu", name: "Vesu (VIP Road)", address: "M-12-15, 2nd Floor, Roongta Shopping Centre, Near Vijay Sales, VIP Road, Vesu, Surat, Gujarat.", phone: "7600069918", whatsapp: "7600069918" },
  { id: "branch-pal", name: "Pal (Adajan)", address: "306-307, 3rd Floor, Raj Corner, Opposite Vasu Pujya Residency, Near LP Savani Road, Pal, Adajan, Surat, Gujarat.", phone: "7600069968", whatsapp: "7600069968" },
];

export const defaultFaculty = [
  { id: "faculty-aditya", full_name: "Aditya Jhawar", qualification: "CA, CS, CMA, B. COM., M. COM.", photo_url: "", specialization: "CA, CS & CMA" },
  { id: "faculty-urja", full_name: "Urja Jhawar", qualification: "CA, M.Com, CFBS", photo_url: "", specialization: "CA" },
  { id: "faculty-pooja", full_name: "Pooja Jhawar", qualification: "CA & CMA (FINALIST), BBA MBA (PUR.)", photo_url: "", specialization: "CA & CMA" },
];

export const defaultTestimonials = [
  { id: "review-1", student_name: "Rahul Sharma", course_name: "CA Student", review_text: "AJ Classes made complex accounting concepts so easy to understand. The teaching approach is excellent, and the study material is very helpful.", rating: 5, photo_url: "", is_demo: 1 },
  { id: "review-2", student_name: "Priya Verma", course_name: "CS Student", review_text: "The classes provide excellent conceptual clarity. I feel much more confident preparing for my CS examinations.", rating: 5, photo_url: "", is_demo: 1 },
  { id: "review-3", student_name: "Aman Gupta", course_name: "CMA FINAL", review_text: "One of the best learning experiences! The faculty explains every topic with practical examples and makes difficult subjects easier.", rating: 5, photo_url: "", is_demo: 1 },
];

export const defaultFaqs = [
  { id: "faq-1", question: "Why should I choose AJ Classes for CA, CS and CMA?", answer: "AJ Classes is the coaching institute of Aditya Jhawar for CA, CS and CMA, with classrooms in Surat and an online student portal for purchased batches." },
  { id: "faq-2", question: "How do I buy a course and start learning?", answer: "Open Shop or a course page, choose a published batch with a fee, and complete checkout. After payment, lectures and notes appear in the student portal." },
  { id: "faq-3", question: "What learning support is provided?", answer: "Purchased batches include recorded lectures, notes and published test series. Classroom support is available at the Parvat Patiya, Vesu and Pal branches." },
  { id: "faq-4", question: "Is there a refund policy?", answer: "Refund requests are reviewed against the policy published on the Refund Policy page." },
  { id: "faq-5", question: "How do I speak to a counsellor?", answer: "Use Enquire Now, WhatsApp, or call the branch numbers listed on the Contact and Branches pages." },
];

export const defaultFeatures = [
  { title: "Expert Guidance", body: "Classes led by the AJ Classes faculty team." },
  { title: "Structured Learning", body: "Subjects, chapters and lessons arranged batch by batch." },
  { title: "Concept-Based Teaching", body: "Lectures focused on understanding the concept before the question." },
  { title: "Quality Study Material", body: "Notes and practice files released inside the student portal." },
  { title: "Regular Test Series", body: "Objective tests with instant scoring for published test series." },
  { title: "Experienced Faculty", body: "Faculty profiles are published and edited by the institute." },
  { title: "Flexible Online Learning", body: "Purchased lectures can be resumed on mobile and desktop." },
  { title: "Dedicated Student Support", body: "Enquiries and support requests reach the institute team." },
];

export const defaultHero = {
  title: "Your Journey to CA, CS & CMA Starts Here.",
  subtitle: "Learn from India's Youngest CA, CS & CMA Aditya Jhawar and build the professional career you've always dreamed of.",
  cta_label: "Explore Our Courses",
  cta_href: "/courses",
  image_url: "",
  extra_json: JSON.stringify({
    highlight: "CA, CS & CMA",
    form_title: "The right course can transform your future.",
    ctas: [
      { label: "Explore Our Courses", href: "/courses" },
      { label: "Enquire Now", href: "/enquiry" },
    ],
    trust: [
      { label: "Classroom batches in Parvat Patiya, Vesu and Pal" },
      { label: "Student portal for purchased lectures and notes" },
      { label: "CA, CS and CMA programmes taught by Aditya Jhawar" },
    ],
  }),
};

export const defaultSections = {
  programmes: { title: "Explore Our Programmes", subtitle: "CA, CS and CMA coaching with classroom batches in Surat and an online student portal.", cta_label: "View All Programmes", cta_href: "/courses", extra_json: JSON.stringify({ kicker: "Our Courses" }) },
  shop: { title: "Buy a published batch", subtitle: "Pay for a live batch and start learning in the student portal.", cta_label: "Open the shop", cta_href: "/shop", extra_json: JSON.stringify({ kicker: "Shop" }) },
  alumni: { title: "Our Students Learn Here", subtitle: "Classroom coaching in Surat with an online student portal.", extra_json: JSON.stringify({ kicker: "Classroom & Online" }) },
  placement: { title: "Classroom Coaching, Online Learning", subtitle: "CA, CS and CMA programmes taught from three Surat branches.", cta_label: "View Achievements", cta_href: "/achievements", extra_json: JSON.stringify({ kicker: "Results" }) },
  why: { title: "Why Students Choose AJ Classes", subtitle: "A structured coaching experience for CA, CS and CMA.", extra_json: JSON.stringify(defaultFeatures) },
  reviews: { title: "Our Students Say We're Gamechangers", cta_label: "View More Testimonials", cta_href: "/testimonials", extra_json: JSON.stringify({ kicker: "Reviews" }) },
  faculty_home: { title: "Industry Leaders Helping You Find The Way", cta_label: "View More", cta_href: "/faculty", extra_json: JSON.stringify({ kicker: "Faculty" }) },
  events: { title: "Building Futures Beyond The Classroom", subtitle: "Events and campus highlights published by AJ Classes.", extra_json: JSON.stringify({ kicker: "Campus" }) },
  faqs: { title: "You Asked, We Answered", subtitle: "Questions students usually ask before joining AJ Classes." },
  counsellor: { title: "Our Counsellor Can Clear Any Confusion", subtitle: "Contact a programme desk or send an enquiry. Branch numbers are published by the institute.", extra_json: JSON.stringify({ kicker: "Enquire" }) },
  community: { title: "Join Our Community", subtitle: "Stay up to date on courses, batches and events.", cta_label: "Notify me" },
};
