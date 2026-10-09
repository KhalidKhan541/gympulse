/**
 * GymPulse fixtures — compact, typed demo dataset.
 * All dates are ISO strings so they serialize cleanly to client components.
 */

/* ----------------------------- Types ----------------------------- */

export type MemberStatus = "active" | "past_due" | "frozen" | "cancelled";
export type LeadStatus = "new" | "contacted" | "trial" | "booked" | "closed";
export type InvoiceStatus = "paid" | "due" | "overdue" | "refunded";
export type Intensity = "low" | "medium" | "high";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type AttendanceStatus = "checked_in" | "no_show" | "cancelled";

export interface HealthFlags {
  injuryRisk: boolean;
  cleared: boolean;
  notes: string | null;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: MemberStatus;
  joined: string;
  renewal: string;
  attendanceThisMonth: number;
  healthFlags: HealthFlags;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  score: number; // 0-100
  followUp: string;
  notes: string;
}

export interface GymClass {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
  trainerId: string;
  schedule: string; // e.g. "Mon/Wed/Fri 6:00 PM"
  durationMin: number;
  intensity: Intensity;
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  certifications: string[];
  rating: number; // 0-5
  hoursPerWeek: number;
  clients: number;
  email: string;
}

export interface Program {
  id: string;
  name: string;
  discipline: "strength" | "hiit" | "yoga" | "mobility";
  durationWeeks: number;
  sessionsPerWeek: number;
  difficulty: Difficulty;
  enrolled: number;
  price: number;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  className: string | null; // null = open gym floor
  time: string;
  date: string;
  status: AttendanceStatus;
}

export interface PosProduct {
  id: string;
  name: string;
  category: "supplement" | "apparel" | "accessory" | "drink";
  price: number;
  stock: number;
  sold: number;
}

export interface Invoice {
  id: string;
  memberName: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  description: string;
}

export interface MonthlyKpi {
  month: string; // "2025-11"
  revenue: number;
  members: number;
  checkins: number;
  classes: number;
  newLeads: number;
  churn: number; // 0-1
}

export interface GymSettings {
  profile: {
    name: string;
    location: string;
    phone: string;
    email: string;
    timezone: string;
    capacity: number;
  };
  branding: {
    primaryColor: string;
    logoText: string;
    darkModeDefault: boolean;
  };
  billing: {
    currency: string;
    trialDays: number;
    lateFeePercent: number;
    autoCharge: boolean;
    invoicePrefix: string;
  };
  notifications: {
    emailReceipts: boolean;
    overdueAlerts: boolean;
    classReminders: boolean;
    leadDigest: boolean;
    quietHours: string;
  };
  integrations: {
    stripe: boolean;
    mailchimp: boolean;
    googleCalendar: boolean;
    whoop: boolean;
    mindbody: boolean;
  };
  staffRoles: Array<{ role: string; members: number; permissions: string }>;
}

/* ----------------------------- Members (18) ----------------------------- */

