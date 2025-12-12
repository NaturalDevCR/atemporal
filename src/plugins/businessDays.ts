/**
 * @file This plugin adds business day calculations to Atemporal.
 * It allows adding/subtracting business days, checking for business days,
 * and handling holidays and custom weekends.
 */

import { Temporal } from "@js-temporal/polyfill";
import { TemporalWrapper } from "../TemporalWrapper";
import type { Plugin, AtemporalFactory } from "../types";

export interface BusinessDaysOptions {
  /**
   * Array of holidays. Can be strings (ISO 8601) or Date objects.
   * These dates will be treated as non-business days.
   */
  holidays?: (string | Date)[];

  /**
   * Array of days representing the weekend.
   * 1 = Monday, 7 = Sunday.
   * Default: [6, 7] (Saturday, Sunday)
   */
  weekendDays?: number[];
}

// Internal state to store configuration
let globalHolidays: string[] = [];
let globalWeekendDays: number[] = [6, 7]; // Default to Sat/Sun

/**
 * Normalizes a date input to a simple ISO date string (YYYY-MM-DD) for comparison.
 */
function toISODateString(
  input: string | Date | Temporal.PlainDate | Temporal.ZonedDateTime
): string {
  if (input instanceof Date) {
    return input.toISOString().split("T")[0];
  }
  if (typeof input === "string") {
    const parts = input.split("T")[0];
    return parts;
  }
  return input.toString().split("T")[0];
}

/**
 * Sets the global business days configuration.
 */
function setBusinessDaysConfig(options: BusinessDaysOptions) {
  if (options.holidays) {
    globalHolidays = options.holidays.map(toISODateString);
  }
  if (options.weekendDays) {
    globalWeekendDays = options.weekendDays;
  }
}

/**
 * Checks if a specific day (ISO day number) is a weekend.
 */
function isWeekend(dayOfWeek: number): boolean {
  return globalWeekendDays.includes(dayOfWeek);
}

/**
 * Checks if a specific date string is a holiday.
 */
function isHoliday(dateString: string): boolean {
  return globalHolidays.includes(dateString);
}

const businessDaysPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
  // Expose config method on factory
  atemporal.setBusinessDaysConfig = setBusinessDaysConfig;

  // --- TemporalWrapper Extensions ---

  /**
   * Checks if the current date is a business day.
   */
  Atemporal.prototype.isBusinessDay = function (
    this: TemporalWrapper
  ): boolean {
    if (!this.isValid()) return false;

    const dayOfWeek = this.raw.dayOfWeek;
    if (isWeekend(dayOfWeek)) {
      return false;
    }

    const isoDate = toISODateString(this.raw.toPlainDate());
    if (isHoliday(isoDate)) {
      return false;
    }

    return true;
  };

  /**
   * Checks if the current date is a holiday.
   */
  Atemporal.prototype.isHoliday = function (this: TemporalWrapper): boolean {
    if (!this.isValid()) return false;
    const isoDate = toISODateString(this.raw.toPlainDate());
    return isHoliday(isoDate);
  };

  /**
   * Checks if the current date is a weekend.
   */
  Atemporal.prototype.isWeekend = function (this: TemporalWrapper): boolean {
    if (!this.isValid()) return false;
    return isWeekend(this.raw.dayOfWeek);
  };

  /**
   * Adds n business days to the current date.
   */
  Atemporal.prototype.addBusinessDays = function (
    this: TemporalWrapper,
    days: number
  ): TemporalWrapper {
    if (!this.isValid()) return this;
    if (days === 0) return this.clone();

    let count = 0;
    let current = this.clone();
    const sign = days > 0 ? 1 : -1;
    const absDays = Math.abs(days);

    while (count < absDays) {
      current = current.add(sign, "day");
      if (current.isBusinessDay()) {
        count++;
      }
    }
    return current;
  };

  /**
   * Subtracts n business days from the current date.
   */
  Atemporal.prototype.subtractBusinessDays = function (
    this: TemporalWrapper,
    days: number
  ): TemporalWrapper {
    return this.addBusinessDays(-days);
  };

  /**
   * Returns the next business day.
   * If the current day is a business day, it finds the *next* one (not today).
   */
  Atemporal.prototype.nextBusinessDay = function (
    this: TemporalWrapper
  ): TemporalWrapper {
    if (!this.isValid()) return this;
    let current = this.clone();
    do {
      current = current.add(1, "day");
    } while (!current.isBusinessDay());
    return current;
  };
};

// --- Module Augmentation ---

declare module "../types" {
  interface AtemporalFactory {
    setBusinessDaysConfig(options: BusinessDaysOptions): void;
  }
}

declare module "../TemporalWrapper" {
  interface TemporalWrapper {
    isBusinessDay(): boolean;
    isHoliday(): boolean;
    isWeekend(): boolean;
    addBusinessDays(days: number): TemporalWrapper;
    subtractBusinessDays(days: number): TemporalWrapper;
    nextBusinessDay(): TemporalWrapper;
  }
}

export default businessDaysPlugin;
