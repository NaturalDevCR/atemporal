import atemporal from "../index";
import { Temporal } from "@js-temporal/polyfill";

describe("Atemporal: Time-only String Support", () => {
  // Mock date to ensure consistent testing
  const MOCK_DATE = "2024-06-15T12:00:00";

  beforeAll(() => {
    // Setup a fixed "Now" for tests if possible, or we'll check components individually
    jest.useFakeTimers().setSystemTime(new Date(MOCK_DATE));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should parse "HH:mm" time-only string using current date', () => {
    const timeStr = "09:30";
    const result = atemporal(timeStr);

    expect(result.isValid()).toBe(true);
    expect(result.hour).toBe(9);
    expect(result.minute).toBe(30);
    expect(result.second).toBe(0);

    // Should match current year/month/day
    const now = atemporal();
    expect(result.year).toBe(now.year);
    expect(result.month).toBe(now.month);
    expect(result.day).toBe(now.day);
  });

  it('should parse "HH:mm:ss" time-only string using current date', () => {
    const timeStr = "14:45:30";
    const result = atemporal(timeStr);

    expect(result.isValid()).toBe(true);
    expect(result.hour).toBe(14);
    expect(result.minute).toBe(45);
    expect(result.second).toBe(30);
  });

  it("should respect provided timezone for time-only strings", () => {
    // "09:30" in New York
    const result = atemporal("09:30", "America/New_York");

    expect(result.isValid()).toBe(true);
    expect(result.timeZoneName).toBe("America/New_York");
    expect(result.hour).toBe(9);
    expect(result.minute).toBe(30);
  });

  it("should handle time strings that look like year-less dates if they are valid times", () => {
    // This is ambiguous but standard ISO time format is HH:MM:SS
    const timeStr = "23:59:59";
    const result = atemporal(timeStr);

    expect(result.isValid()).toBe(true);
    expect(result.hour).toBe(23);
    expect(result.minute).toBe(59);
    expect(result.second).toBe(59);
  });
});
