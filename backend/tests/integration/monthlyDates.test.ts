import { describe, it, expect } from "vitest";
import {
  addMonths,
  dueDate,
  dueMonths,
  daysInMonth,
  isLeapYear,
  monthOf,
  monthsBetween,
  nextChargeDate,
  handledThroughFor,
  todayOf,
} from "../../src/services/monthlyDates";

describe("monthlyDates", () => {
  describe("isLeapYear / daysInMonth", () => {
    it("should treat a year divisible by 4 as a leap year", () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
    });

    it("should not treat a century as a leap year, unless it is divisible by 400", () => {
      expect(isLeapYear(2100)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
    });

    it("should not treat other years as leap years", () => {
      expect(isLeapYear(2026)).toBe(false);
    });

    it("should give February 29 days in a leap year and 28 otherwise", () => {
      expect(daysInMonth("2024-02")).toBe(29);
      expect(daysInMonth("2026-02")).toBe(28);
      expect(daysInMonth("2100-02")).toBe(28);
    });

    it("should give 30 days to April, June, September and November", () => {
      for (const month of ["2026-04", "2026-06", "2026-09", "2026-11"]) expect(daysInMonth(month)).toBe(30);
    });

    it("should give 31 days to the other months", () => {
      for (const month of ["2026-01", "2026-03", "2026-05", "2026-07", "2026-08", "2026-10", "2026-12"]) {
        expect(daysInMonth(month)).toBe(31);
      }
    });
  });

  describe("monthOf / todayOf", () => {
    it("should take the month out of a date", () => {
      expect(monthOf("2026-10-14")).toBe("2026-10");
    });

    it("should give today's date as YYYY-MM-DD", () => {
      expect(todayOf(new Date("2026-10-14T12:00:00Z"))).toBe("2026-10-14");
    });

    it("should follow Swedish summer time (UTC+2), not the UTC clock", () => {
      expect(todayOf(new Date("2026-10-14T21:59:59Z"))).toBe("2026-10-14");
      expect(todayOf(new Date("2026-10-14T22:00:00Z"))).toBe("2026-10-15");
      expect(todayOf(new Date("2026-10-14T23:59:59Z"))).toBe("2026-10-15");
    });

    it("should follow Swedish winter time (UTC+1), including the new year", () => {
      expect(todayOf(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
      expect(todayOf(new Date("2026-12-31T22:59:59Z"))).toBe("2026-12-31");
      expect(todayOf(new Date("2026-12-31T23:00:00Z"))).toBe("2027-01-01");
    });

    it("should handle the switch to summer time", () => {
      expect(todayOf(new Date("2026-03-28T22:59:59Z"))).toBe("2026-03-28");
      expect(todayOf(new Date("2026-03-28T23:00:00Z"))).toBe("2026-03-29");
    });

    it("should handle the switch back to winter time", () => {
      expect(todayOf(new Date("2026-10-24T21:59:59Z"))).toBe("2026-10-24");
      expect(todayOf(new Date("2026-10-24T22:00:00Z"))).toBe("2026-10-25");
    });
  });

  describe("dueDate", () => {
    it("should keep a day that exists in the month", () => {
      expect(dueDate("2026-10", 15)).toBe("2026-10-15");
      expect(dueDate("2026-10", 31)).toBe("2026-10-31");
      expect(dueDate("2026-10", 1)).toBe("2026-10-01");
    });

    it("should turn day 31 into the last day of a 30-day month", () => {
      expect(dueDate("2026-04", 31)).toBe("2026-04-30");
      expect(dueDate("2026-11", 31)).toBe("2026-11-30");
    });

    it("should turn days 29 to 31 into the last day of February", () => {
      expect(dueDate("2026-02", 29)).toBe("2026-02-28");
      expect(dueDate("2026-02", 30)).toBe("2026-02-28");
      expect(dueDate("2026-02", 31)).toBe("2026-02-28");
    });

    it("should keep day 29 in February of a leap year", () => {
      expect(dueDate("2028-02", 29)).toBe("2028-02-29");
      expect(dueDate("2028-02", 31)).toBe("2028-02-29");
    });

    it("should pad single-digit days", () => {
      expect(dueDate("2026-03", 5)).toBe("2026-03-05");
    });
  });

  describe("addMonths", () => {
    it("should add months inside a year", () => {
      expect(addMonths("2026-03", 1)).toBe("2026-04");
      expect(addMonths("2026-03", 9)).toBe("2026-12");
    });

    it("should roll over into the next year", () => {
      expect(addMonths("2026-12", 1)).toBe("2027-01");
      expect(addMonths("2026-11", 14)).toBe("2028-01");
    });

    it("should go back in time with a negative number", () => {
      expect(addMonths("2026-01", -1)).toBe("2025-12");
      expect(addMonths("2026-03", -15)).toBe("2024-12");
    });

    it("should give the same month for 0", () => {
      expect(addMonths("2026-07", 0)).toBe("2026-07");
    });
  });

  describe("monthsBetween", () => {
    it("should include both ends", () => {
      expect(monthsBetween("2026-08", "2026-10")).toEqual(["2026-08", "2026-09", "2026-10"]);
    });

    it("should give a single month when both ends are the same", () => {
      expect(monthsBetween("2026-10", "2026-10")).toEqual(["2026-10"]);
    });

    it("should give nothing when the start is after the end", () => {
      expect(monthsBetween("2026-11", "2026-10")).toEqual([]);
    });

    it("should cross the new year", () => {
      expect(monthsBetween("2026-11", "2027-02")).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
    });
  });

  describe("handledThroughFor", () => {
    it("should handle up to this month when the logged transaction is from this month", () => {
      expect(handledThroughFor("2026-10-05", "2026-10-14", 25)).toBe("2026-10");
      expect(handledThroughFor("2026-10-14", "2026-10-14", 5)).toBe("2026-10");
    });

    it("should leave this month to come when an older transaction is logged before its day", () => {
      // September's rent logged on 10 October, repeating on the 25th: October's is still to come
      expect(handledThroughFor("2026-09-25", "2026-10-10", 25)).toBe("2026-09");
    });

    it("should not backfill: an old transaction handles this month only once its day has passed", () => {
      expect(handledThroughFor("2026-06-20", "2026-10-14", 5)).toBe("2026-10");
      expect(handledThroughFor("2026-06-20", "2026-10-14", 14)).toBe("2026-10");
      expect(handledThroughFor("2026-06-20", "2026-10-14", 25)).toBe("2026-09");
    });

    it("should handle up to a future month for a transaction dated then", () => {
      expect(handledThroughFor("2026-12-01", "2026-10-14", 25)).toBe("2026-12");
      expect(handledThroughFor("2026-12-01", "2026-10-14", 5)).toBe("2026-12");
    });

    it("should go back to the previous month across a new year", () => {
      expect(handledThroughFor("2025-11-20", "2026-01-10", 25)).toBe("2025-12");
    });

    it("should clamp day 31 to the last day of a short month", () => {
      // 28 February is the due date of day 31, and it has passed on the 28th but not on the 27th
      expect(handledThroughFor("2026-01-15", "2026-02-28", 31)).toBe("2026-02");
      expect(handledThroughFor("2026-01-15", "2026-02-27", 31)).toBe("2026-01");
    });

    it("should still create this month's payment on its day after logging a backdated one", () => {
      const generatedThrough = handledThroughFor("2026-09-25", "2026-10-10", 25);
      expect(dueMonths({ generatedThrough, dayOfMonth: 25 }, "2026-10-10")).toEqual([]);
      expect(dueMonths({ generatedThrough, dayOfMonth: 25 }, "2026-10-25")).toEqual(["2026-10"]);
      expect(nextChargeDate({ generatedThrough, dayOfMonth: 25 }, "2026-10-10")).toBe("2026-10-25");
    });
  });

  describe("dueMonths", () => {
    it("should give nothing when everything up to this month is handled", () => {
      expect(dueMonths({ generatedThrough: "2026-10", dayOfMonth: 5 }, "2026-10-14")).toEqual([]);
    });

    it("should give nothing when the handled months reach into the future", () => {
      expect(dueMonths({ generatedThrough: "2026-12", dayOfMonth: 5 }, "2026-10-14")).toEqual([]);
    });

    it("should give a month once its due date has been reached", () => {
      expect(dueMonths({ generatedThrough: "2026-09", dayOfMonth: 5 }, "2026-10-14")).toEqual(["2026-10"]);
    });

    it("should include the due date itself", () => {
      expect(dueMonths({ generatedThrough: "2026-09", dayOfMonth: 14 }, "2026-10-14")).toEqual(["2026-10"]);
    });

    it("should skip a month whose due date is still ahead", () => {
      expect(dueMonths({ generatedThrough: "2026-09", dayOfMonth: 25 }, "2026-10-14")).toEqual([]);
    });

    it("should give every missed month, with the current one only when due", () => {
      expect(dueMonths({ generatedThrough: "2026-06", dayOfMonth: 25 }, "2026-10-14")).toEqual([
        "2026-07",
        "2026-08",
        "2026-09",
      ]);
      expect(dueMonths({ generatedThrough: "2026-06", dayOfMonth: 10 }, "2026-10-14")).toEqual([
        "2026-07",
        "2026-08",
        "2026-09",
        "2026-10",
      ]);
    });

    it("should handle a gap of years", () => {
      expect(dueMonths({ generatedThrough: "2024-10", dayOfMonth: 1 }, "2026-10-14")).toHaveLength(24);
    });

    it("should treat day 31 as the last day of a short month", () => {
      // The 28th is the last day of February 2026, so day 31 is due on it
      expect(dueMonths({ generatedThrough: "2026-01", dayOfMonth: 31 }, "2026-02-28")).toEqual(["2026-02"]);
      expect(dueMonths({ generatedThrough: "2026-01", dayOfMonth: 31 }, "2026-02-27")).toEqual([]);
    });
  });

  describe("nextChargeDate", () => {
    it("should be later this month when the due date is ahead and this month is not handled", () => {
      expect(nextChargeDate({ generatedThrough: "2026-09", dayOfMonth: 25 }, "2026-10-14")).toBe("2026-10-25");
    });

    it("should be next month when this month is already handled", () => {
      expect(nextChargeDate({ generatedThrough: "2026-10", dayOfMonth: 25 }, "2026-10-14")).toBe("2026-11-25");
    });

    it("should be next month when this month's due date has passed", () => {
      expect(nextChargeDate({ generatedThrough: "2026-09", dayOfMonth: 5 }, "2026-10-14")).toBe("2026-11-05");
    });

    it("should be next month when today is the due date", () => {
      expect(nextChargeDate({ generatedThrough: "2026-09", dayOfMonth: 14 }, "2026-10-14")).toBe("2026-11-14");
    });

    it("should be the month after a future handled month", () => {
      expect(nextChargeDate({ generatedThrough: "2026-12", dayOfMonth: 5 }, "2026-10-14")).toBe("2027-01-05");
    });

    it("should clamp to the last day of a short month", () => {
      expect(nextChargeDate({ generatedThrough: "2026-01", dayOfMonth: 31 }, "2026-01-31")).toBe("2026-02-28");
    });

    it("should roll over the new year", () => {
      expect(nextChargeDate({ generatedThrough: "2026-12", dayOfMonth: 5 }, "2026-12-20")).toBe("2027-01-05");
    });
  });
});
