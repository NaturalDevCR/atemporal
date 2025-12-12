/**
 * @file Unit tests for Atemporal Min/Max utilities.
 */

import atemporal, { InvalidDateError } from "../index";

describe("Min/Max Utilities", () => {
  describe("atemporal.min", () => {
    test("should return the earliest date from arguments", () => {
      const d1 = atemporal("2023-01-01");
      const d2 = atemporal("2023-01-05");
      const d3 = atemporal("2022-12-31");

      const result = atemporal.min(d1, d2, d3);
      expect(result.format("YYYY-MM-DD")).toBe("2022-12-31");
    });

    test("should return the earliest date from array", () => {
      const dates = ["2023-05-01", "2023-06-01", "2023-04-01"];
      const result = atemporal.min(dates);
      expect(result.format("YYYY-MM-DD")).toBe("2023-04-01");
    });

    test("should handle mixed input types", () => {
      const d1 = new Date("2023-01-01");
      const d2 = "2022-01-01";
      const d3 = atemporal("2024-01-01");

      const result = atemporal.min(d1, d2, d3);
      expect(result.year).toBe(2022);
    });

    test("should throw error for empty input", () => {
      expect(() => atemporal.min()).toThrow(InvalidDateError);
      expect(() => atemporal.min([])).toThrow(InvalidDateError);
    });

    test("should throw error for invalid dates", () => {
      expect(() => atemporal.min("invalid-date", "2023-01-01")).toThrow(
        InvalidDateError
      );
    });

    test("should handle single argument", () => {
      const d1 = "2023-01-01";
      expect(atemporal.min(d1).format("YYYY-MM-DD")).toBe("2023-01-01");
    });
  });

  describe("atemporal.max", () => {
    test("should return the latest date from arguments", () => {
      const d1 = atemporal("2023-01-01");
      const d2 = atemporal("2023-01-05");
      const d3 = atemporal("2022-12-31");

      const result = atemporal.max(d1, d2, d3);
      expect(result.format("YYYY-MM-DD")).toBe("2023-01-05");
    });

    test("should return the latest date from array", () => {
      const dates = ["2023-05-01", "2023-06-01", "2023-04-01"];
      const result = atemporal.max(dates);
      expect(result.format("YYYY-MM-DD")).toBe("2023-06-01");
    });

    test("should handle mixed input types", () => {
      const d1 = new Date("2023-01-01");
      const d2 = "2022-01-01";
      const d3 = atemporal("2024-01-01");

      const result = atemporal.max(d1, d2, d3);
      expect(result.year).toBe(2024);
    });

    test("should throw error for empty input", () => {
      expect(() => atemporal.max()).toThrow(InvalidDateError);
      expect(() => atemporal.max([])).toThrow(InvalidDateError);
    });
  });
});
