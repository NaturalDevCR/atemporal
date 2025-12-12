/**
 * @file Unit tests for the Business Days plugin.
 */

import atemporal from "../../index";
import businessDaysPlugin from "../../plugins/businessDays";

// Extend atemporal with the plugin
atemporal.extend(businessDaysPlugin);

describe("Business Days Plugin", () => {
  beforeEach(() => {
    // Reset configuration before each test
    atemporal.setBusinessDaysConfig({
      holidays: [],
      weekendDays: [6, 7], // Sat, Sun default
    });
  });

  test("isWeekend check", () => {
    const saturday = atemporal("2023-01-07"); // Saturday
    const sunday = atemporal("2023-01-08"); // Sunday
    const monday = atemporal("2023-01-09"); // Monday

    expect(saturday.isWeekend()).toBe(true);
    expect(sunday.isWeekend()).toBe(true);
    expect(monday.isWeekend()).toBe(false);
  });

  test("isBusinessDay check (default weekends)", () => {
    const friday = atemporal("2023-01-06");
    const saturday = atemporal("2023-01-07");

    expect(friday.isBusinessDay()).toBe(true);
    expect(saturday.isBusinessDay()).toBe(false);
  });

  test("isBusinessDay with custom weekends", () => {
    atemporal.setBusinessDaysConfig({
      weekendDays: [5, 6], // Friday, Saturday weekend
    });

    const thursday = atemporal("2023-01-05"); // Thu
    const friday = atemporal("2023-01-06"); // Fri
    const sunday = atemporal("2023-01-08"); // Sun

    expect(thursday.isBusinessDay()).toBe(true);
    expect(friday.isBusinessDay()).toBe(false);
    expect(sunday.isBusinessDay()).toBe(true);
  });

  test("isHoliday check", () => {
    atemporal.setBusinessDaysConfig({
      holidays: ["2023-12-25"],
    });

    const xmas = atemporal("2023-12-25");
    const boxingDay = atemporal("2023-12-26");

    expect(xmas.isHoliday()).toBe(true);
    expect(xmas.isBusinessDay()).toBe(false);
    expect(boxingDay.isHoliday()).toBe(false);
  });

  test("addBusinessDays simple", () => {
    // Monday + 2 business days = Wednesday
    const monday = atemporal("2023-01-02");
    const result = monday.addBusinessDays(2);
    expect(result.format("YYYY-MM-DD")).toBe("2023-01-04");
  });

  test("addBusinessDays skipping weekend", () => {
    // Friday + 1 business day = Monday (skips Sat, Sun)
    const friday = atemporal("2023-01-06");
    const result = friday.addBusinessDays(1);
    expect(result.format("YYYY-MM-DD")).toBe("2023-01-09");
  });

  test("addBusinessDays skipping holiday", () => {
    atemporal.setBusinessDaysConfig({
      holidays: ["2023-01-09"], // Monday is holiday
    });

    // Friday + 1 business day = Tuesday (skips Sat, Sun, Mon)
    const friday = atemporal("2023-01-06");
    const result = friday.addBusinessDays(1);
    expect(result.format("YYYY-MM-DD")).toBe("2023-01-10");
  });

  test("subtractBusinessDays", () => {
    // Monday - 1 business day = Friday
    const monday = atemporal("2023-01-09");
    const result = monday.subtractBusinessDays(1);
    expect(result.format("YYYY-MM-DD")).toBe("2023-01-06");
  });

  test("nextBusinessDay", () => {
    const friday = atemporal("2023-01-06");
    const next = friday.nextBusinessDay();
    expect(next.format("YYYY-MM-DD")).toBe("2023-01-09"); // Monday
  });

  test("nextBusinessDay with holiday", () => {
    atemporal.setBusinessDaysConfig({
      holidays: ["2023-01-09"], // Monday is holiday
    });
    const friday = atemporal("2023-01-06");
    const next = friday.nextBusinessDay();
    expect(next.format("YYYY-MM-DD")).toBe("2023-01-10"); // Tuesday
  });

  test("addBusinessDays(0) returns clone", () => {
    const date = atemporal("2023-01-01");
    const result = date.addBusinessDays(0);
    expect(result).not.toBe(date); // new instance
    expect(result.isSame(date)).toBe(true);
  });
});
