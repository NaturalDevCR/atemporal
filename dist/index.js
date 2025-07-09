"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Atemporal: () => TemporalWrapper,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_polyfill2 = require("@js-temporal/polyfill");
var import_polyfill3 = require("@js-temporal/polyfill");

// src/TemporalUtils.ts
var import_polyfill = require("@js-temporal/polyfill");
var _TemporalUtils = class _TemporalUtils {
  /**
   * Sets the default locale for all new atemporal instances. Used for formatting.
   */
  static setDefaultLocale(code) {
    _TemporalUtils._defaultLocale = code;
  }
  /**
   * Gets the currently configured default locale.
   */
  static getDefaultLocale() {
    return _TemporalUtils._defaultLocale;
  }
  /**
   * Sets the default IANA time zone for all new atemporal instances.
   * It validates the time zone identifier before setting it.
   */
  static setDefaultTimeZone(tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      _TemporalUtils._defaultTimeZone = tz;
    } catch (e) {
      throw new Error(`Invalid time zone: ${tz}`);
    }
  }
  /**
   * Gets the currently configured default time zone.
   */
  static get defaultTimeZone() {
    return _TemporalUtils._defaultTimeZone;
  }
  /**
   * The core parsing engine. Converts any valid DateInput into a Temporal.ZonedDateTime object.
   * This function is designed to be robust and handle various input formats.
   */
  static from(input, timeZone = _TemporalUtils.defaultTimeZone) {
    if (typeof input === "object" && input !== null && "raw" in input) {
      return input.raw;
    }
    if (input instanceof import_polyfill.Temporal.ZonedDateTime) {
      return input.withTimeZone(timeZone);
    }
    if (input instanceof import_polyfill.Temporal.PlainDateTime) {
      return input.toZonedDateTime(timeZone);
    }
    if (input instanceof Date) {
      return import_polyfill.Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(timeZone);
    }
    if (typeof input === "string") {
      try {
        return import_polyfill.Temporal.ZonedDateTime.from(input).withTimeZone(timeZone);
      } catch (e) {
        try {
          const plainDateTime = import_polyfill.Temporal.PlainDateTime.from(input);
          return plainDateTime.toZonedDateTime(timeZone);
        } catch (e2) {
          throw new Error(`Invalid date string: ${input}`);
        }
      }
    }
    throw new Error("Unsupported date input");
  }
  /**
   * Converts a Temporal.ZonedDateTime object back to a legacy JavaScript Date.
   */
  static toDate(temporal) {
    return new Date(temporal.epochMilliseconds);
  }
  /**
   * Calculates the difference between two dates in a specified unit.
   */
  static diff(a, b, unit = "millisecond") {
    const d1 = _TemporalUtils.from(a);
    const d2 = _TemporalUtils.from(b);
    return d1.since(d2).total({ unit, relativeTo: d1 });
  }
  /**
   * Checks if date `a` is before date `b`.
   */
  static isBefore(a, b) {
    return import_polyfill.Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === -1;
  }
  /**
   * Checks if date `a` is after date `b`.
   */
  static isAfter(a, b) {
    return import_polyfill.Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === 1;
  }
  /**
   * Checks if a date `a` is between two other dates, `b` and `c`.
   * This is the low-level implementation.
   */
  static isBetween(a, b, c, inclusivity = "[]") {
    const date = _TemporalUtils.from(a);
    const start = _TemporalUtils.from(b);
    const end = _TemporalUtils.from(c);
    const compareWithStart = import_polyfill.Temporal.ZonedDateTime.compare(date, start);
    const compareWithEnd = import_polyfill.Temporal.ZonedDateTime.compare(date, end);
    const isAfterStart = inclusivity[0] === "[" ? compareWithStart >= 0 : compareWithStart > 0;
    const isBeforeEnd = inclusivity[1] === "]" ? compareWithEnd <= 0 : compareWithEnd < 0;
    return isAfterStart && isBeforeEnd;
  }
  /**
   * Checks if date `a` is the same instant in time as date `b`.
   */
  static isSame(a, b) {
    return import_polyfill.Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === 0;
  }
  /**
   * Checks if date `a` is on the same calendar day as date `b`, ignoring time and timezone.
   */
  static isSameDay(a, b) {
    return _TemporalUtils.from(a).toPlainDate().equals(_TemporalUtils.from(b).toPlainDate());
  }
  /**
   * Checks if a given input can be parsed into a valid date without throwing an error.
   * This is used for the static `atemporal.isValid()` method.
   */
  static isValid(input) {
    try {
      _TemporalUtils.from(input);
      return true;
    } catch (e) {
      return false;
    }
  }
};
// Private static properties to hold the global default settings.
_TemporalUtils._defaultTimeZone = "UTC";
_TemporalUtils._defaultLocale = "en-US";
var TemporalUtils = _TemporalUtils;