export const GP_MEMBERS: Member[] = [
  { id: "m01", name: "Aisha Rahman", email: "aisha.r@gmail.com", phone: "+1 415-555-0101", plan: "Elite Annual", status: "active", joined: "2024-03-12", renewal: "2026-03-12", attendanceThisMonth: 18, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m02", name: "Marcus Chen", email: "m.chen@outlook.com", phone: "+1 415-555-0102", plan: "Pro Monthly", status: "active", joined: "2024-07-01", renewal: "2026-11-01", attendanceThisMonth: 14, healthFlags: { injuryRisk: true, cleared: false, notes: "Right shoulder — no overhead press" } },
  { id: "m03", name: "Sofia Marino", email: "sofia.marino@icloud.com", phone: "+1 415-555-0103", plan: "Elite Annual", status: "active", joined: "2023-01-20", renewal: "2027-01-20", attendanceThisMonth: 21, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m04", name: "Daniel Okafor", email: "d.okafor@gmail.com", phone: "+1 415-555-0104", plan: "Pro Monthly", status: "past_due", joined: "2024-11-05", renewal: "2026-10-05", attendanceThisMonth: 6, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m05", name: "Priya Nair", email: "priya.nair@gmail.com", phone: "+1 415-555-0105", plan: "Basic Monthly", status: "active", joined: "2025-02-14", renewal: "2026-11-14", attendanceThisMonth: 9, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m06", name: "Liam Fitzgerald", email: "liam.fitz@gmail.com", phone: "+1 415-555-0106", plan: "Elite Annual", status: "frozen", joined: "2022-09-30", renewal: "2027-09-30", attendanceThisMonth: 0, healthFlags: { injuryRisk: true, cleared: false, notes: "Knee rehab — frozen until cleared" } },
  { id: "m07", name: "Hana Suzuki", email: "hana.suzuki@gmail.com", phone: "+1 415-555-0107", plan: "Pro Monthly", status: "active", joined: "2025-04-22", renewal: "2026-11-22", attendanceThisMonth: 16, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m08", name: "Tomas Alvarez", email: "t.alvarez@yahoo.com", phone: "+1 415-555-0108", plan: "Basic Monthly", status: "cancelled", joined: "2023-06-11", renewal: "2026-08-11", attendanceThisMonth: 0, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m09", name: "Grace Kim", email: "grace.kim@gmail.com", phone: "+1 415-555-0109", plan: "Elite Annual", status: "active", joined: "2024-01-08", renewal: "2027-01-08", attendanceThisMonth: 23, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m10", name: "Noah Petrov", email: "noah.petrov@gmail.com", phone: "+1 415-555-0110", plan: "Pro Monthly", status: "active", joined: "2025-06-01", renewal: "2026-11-01", attendanceThisMonth: 11, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m11", name: "Zara Ibrahim", email: "zara.i@gmail.com", phone: "+1 415-555-0111", plan: "Basic Monthly", status: "past_due", joined: "2024-10-18", renewal: "2026-10-18", attendanceThisMonth: 4, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m12", name: "Ethan Brooks", email: "ethan.brooks@gmail.com", phone: "+1 415-555-0112", plan: "Elite Annual", status: "active", joined: "2023-11-27", renewal: "2026-11-27", attendanceThisMonth: 19, healthFlags: { injuryRisk: true, cleared: true, notes: "Lower back — cleared with form checks" } },
  { id: "m13", name: "Maya Lindgren", email: "maya.l@gmail.com", phone: "+1 415-555-0113", plan: "Pro Monthly", status: "active", joined: "2025-01-30", renewal: "2026-11-30", attendanceThisMonth: 13, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m14", name: "Omar Haddad", email: "omar.haddad@gmail.com", phone: "+1 415-555-0114", plan: "Basic Monthly", status: "active", joined: "2025-08-12", renewal: "2026-11-12", attendanceThisMonth: 8, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m15", name: "Chloe Dubois", email: "chloe.d@gmail.com", phone: "+1 415-555-0115", plan: "Elite Annual", status: "frozen", joined: "2024-05-16", renewal: "2027-05-16", attendanceThisMonth: 1, healthFlags: { injuryRisk: false, cleared: true, notes: "Travel freeze — resumes December" } },
  { id: "m16", name: "Jacob Weiss", email: "j.weiss@gmail.com", phone: "+1 415-555-0116", plan: "Pro Monthly", status: "active", joined: "2024-09-03", renewal: "2026-11-03", attendanceThisMonth: 15, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m17", name: "Isabella Rossi", email: "bella.rossi@gmail.com", phone: "+1 415-555-0117", plan: "Elite Annual", status: "active", joined: "2023-03-19", renewal: "2027-03-19", attendanceThisMonth: 20, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
  { id: "m18", name: "Kwame Mensah", email: "kwame.m@gmail.com", phone: "+1 415-555-0118", plan: "Pro Monthly", status: "cancelled", joined: "2023-08-25", renewal: "2026-09-25", attendanceThisMonth: 0, healthFlags: { injuryRisk: false, cleared: true, notes: null } },
];

/* ----------------------------- Leads (10) ----------------------------- */

export const GP_LEADS: Lead[] = [
  { id: "l01", name: "Rachel Nguyen", email: "rachel.n@gmail.com", phone: "+1 415-555-0201", source: "Instagram", status: "new", score: 72, followUp: "2026-10-10", notes: "Interested in HIIT classes, asked about trial pass." },
  { id: "l02", name: "Ben Carter", email: "ben.carter@gmail.com", phone: "+1 415-555-0202", source: "Referral", status: "contacted", score: 88, followUp: "2026-10-09", notes: "Referred by Grace Kim. Wants strength coaching." },
  { id: "l03", name: "Yuki Tanaka", email: "yuki.t@gmail.com", phone: "+1 415-555-0203", source: "Walk-in", status: "trial", score: 65, followUp: "2026-10-11", notes: "Completed first yoga trial, enjoyed it." },
  { id: "l04", name: "Andre Wilson", email: "andre.w@gmail.com", phone: "+1 415-555-0204", source: "Google Ads", status: "booked", score: 91, followUp: "2026-10-14", notes: "Booked tour + assessment. Elite plan candidate." },
  { id: "l05", name: "Fatima Zahra", email: "fatima.z@gmail.com", phone: "+1 415-555-0205", source: "Website", status: "new", score: 54, followUp: "2026-10-12", notes: "Downloaded pricing guide, no reply yet." },
  { id: "l06", name: "Lucas Meyer", email: "lucas.meyer@gmail.com", phone: "+1 415-555-0206", source: "Referral", status: "trial", score: 79, followUp: "2026-10-10", notes: "Second trial class attended — strong conversion signal." },
  { id: "l07", name: "Nina Popescu", email: "nina.p@gmail.com", phone: "+1 415-555-0207", source: "Instagram", status: "contacted", score: 61, followUp: "2026-10-13", notes: "Comparing us with two other studios." },
  { id: "l08", name: "Tyler Adams", email: "tyler.adams@gmail.com", phone: "+1 415-555-0208", source: "Walk-in", status: "closed", score: 30, followUp: "2026-09-28", notes: "Chose a competitor — price sensitive." },
  { id: "l09", name: "Amara Diallo", email: "amara.d@gmail.com", phone: "+1 415-555-0209", source: "Google Ads", status: "booked", score: 86, followUp: "2026-10-15", notes: "Signed up for mobility program consultation." },
  { id: "l10", name: "Sean Murphy", email: "sean.murphy@gmail.com", phone: "+1 415-555-0210", source: "Website", status: "contacted", score: 58, followUp: "2026-10-16", notes: "Asked about corporate membership rates." },
];

/* ----------------------------- Classes (10) ----------------------------- */

export const GP_CLASSES: GymClass[] = [
  { id: "c01", name: "Power Hour Strength", capacity: 20, enrolled: 18, trainerId: "t01", schedule: "Mon/Wed/Fri 6:00 AM", durationMin: 60, intensity: "high" },
  { id: "c02", name: "HIIT Inferno", capacity: 24, enrolled: 24, trainerId: "t02", schedule: "Tue/Thu 7:00 PM", durationMin: 45, intensity: "high" },
  { id: "c03", name: "Vinyasa Flow", capacity: 18, enrolled: 12, trainerId: "t03", schedule: "Mon/Wed 8:00 AM", durationMin: 60, intensity: "medium" },
  { id: "c04", name: "Mobility Reset", capacity: 16, enrolled: 9, trainerId: "t04", schedule: "Fri 5:30 PM", durationMin: 40, intensity: "low" },
  { id: "c05", name: "Spin & Burn", capacity: 30, enrolled: 27, trainerId: "t05", schedule: "Tue/Thu/Sat 6:30 AM", durationMin: 45, intensity: "high" },
  { id: "c06", name: "Kettlebell Circuit", capacity: 14, enrolled: 11, trainerId: "t01", schedule: "Sat 9:00 AM", durationMin: 50, intensity: "medium" },
  { id: "c07", name: "Yin & Restore", capacity: 20, enrolled: 15, trainerId: "t03", schedule: "Sun 10:00 AM", durationMin: 75, intensity: "low" },
  { id: "c08", name: "Olympic Lifting Lab", capacity: 10, enrolled: 8, trainerId: "t06", schedule: "Wed 7:00 PM", durationMin: 90, intensity: "high" },
  { id: "c09", name: "Core & Conditioning", capacity: 22, enrolled: 19, trainerId: "t07", schedule: "Mon/Fri 12:00 PM", durationMin: 30, intensity: "medium" },
  { id: "c10", name: "Boxing Fundamentals", capacity: 16, enrolled: 16, trainerId: "t08", schedule: "Tue/Fri 6:00 PM", durationMin: 60, intensity: "medium" },
];

/* ----------------------------- Trainers (8) ----------------------------- */

export const GP_TRAINERS: Trainer[] = [
  { id: "t01", name: "Diego Fernandez", specialty: "Strength & Powerlifting", certifications: ["NSCA-CSCS", "USAPL Coach"], rating: 4.9, hoursPerWeek: 32, clients: 14, email: "diego@gympulse.fit" },
  { id: "t02", name: "Alexis Grant", specialty: "HIIT & Metabolic Conditioning", certifications: ["ACE-CPT", "TRX Certified"], rating: 4.8, hoursPerWeek: 28, clients: 22, email: "alexis@gympulse.fit" },
  { id: "t03", name: "Meera Patel", specialty: "Vinyasa & Yin Yoga", certifications: ["RYT-500", "Yin Yoga 100hr"], rating: 5.0, hoursPerWeek: 24, clients: 18, email: "meera@gympulse.fit" },
  { id: "t04", name: "Jordan Blake", specialty: "Mobility & Rehab", certifications: ["FRCms", "NASM-CES"], rating: 4.7, hoursPerWeek: 20, clients: 11, email: "jordan@gympulse.fit" },
  { id: "t05", name: "Camille Roux", specialty: "Cycling & Endurance", certifications: ["Schwinn Certified", "UESCA"], rating: 4.8, hoursPerWeek: 26, clients: 25, email: "camille@gympulse.fit" },
  { id: "t06", name: "Viktor Kovacs", specialty: "Olympic Weightlifting", certifications: ["USAW L2", "IWF Coach"], rating: 4.9, hoursPerWeek: 18, clients: 9, email: "viktor@gympulse.fit" },
  { id: "t07", name: "Tasha Brooks", specialty: "Core & Functional Training", certifications: ["ISSA-CPT", "Kettlebell L1"], rating: 4.6, hoursPerWeek: 30, clients: 20, email: "tasha@gympulse.fit" },
  { id: "t08", name: "Ray Okonkwo", specialty: "Boxing & Combat Fitness", certifications: ["USA Boxing Coach", "CPR/AED"], rating: 4.9, hoursPerWeek: 22, clients: 16, email: "ray@gympulse.fit" },
];

/* ----------------------------- Programs (8) ----------------------------- */

export const GP_PROGRAMS: Program[] = [
  { id: "p01", name: "Foundations of Strength", discipline: "strength", durationWeeks: 12, sessionsPerWeek: 3, difficulty: "beginner", enrolled: 24, price: 349 },
  { id: "p02", name: "Powerbuilding Pro", discipline: "strength", durationWeeks: 16, sessionsPerWeek: 4, difficulty: "advanced", enrolled: 12, price: 549 },
  { id: "p03", name: "Metcon Shred", discipline: "hiit", durationWeeks: 8, sessionsPerWeek: 4, difficulty: "intermediate", enrolled: 31, price: 299 },
  { id: "p04", name: "Sprint & Sprinter HIIT", discipline: "hiit", durationWeeks: 6, sessionsPerWeek: 5, difficulty: "advanced", enrolled: 9, price: 279 },
  { id: "p05", name: "Yoga Balance 30", discipline: "yoga", durationWeeks: 4, sessionsPerWeek: 3, difficulty: "beginner", enrolled: 27, price: 149 },
  { id: "p06", name: "Advanced Ashtanga", discipline: "yoga", durationWeeks: 12, sessionsPerWeek: 5, difficulty: "advanced", enrolled: 8, price: 399 },
  { id: "p07", name: "Desk Detox Mobility", discipline: "mobility", durationWeeks: 6, sessionsPerWeek: 2, difficulty: "beginner", enrolled: 35, price: 129 },
  { id: "p08", name: "Athletic Mobility Lab", discipline: "mobility", durationWeeks: 10, sessionsPerWeek: 3, difficulty: "intermediate", enrolled: 14, price: 319 },
];

/* ----------------------------- Attendance (24) ----------------------------- */

export const GP_ATTENDANCE: AttendanceRecord[] = [
  { id: "a01", memberId: "m01", memberName: "Aisha Rahman", className: "Power Hour Strength", time: "06:02", date: "2026-10-08", status: "checked_in" },
  { id: "a02", memberId: "m03", memberName: "Sofia Marino", className: "HIIT Inferno", time: "19:05", date: "2026-10-08", status: "checked_in" },
  { id: "a03", memberId: "m05", memberName: "Priya Nair", className: null, time: "08:30", date: "2026-10-08", status: "checked_in" },
  { id: "a04", memberId: "m09", memberName: "Grace Kim", className: "Spin & Burn", time: "06:33", date: "2026-10-08", status: "checked_in" },
  { id: "a05", memberId: "m04", memberName: "Daniel Okafor", className: "Core & Conditioning", time: "12:01", date: "2026-10-07", status: "no_show" },
  { id: "a06", memberId: "m07", memberName: "Hana Suzuki", className: "Vinyasa Flow", time: "08:04", date: "2026-10-07", status: "checked_in" },
  { id: "a07", memberId: "m12", memberName: "Ethan Brooks", className: "Olympic Lifting Lab", time: "19:02", date: "2026-10-07", status: "checked_in" },
  { id: "a08", memberId: "m11", memberName: "Zara Ibrahim", className: "Boxing Fundamentals", time: "18:12", date: "2026-10-07", status: "cancelled" },
  { id: "a09", memberId: "m16", memberName: "Jacob Weiss", className: "Power Hour Strength", time: "06:00", date: "2026-10-07", status: "checked_in" },
  { id: "a10", memberId: "m17", memberName: "Isabella Rossi", className: null, time: "07:45", date: "2026-10-06", status: "checked_in" },
  { id: "a11", memberId: "m02", memberName: "Marcus Chen", className: "Mobility Reset", time: "17:31", date: "2026-10-06", status: "checked_in" },
  { id: "a12", memberId: "m13", memberName: "Maya Lindgren", className: "HIIT Inferno", time: "19:07", date: "2026-10-06", status: "checked_in" },
  { id: "a13", memberId: "m10", memberName: "Noah Petrov", className: "Spin & Burn", time: "06:35", date: "2026-10-06", status: "checked_in" },
  { id: "a14", memberId: "m14", memberName: "Omar Haddad", className: "Kettlebell Circuit", time: "09:10", date: "2026-10-05", status: "checked_in" },
  { id: "a15", memberId: "m01", memberName: "Aisha Rahman", className: "Yin & Restore", time: "10:03", date: "2026-10-05", status: "checked_in" },
  { id: "a16", memberId: "m06", memberName: "Liam Fitzgerald", className: "Mobility Reset", time: "17:30", date: "2026-10-05", status: "cancelled" },
  { id: "a17", memberId: "m09", memberName: "Grace Kim", className: "Power Hour Strength", time: "06:01", date: "2026-10-04", status: "checked_in" },
  { id: "a18", memberId: "m15", memberName: "Chloe Dubois", className: null, time: "11:20", date: "2026-10-04", status: "checked_in" },
  { id: "a19", memberId: "m03", memberName: "Sofia Marino", className: "Spin & Burn", time: "06:32", date: "2026-10-04", status: "checked_in" },
  { id: "a20", memberId: "m05", memberName: "Priya Nair", className: "Boxing Fundamentals", time: "18:06", date: "2026-10-03", status: "no_show" },
  { id: "a21", memberId: "m07", memberName: "Hana Suzuki", className: "Core & Conditioning", time: "12:04", date: "2026-10-03", status: "checked_in" },
  { id: "a22", memberId: "m12", memberName: "Ethan Brooks", className: "Power Hour Strength", time: "06:03", date: "2026-10-03", status: "checked_in" },
  { id: "a23", memberId: "m17", memberName: "Isabella Rossi", className: "Advanced Ashtanga", time: "07:00", date: "2026-10-02", status: "checked_in" },
  { id: "a24", memberId: "m16", memberName: "Jacob Weiss", className: null, time: "20:15", date: "2026-10-02", status: "checked_in" },
];

/* ----------------------------- POS Products (10) ----------------------------- */

export const GP_POS_PRODUCTS: PosProduct[] = [
  { id: "s01", name: "Whey Protein Isolate 2lb", category: "supplement", price: 54.99, stock: 24, sold: 18 },
  { id: "s02", name: "Creatine Monohydrate 500g", category: "supplement", price: 29.99, stock: 40, sold: 26 },
  { id: "s03", name: "Pre-Workout Boost", category: "supplement", price: 39.99, stock: 12, sold: 15 },
  { id: "s04", name: "BCAA Recovery 300g", category: "supplement", price: 34.99, stock: 0, sold: 9 },
  { id: "s05", name: "GymPulse Shaker Bottle", category: "accessory", price: 14.99, stock: 55, sold: 31 },
  { id: "s06", name: "Lifting Straps Pair", category: "accessory", price: 19.99, stock: 30, sold: 12 },
  { id: "s07", name: "Performance Tee", category: "apparel", price: 28.0, stock: 18, sold: 7 },
  { id: "s08", name: "Zip-Through Hoodie", category: "apparel", price: 62.0, stock: 9, sold: 4 },
  { id: "s09", name: "Electrolyte Mix 20pk", category: "drink", price: 24.99, stock: 35, sold: 22 },
  { id: "s10", name: "Cold Brew Protein Shake", category: "drink", price: 6.5, stock: 48, sold: 63 },
];

/* ----------------------------- Invoices (12) ----------------------------- */

export const GP_INVOICES: Invoice[] = [
  { id: "INV-1042", memberName: "Aisha Rahman", amount: 1299.0, status: "paid", date: "2026-10-01", description: "Elite Annual — renewal" },
  { id: "INV-1043", memberName: "Daniel Okafor", amount: 89.0, status: "overdue", date: "2026-09-05", description: "Pro Monthly — October" },
  { id: "INV-1044", memberName: "Grace Kim", amount: 1299.0, status: "paid", date: "2026-10-02", description: "Elite Annual — renewal" },
  { id: "INV-1045", memberName: "Zara Ibrahim", amount: 49.0, status: "overdue", date: "2026-09-18", description: "Basic Monthly — October" },
  { id: "INV-1046", memberName: "Priya Nair", amount: 49.0, status: "paid", date: "2026-10-14", description: "Basic Monthly — November" },
  { id: "INV-1047", memberName: "Ethan Brooks", amount: 1299.0, status: "paid", date: "2026-10-27", description: "Elite Annual — renewal" },
  { id: "INV-1048", memberName: "Marcus Chen", amount: 89.0, status: "due", date: "2026-10-01", description: "Pro Monthly — November" },
  { id: "INV-1049", memberName: "Isabella Rossi", amount: 549.0, status: "due", date: "2026-10-05", description: "Powerbuilding Pro program" },
  { id: "INV-1050", memberName: "Tomas Alvarez", amount: 49.0, status: "refunded", date: "2026-08-11", description: "Basic Monthly — cancellation refund" },
  { id: "INV-1051", memberName: "Hana Suzuki", amount: 89.0, status: "paid", date: "2026-10-22", description: "Pro Monthly — November" },
  { id: "INV-1052", memberName: "Kwame Mensah", amount: 89.0, status: "refunded", date: "2026-09-25", description: "Pro Monthly — cancellation refund" },
  { id: "INV-1053", memberName: "Noah Petrov", amount: 299.0, status: "due", date: "2026-10-08", description: "Metcon Shred program" },
];

/* ----------------------------- KPI (12 months) ----------------------------- */

export const GP_KPI: MonthlyKpi[] = [
  { month: "2025-11", revenue: 48200, members: 296, checkins: 4120, classes: 148, newLeads: 62, churn: 0.041 },
  { month: "2025-12", revenue: 51400, members: 305, checkins: 3860, classes: 140, newLeads: 55, churn: 0.038 },
  { month: "2026-01", revenue: 63800, members: 341, checkins: 5310, classes: 165, newLeads: 118, churn: 0.029 },
  { month: "2026-02", revenue: 59700, members: 338, checkins: 4980, classes: 158, newLeads: 84, churn: 0.036 },
  { month: "2026-03", revenue: 61250, members: 344, checkins: 5140, classes: 160, newLeads: 79, churn: 0.033 },
  { month: "2026-04", revenue: 64900, members: 356, checkins: 5420, classes: 168, newLeads: 91, churn: 0.031 },
  { month: "2026-05", revenue: 68300, members: 371, checkins: 5680, classes: 172, newLeads: 97, churn: 0.028 },
  { month: "2026-06", revenue: 71100, members: 389, checkins: 6040, classes: 178, newLeads: 106, churn: 0.026 },
  { month: "2026-07", revenue: 74800, members: 402, checkins: 6310, classes: 184, newLeads: 112, churn: 0.03 },
  { month: "2026-08", revenue: 72600, members: 398, checkins: 6180, classes: 180, newLeads: 88, churn: 0.04 },
  { month: "2026-09", revenue: 76900, members: 411, checkins: 6420, classes: 186, newLeads: 101, churn: 0.032 },
  { month: "2026-10", revenue: 81200, members: 428, checkins: 5190, classes: 121, newLeads: 94, churn: 0.027 },
];

/* ----------------------------- Settings ----------------------------- */

export const GP_SETTINGS: GymSettings = {
  profile: {
    name: "GymPulse HQ",
    location: "1450 Market St, San Francisco, CA",
    phone: "+1 415-555-0100",
    email: "frontdesk@gympulse.fit",
    timezone: "America/Los_Angeles",
    capacity: 500,
  },
  branding: {
    primaryColor: "#84cc16",
    logoText: "GymPulse",
    darkModeDefault: false,
  },
  billing: {
    currency: "USD",
    trialDays: 7,
    lateFeePercent: 2.5,
    autoCharge: true,
    invoicePrefix: "INV-",
  },
  notifications: {
    emailReceipts: true,
    overdueAlerts: true,
    classReminders: true,
    leadDigest: false,
    quietHours: "22:00-07:00",
  },
  integrations: {
    stripe: true,
    mailchimp: true,
    googleCalendar: true,
    whoop: false,
    mindbody: false,
  },
  staffRoles: [
    { role: "Owner", members: 1, permissions: "Full access" },
    { role: "Manager", members: 2, permissions: "Members, billing, reports" },
    { role: "Trainer", members: 8, permissions: "Own schedule, clients" },
    { role: "Front Desk", members: 3, permissions: "Check-ins, POS, leads" },
    { role: "Read Only", members: 2, permissions: "Dashboard & reports" },
  ],
};

/* ----------------------------- Derived helpers ----------------------------- */

export const GP_ACTIVE_MEMBERS = GP_MEMBERS.filter((m) => m.status === "active").length;
export const GP_REVENUE_MTD = GP_INVOICES.filter((i) => i.status === "paid").reduce(
  (sum, i) => sum + i.amount,
  0
);
export const GP_OPEN_LEADS = GP_LEADS.filter(
  (l) => l.status !== "closed"
).length;
