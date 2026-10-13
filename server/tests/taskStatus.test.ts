import { describe, expect, it } from "vitest";
import { addDays, isValidDateString, todayInTz } from "../src/utils/dates";
import { computeStatus } from "../src/utils/taskStatus";

const today = "2026-10-13";
const base = { scheduledDate: null, needsReview: false, completedAt: null, closedAt: null };

describe("computeStatus", () => {
  it("returns Completed first, even if overdue", () => {
    expect(computeStatus({ ...base, scheduledDate: "2026-10-01", completedAt: new Date() }, today)).toBe("Completed");
  });
  it("returns Closed for closed open tasks", () => {
    expect(computeStatus({ ...base, scheduledDate: "2026-10-01", closedAt: new Date() }, today)).toBe("Closed");
  });
  it("treats tasks without a date as Needs Review", () => {
    expect(computeStatus(base, today)).toBe("Needs Review");
  });
  it("treats flagged tasks as Needs Review even with a date", () => {
    expect(computeStatus({ ...base, scheduledDate: "2026-10-20", needsReview: true }, today)).toBe("Needs Review");
  });
  it("classifies by date", () => {
    expect(computeStatus({ ...base, scheduledDate: "2026-10-12" }, today)).toBe("Overdue");
    expect(computeStatus({ ...base, scheduledDate: today }, today)).toBe("Due Today");
    expect(computeStatus({ ...base, scheduledDate: "2026-10-14" }, today)).toBe("Upcoming");
  });
});

describe("dates", () => {
  it("validates real calendar dates", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("26-2-1")).toBe(false);
  });
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-10-13", -13)).toBe("2026-09-30");
  });
  it("computes today in a timezone", () => {
    // 2026-10-13 20:00 UTC is already Oct 14 in Kolkata (UTC+5:30)
    expect(todayInTz("Asia/Kolkata", new Date("2026-10-13T20:00:00Z"))).toBe("2026-10-14");
    expect(todayInTz("UTC", new Date("2026-10-13T20:00:00Z"))).toBe("2026-10-13");
  });
});
