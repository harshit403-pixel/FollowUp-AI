/**
 * Seeds SYNTHETIC demo data. Wipes all collections first.
 * Run: npm run seed
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../config/db";
import { env } from "../config/env";
import { ActivityLog } from "../models/ActivityLog";
import { ContactAttempt } from "../models/ContactAttempt";
import { FollowUpPlan } from "../models/FollowUpPlan";
import { FollowUpTask } from "../models/FollowUpTask";
import { Patient } from "../models/Patient";
import { User } from "../models/User";
import { addDays, todayInTz } from "./dates";

export const DEMO_PASSWORD = "Demo#Pass123";

interface SeedItem {
  title: string;
  description: string;
  source: string;
  offset: number | null; // days from today; null = no confirmed date
  done?: boolean;
}

interface SeedPatient {
  mrn: string;
  fullName: string;
  dob: string;
  phone: string;
  instructions: string;
  summary: string;
  items: SeedItem[];
  status: "approved" | "draft_ready" | "awaiting_generation";
  flags?: { type: "missing_date" | "ambiguous" | "unsupported_assumption" | "other"; message: string }[];
  contact?: "reached" | "no_answer" | "unreachable";
}

const PATIENTS: SeedPatient[] = [
  {
    mrn: "FU-1001",
    fullName: "Asha Verma (Demo)",
    dob: "1978-04-12",
    phone: "+91 90000 00001",
    instructions:
      "Return to clinic for wound check on the date below. Bring the list of current medications to the visit. Blood test requested by the clinician before the visit; lab will confirm the exact day.",
    summary: "Wound check visit with a medication list and a pre-visit blood test.",
    status: "approved",
    contact: "reached",
    items: [
      { title: "Pre-visit blood test", description: "Blood test requested by the clinician.", source: "Blood test requested by the clinician before the visit", offset: -4, done: true },
      { title: "Bring current medication list", description: "Patient to bring the list to the visit.", source: "Bring the list of current medications to the visit", offset: 3 },
      { title: "Wound check visit", description: "Clinic visit for wound check.", source: "Return to clinic for wound check on the date below", offset: 3 },
      { title: "Confirm blood test day with lab", description: "Lab will confirm the exact day.", source: "lab will confirm the exact day", offset: null },
    ],
  },
  {
    mrn: "FU-1002",
    fullName: "Rohan Mehta (Demo)",
    dob: "1964-09-30",
    phone: "+91 90000 00002",
    instructions:
      "Review imaging results at the follow-up appointment. Patient should arrange transport for the day. Clinician to confirm appointment date.",
    summary: "Imaging review appointment; date not yet confirmed by the clinician.",
    status: "approved",
    contact: "no_answer",
    items: [
      { title: "Imaging results review appointment", description: "Review imaging results with the clinician.", source: "Review imaging results at the follow-up appointment", offset: null },
      { title: "Arrange transport", description: "Patient to arrange transport for the day.", source: "Patient should arrange transport for the day", offset: null },
    ],
  },
  {
    mrn: "FU-1003",
    fullName: "Meera Iyer (Demo)",
    dob: "1990-01-22",
    phone: "+91 90000 00003",
    instructions:
      "Post-procedure phone check-in on the date specified below. Physiotherapy referral letter to be sent to the patient.",
    summary: "Post-procedure phone check-in and physiotherapy referral letter.",
    status: "approved",
    contact: "reached",
    items: [
      { title: "Post-procedure phone check-in", description: "Phone check-in with the patient.", source: "Post-procedure phone check-in on the date specified below", offset: 0 },
      { title: "Send physiotherapy referral letter", description: "Referral letter to be sent to the patient.", source: "Physiotherapy referral letter to be sent to the patient", offset: 5 },
      { title: "Follow-up clinic visit", description: "Clinic follow-up.", source: "Post-procedure phone check-in on the date specified below", offset: 14 },
    ],
  },
  {
    mrn: "FU-1004",
    fullName: "Kabir Singh (Demo)",
    dob: "1955-11-05",
    phone: "+91 90000 00004",
    instructions:
      "Come back in a few weeks for a general review. Fasting may be needed before the visit, clinician to advise.",
    summary: "General review in a few weeks; fasting requirement not confirmed.",
    status: "draft_ready",
    flags: [
      { type: "missing_date", message: "\"A few weeks\" is not a specific date. Clinician must confirm the visit date." },
      { type: "ambiguous", message: "Fasting requirement is stated as possible, not confirmed." },
    ],
    items: [
      { title: "General review visit", description: "Review visit with the clinician.", source: "Come back in a few weeks for a general review", offset: null },
      { title: "Confirm fasting requirement", description: "Clinician to advise whether fasting is needed.", source: "Fasting may be needed before the visit, clinician to advise", offset: null },
    ],
  },
  {
    mrn: "FU-1005",
    fullName: "Lakshmi Nair (Demo)",
    dob: "1983-07-17",
    phone: "+91 90000 00005",
    instructions:
      "Dressing change appointment at the clinic on the date below, then a suture review visit. Patient has not been reachable by phone.",
    summary: "Dressing change then suture review; patient unreachable.",
    status: "approved",
    contact: "unreachable",
    items: [
      { title: "Dressing change appointment", description: "Clinic dressing change.", source: "Dressing change appointment at the clinic on the date below", offset: -2 },
      { title: "Suture review visit", description: "Review of sutures.", source: "then a suture review visit", offset: 7 },
    ],
  },
  {
    mrn: "FU-1006",
    fullName: "Imran Qureshi (Demo)",
    dob: "1971-03-09",
    phone: "+91 90000 00006",
    instructions:
      "Outpatient follow-up in the cardiology clinic. Bring previous ECG reports. Instructions entered; plan not yet generated.",
    summary: "",
    status: "awaiting_generation",
    items: [],
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production");
  await connectDb();
  await Promise.all(
    [ActivityLog, ContactAttempt, FollowUpPlan, FollowUpTask, Patient, User].map((m) => m.deleteMany({})),
  );

  const today = todayInTz(env.APP_TIMEZONE);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [coordinator, staff] = await User.create([
    { name: "Demo Coordinator", email: "coordinator@demo.test", passwordHash: hash, role: "coordinator" },
    { name: "Demo Staff", email: "staff@demo.test", passwordHash: hash, role: "staff" },
  ]);
  const coord = { id: String(coordinator._id), name: coordinator.name };
  const stf = { id: String(staff._id), name: staff.name };

  for (const p of PATIENTS) {
    const patient = await Patient.create({
      mrn: p.mrn,
      fullName: p.fullName,
      dateOfBirth: p.dob,
      phone: p.phone,
    });
    const draft = p.items.length
      ? {
          summary: p.summary,
          clinicianFollowUpDate: null,
          items: p.items.map((i) => ({
            title: i.title,
            description: i.description,
            sourceInstruction: i.source,
            suggestedDate: i.offset === null ? null : addDays(today, i.offset),
            needsReview: i.offset === null,
            reviewNote: i.offset === null ? "Date requires clinician confirmation" : "",
          })),
          flags: p.flags ?? [],
          source: "manual" as const,
        }
      : null;

    const plan = await FollowUpPlan.create({
      patient: patient._id,
      originalInstructions: p.instructions,
      status: p.status,
      draft,
      createdBy: stf,
      approvedVersions:
        p.status === "approved" && draft
          ? [{ version: 1, approvedAt: new Date(), approvedBy: coord, snapshot: draft }]
          : [],
    });

    await ActivityLog.create({ plan: plan._id, patient: patient._id, action: "plan_created", detail: "Seeded demo data", actor: stf });

    if (p.status === "approved") {
      await ActivityLog.create({ plan: plan._id, patient: patient._id, action: "plan_approved", detail: "Seeded demo data", actor: coord });
      await FollowUpTask.insertMany(
        p.items.map((i, order) => ({
          plan: plan._id,
          patient: patient._id,
          order,
          title: i.title,
          description: i.description,
          sourceInstruction: i.source,
          scheduledDate: i.offset === null ? null : addDays(today, i.offset),
          needsReview: i.offset === null,
          reviewNote: i.offset === null ? "Date requires clinician confirmation" : "",
          completedAt: i.done ? new Date() : null,
          completedBy: i.done ? stf : null,
        })),
      );
    }

    if (p.contact) {
      await ContactAttempt.create({
        patient: patient._id,
        plan: plan._id,
        method: "phone",
        outcome: p.contact,
        note: "Seeded demo contact attempt",
        by: stf,
      });
    }
  }

  console.log(`Seeded ${PATIENTS.length} synthetic patients.`);
  console.log(`Logins: coordinator@demo.test / staff@demo.test  (password: ${DEMO_PASSWORD})`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
