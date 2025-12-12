/**
 * @file This plugin adds functionality to find available time slots within a given range,
 * considering a list of busy periods.
 */

import { Temporal } from "@js-temporal/polyfill"; // Use polyfill types for internal logic
import { TemporalWrapper } from "../TemporalWrapper";
import type { Plugin, AtemporalFactory, DateInput } from "../types";

export interface TimeSlot {
  start: DateInput;
  end: DateInput;
}

export interface AvailabilityOptions {
  /** The overall window to search for slots. */
  range: TimeSlot;
  /** The duration of the desired slot. */
  duration: {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  };
  /**
   * How frequently to check for a new slot.
   * Defaults to the value of `duration` if not provided.
   */
  interval?: {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  };
  /** Array of busy periods to avoid. */
  busySlots: TimeSlot[];
}

/**
 * Normalizes a TimeSlot to Temporal.ZonedDateTime objects.
 */
function normalizeSlot(
  slot: TimeSlot,
  atemporal: AtemporalFactory
): { start: TemporalWrapper; end: TemporalWrapper } | null {
  const start = atemporal(slot.start);
  const end = atemporal(slot.end);
  if (!start.isValid() || !end.isValid()) return null;
  return { start, end };
}

const timeSlotsPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
  /**
   * Finds available start times for slots of a given duration within a range,
   * avoiding specified busy slots.
   */
  atemporal.findAvailableSlots = (
    options: AvailabilityOptions
  ): TemporalWrapper[] => {
    const { range, duration, busySlots } = options;
    const interval = options.interval || duration;

    // 1. Normalize Range
    const window = normalizeSlot(range, atemporal);
    if (!window) return [];

    // 2. Normalize and Sort Busy Slots
    const normalizedBusySlots = busySlots
      .map((slot) => normalizeSlot(slot, atemporal))
      .filter(
        (slot): slot is { start: TemporalWrapper; end: TemporalWrapper } =>
          slot !== null
      )
      .sort((a, b) => Temporal.ZonedDateTime.compare(a.start.raw, b.start.raw));

    // 3. Merge Overlapping Busy Slots
    const mergedBusySlots: { start: TemporalWrapper; end: TemporalWrapper }[] =
      [];
    for (const slot of normalizedBusySlots) {
      if (mergedBusySlots.length === 0) {
        mergedBusySlots.push(slot);
      } else {
        const last = mergedBusySlots[mergedBusySlots.length - 1];
        if (slot.start.isBefore(last.end) || slot.start.isSame(last.end)) {
          // Overlap or touching: extend the last slot if needed
          if (slot.end.isAfter(last.end)) {
            mergedBusySlots[mergedBusySlots.length - 1] = {
              start: last.start,
              end: slot.end,
            };
          }
        } else {
          mergedBusySlots.push(slot);
        }
      }
    }

    // 4. Search for Slots
    const results: TemporalWrapper[] = [];
    let cursor = window.start.clone();

    // Convert duration/interval to Temporal.Duration for addition
    const durationObj = atemporal.duration(duration);
    const intervalObj = atemporal.duration(interval);

    while (true) {
      const slotEnd = cursor.add(durationObj);

      // Stop if potential slot exceeds the window end
      if (slotEnd.isAfter(window.end)) {
        break;
      }

      // Check overlap with any busy slot
      let isBusy = false;
      for (const busy of mergedBusySlots) {
        // Check if (Cursor < BusyEnd) AND (SlotEnd > BusyStart)
        // Using exclusive bounds for specific touching logic:
        // A slot ending at 10:00 is valid even if busy starts at 10:00.
        if (cursor.isBefore(busy.end) && slotEnd.isAfter(busy.start)) {
          isBusy = true;
          break;
        }
      }

      if (!isBusy) {
        results.push(cursor);
      }

      // Advance cursor
      cursor = cursor.add(intervalObj);
    }

    return results;
  };
};

// --- Module Augmentation ---

declare module "../types" {
  interface AtemporalFactory {
    findAvailableSlots(options: AvailabilityOptions): TemporalWrapper[];
  }
}

export default timeSlotsPlugin;