// src/TemporalWrapper.ts
function getDurationUnit(unit) {
  if (unit === "millisecond") return "milliseconds";
  return `${unit}s`;
}
function createTokenReplacements(instance, locale) {
  return {
    YYYY: () => instance.year.toString(),
    YY: () => instance.year.toString().slice(-2),
    MM: () => instance.month.toString().padStart(2, "0"),
    M: () => instance.month.toString(),
    DD: () => instance.day.toString().padStart(2, "0"),
    D: () => instance.day.toString(),
    HH: () => instance.hour.toString().padStart(2, "0"),
    H: () => instance.hour.toString(),
    mm: () => instance.minute.toString().padStart(2, "0"),
    m: () => instance.minute.toString(),
    ss: () => instance.second.toString().padStart(2, "0"),
    s: () => instance.second.toString(),
    dddd: () => instance.dayOfWeekName,
    // We need to access the raw datetime for this localized format
    ddd: () => instance.raw.toLocaleString(locale || TemporalUtils.getDefaultLocale(), { weekday: "short" })
  };
}
var TemporalWrapper = class _TemporalWrapper {
  constructor(input, timeZone = TemporalUtils.defaultTimeZone) {
    try {
      this._datetime = TemporalUtils.from(input, timeZone);
      this._isValid = true;
    } catch (e) {
      this._datetime = null;
      this._isValid = false;
    }
  }
  // --- Core API Methods ---
  /**
   * Checks if the atemporal instance represents a valid date and time.
   * This is the primary way to handle potentially invalid date inputs gracefully.
   */
  isValid() {
    return this._isValid;
  }
  /**
   * A protected getter for the internal Temporal.ZonedDateTime object.
   * This ensures that we don't accidentally try to operate on a null object.
   * Public methods should use `isValid()` to avoid triggering this error.
   */
  get datetime() {
    if (!this._isValid || !this._datetime) {
      throw new Error("Cannot perform operations on an invalid Atemporal object.");
    }
    return this._datetime;
  }
  /**
   * A static factory method to create a new TemporalWrapper instance.
   * Provides an alternative to calling the main factory function.
   */
  static from(input, tz) {
    return new _TemporalWrapper(input, tz);
  }
  /**
   * Returns a new atemporal instance with a different time zone.
   */
  timeZone(tz) {
    if (!this.isValid()) return this;
    return new _TemporalWrapper(this.datetime.withTimeZone(tz));
  }
  /**
   * Returns a new atemporal instance with the specified amount of time added.
   */
  add(value, unit) {
    if (!this.isValid()) return this;
    const duration = { [getDurationUnit(unit)]: value };
    const newDate = this.datetime.add(duration);
    return new _TemporalWrapper(newDate);
  }
  /**
   * Returns a new atemporal instance with the specified amount of time subtracted.
   */
  subtract(value, unit) {
    if (!this.isValid()) return this;
    const duration = { [getDurationUnit(unit)]: value };
    const newDate = this.datetime.subtract(duration);
    return new _TemporalWrapper(newDate);
  }
  /**
   * Returns a new atemporal instance with a specific unit of time set to a new value.
   */
  set(unit, value) {
    if (!this.isValid()) return this;
    const newDate = this.datetime.with({ [unit]: value });
    return new _TemporalWrapper(newDate);
  }
  /**
   * Returns a new atemporal instance set to the beginning of a specified unit of time.
   */
  startOf(unit) {
    if (!this.isValid()) return this;
    switch (unit) {
      case "year": {
        const pDate = this.datetime.toPlainDate().with({ month: 1, day: 1 });
        return new _TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
      }
      case "month": {
        const pDate = this.datetime.toPlainDate().with({ day: 1 });
        return new _TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
      }
      case "week": {
        const dayOfWeek = this.datetime.dayOfWeek;
        const daysToSubtract = dayOfWeek - 1;
        const pDate = this.datetime.subtract({ days: daysToSubtract }).toPlainDate();
        return new _TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
      }
      case "day":
        return new _TemporalWrapper(this.datetime.startOfDay());
      case "hour":
      case "minute":
      case "second":
        const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: "floor" });
        return new _TemporalWrapper(newDate);
    }
  }
  /**
   * Returns a new atemporal instance set to the end of a specified unit of time.
   */
  endOf(unit) {
    if (!this.isValid()) return this;
    const start = this.startOf(unit);
    const nextStart = start.add(1, unit);
    return nextStart.subtract(1, "millisecond");
  }
  /**
   * Returns a new, cloned instance of the atemporal object.
   */
  clone() {
    if (!this.isValid()) return this;
    return new _TemporalWrapper(this.datetime);
  }
  /**
   * Gets a specific unit of time from the instance.
   */
  get(unit) {
    if (!this.isValid()) return NaN;
    return this.datetime[unit];
  }
  // --- Getters for common date parts ---
  get year() {
    return this.isValid() ? this.datetime.year : NaN;
  }
  get month() {
    return this.isValid() ? this.datetime.month : NaN;
  }
  get day() {
    return this.isValid() ? this.datetime.day : NaN;
  }
  get dayOfWeekName() {
    if (!this.isValid()) return "Invalid Date";
    const locale = TemporalUtils.getDefaultLocale();
    return this.datetime.toLocaleString(locale, { weekday: "long" });
  }
  get hour() {
    return this.isValid() ? this.datetime.hour : NaN;
  }
  get minute() {
    return this.isValid() ? this.datetime.minute : NaN;
  }
  get second() {
    return this.isValid() ? this.datetime.second : NaN;
  }
  get millisecond() {
    return this.isValid() ? this.datetime.millisecond : NaN;
  }
  get quarter() {
    return this.isValid() ? Math.ceil(this.datetime.month / 3) : NaN;
  }
  get weekOfYear() {
    return this.isValid() ? this.datetime.weekOfYear : NaN;
  }
  /**
   * Implementation of the format method.
   */
  format(templateOrOptions, localeCode) {
    if (!this.isValid()) {
      return "Invalid Date";
    }
    if (typeof templateOrOptions === "string") {
      const formatString = templateOrOptions;
      const replacements = createTokenReplacements(this, localeCode);
      const tokenRegex = /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|dddd|ddd/g;
      return formatString.replace(tokenRegex, (match) => {
        if (match in replacements) {
          return replacements[match]();
        }
        return match;
      });
    }
    const options = templateOrOptions;
    const locale = localeCode || TemporalUtils.getDefaultLocale();
    const defaultOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    };
    return new Intl.DateTimeFormat(locale, {
      timeZone: this.datetime.timeZoneId,
      ...defaultOptions,
      ...options
    }).format(this.toDate());
  }
  // --- Comparison Methods ---
  /**
   * Calculates the difference between this instance and another date.
   */
  diff(other, unit = "millisecond") {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return NaN;
    return TemporalUtils.diff(this.datetime, other, unit);
  }
  /**
   * Converts the atemporal instance to a legacy JavaScript Date object.
   */
  toDate() {
    if (!this.isValid()) return /* @__PURE__ */ new Date(NaN);
    return TemporalUtils.toDate(this.datetime);
  }
  /**
   * Returns the full ISO 8601 string representation of the date.
   */
  toString() {
    if (!this.isValid()) return "Invalid Date";
    return this.datetime.toString();
  }
  /**
   * Provides direct, "raw" access to the underlying Temporal.ZonedDateTime object.
   * This is the only getter that will throw an error if the instance is invalid.
   */
  get raw() {
    return this.datetime;
  }
  /**
   * Checks if this instance is before another date.
   */
  isBefore(other) {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return false;
    return TemporalUtils.isBefore(this.datetime, other);
  }
  /**
   * Checks if this instance is after another date.
   */
  isAfter(other) {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return false;
    return TemporalUtils.isAfter(this.datetime, other);
  }
  /**
   * Checks if the instance's date is between two other dates.
   * @param start - The start date of the range.
   * @param end - The end date of the range.
   * @param inclusivity - A string indicating whether the start and end dates should be included.
   * '[]' means inclusive on both ends (default).
   * '()' means exclusive on both ends.
   * '[)' means inclusive start, exclusive end.
   * '(]' means exclusive start, inclusive end.
   * @example
   * atemporal('2025-01-15').isBetween('2025-01-10', '2025-01-20'); // true
   * atemporal('2025-01-20').isBetween('2025-01-10', '2025-01-20', '[)'); // false
   */
  isBetween(start, end, inclusivity = "[]") {
    if (!this.isValid()) {
      return false;
    }
    try {
      return TemporalUtils.isBetween(this.datetime, start, end, inclusivity);
    } catch (e) {
      return false;
    }
  }
  /**
   * Checks if this instance is the same as another date, optionally to a specific unit.
   */
  isSame(otherDate, unit) {
    const other = new _TemporalWrapper(otherDate);
    if (!this.isValid() || !other.isValid()) return false;
    switch (unit) {
      case "year":
        return this.datetime.year === other.datetime.year;
      case "month":
        return this.datetime.year === other.datetime.year && this.datetime.month === other.datetime.month;
      case "day":
        return this.datetime.toPlainDate().equals(other.datetime.toPlainDate());
      default:
        return this.datetime.epochMilliseconds === other.datetime.epochMilliseconds;
    }
  }
  /**
   * Checks if this instance is on the same calendar day as another date.
   */
  isSameDay(other) {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return false;
    return TemporalUtils.isSameDay(this.datetime, other);
  }
  /**
   * Checks if the instance's year is a leap year.
   */
  isLeapYear() {
    if (!this.isValid()) return false;
    return this.datetime.inLeapYear;
  }
};

// src/index.ts
var atemporalFn = (input, timeZone) => {
  if (input instanceof TemporalWrapper) {
    return timeZone ? input.timeZone(timeZone) : input;
  }
  if (input === void 0) {
    const now = import_polyfill3.Temporal.Now.zonedDateTimeISO(TemporalUtils.defaultTimeZone);
    return new TemporalWrapper(now);
  }
  return new TemporalWrapper(input, timeZone);
};
var atemporal = atemporalFn;
atemporal.isValid = TemporalUtils.isValid;
atemporal.setDefaultLocale = TemporalUtils.setDefaultLocale;
atemporal.setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;
atemporal.getDefaultLocale = TemporalUtils.getDefaultLocale;
atemporal.extend = (plugin, options) => {
  plugin(TemporalWrapper, atemporal, options);
};
var index_default = atemporal;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Atemporal
});
//# sourceMappingURL=index.js.map