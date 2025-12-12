/**
 * @file Unit tests for the Time Slots plugin.
 */

import atemporal from "../../index";
import timeSlotsPlugin from "../../plugins/timeSlots";

// Extend atemporal with the plugin
atemporal.extend(timeSlotsPlugin);

describe("Time Slots Plugin", () => {
  test("finds simple gap", () => {
    // Range: 09:00 - 12:00
    // Busy: 10:00 - 11:00
    // Duration: 1 hour
    // Expected: 09:00, 11:00
    const slots = atemporal.findAvailableSlots({
      range: { start: "2023-01-01T09:00:00", end: "2023-01-01T12:00:00" },
      duration: { hours: 1 },
      busySlots: [{ start: "2023-01-01T10:00:00", end: "2023-01-01T11:00:00" }],
    });

    expect(slots.length).toBe(2);
    expect(slots[0].format("HH:mm")).toBe("09:00");
    expect(slots[1].format("HH:mm")).toBe("11:00");
  });

  test("respects interval", () => {
    // Range: 09:00 - 10:00
    // Busy: None
    // Duration: 30 min
    // Interval: 15 min
    // Expected: 09:00, 09:15, 09:30 (09:45 would end at 10:15 > 10:00)
    const slots = atemporal.findAvailableSlots({
      range: { start: "2023-01-01T09:00:00", end: "2023-01-01T10:00:00" },
      duration: { minutes: 30 },
      interval: { minutes: 15 },
      busySlots: [],
    });

    expect(slots.length).toBe(3);
    expect(slots[0].format("HH:mm")).toBe("09:00");
    expect(slots[1].format("HH:mm")).toBe("09:15");
    expect(slots[2].format("HH:mm")).toBe("09:30");
  });

  test("merges overlapping busy slots", () => {
    // Range: 09:00 - 12:00
    // Busy 1: 09:30 - 10:30
    // Busy 2: 10:00 - 11:00  (Overlaps with 1, effective block is 09:30 - 11:00)
    // Duration: 1 hour
    // Slots:
    // 09:00 (ends 10:00) -> CONFLICT (Busy starts 09:30)
    // ...
    // 11:00 (ends 12:00) -> FREE
    const slots = atemporal.findAvailableSlots({
      range: { start: "2023-01-01T09:00:00", end: "2023-01-01T12:00:00" },
      duration: { hours: 1 },
      busySlots: [
        { start: "2023-01-01T09:30:00", end: "2023-01-01T10:30:00" },
        { start: "2023-01-01T10:00:00", end: "2023-01-01T11:00:00" },
      ],
    });

    expect(slots.length).toBe(1);
    expect(slots[0].format("HH:mm")).toBe("11:00");
  });

  test("handles touching slots correctly", () => {
    // Range: 09:00 - 11:00
    // Busy: 10:00 - 10:30
    // Duration: 1 hour
    // 09:00 - 10:00 -> FREE (Valid, ends exactly when busy starts)
    // 10:00 - 11:00 -> CONFLICT (Starts when busy starts)
    // ...
    // 10:30 - 11:30 -> Out of range
    // Only 09:00 is valid? Wait.
    // If busy is 10:00-10:30.
    // Slot 09:00-10:00. End(10:00) > BusyStart(10:00) is FALSE. No overlap.
    // Slot 10:00-11:00. Start(10:00) < BusyEnd(10:30) is TRUE. Overlap.

    const slots = atemporal.findAvailableSlots({
      range: { start: "2023-01-01T09:00:00", end: "2023-01-01T11:00:00" },
      duration: { hours: 1 },
      busySlots: [{ start: "2023-01-01T10:00:00", end: "2023-01-01T10:30:00" }],
    });

    expect(slots.length).toBe(1);
    expect(slots[0].format("HH:mm")).toBe("09:00");
  });

  test("returns empty if duration > range", () => {
    const slots = atemporal.findAvailableSlots({
      range: { start: "2023-01-01T09:00:00", end: "2023-01-01T09:30:00" },
      duration: { hours: 1 },
      busySlots: [],
    });
    expect(slots.length).toBe(0);
  });
});
