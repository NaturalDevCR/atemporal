// src/index.ts
import "@js-temporal/polyfill";
import { Temporal as Temporal2 } from "@js-temporal/polyfill";

// src/TemporalUtils.ts
import { Temporal } from "@js-temporal/polyfill";
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
   * The core parsing engine, rewritten for clarity and robustness.
   * Each input type is handled in a self-contained block that returns directly.
   * The string parsing logic is now more defensive.
   */
  static from(input, timeZone) {
    const tz = timeZone || _TemporalUtils.defaultTimeZone;
    if (input === void 0 || input === null) {
      return Temporal.Now.zonedDateTimeISO(tz);
    }
    if (input instanceof Temporal.ZonedDateTime) {
      return timeZone && input.timeZoneId !== timeZone ? input.withTimeZone(timeZone) : input;
    }
    if (typeof input === "object" && "raw" in input && input.raw instanceof Temporal.ZonedDateTime) {
      const raw = input.raw;
      return timeZone && raw.timeZoneId !== timeZone ? raw.withTimeZone(timeZone) : raw;
    }
    if (input instanceof Temporal.PlainDateTime) {
      return input.toZonedDateTime(tz);
    }
    if (input instanceof Date) {
      return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(tz);
    }
    if (typeof input === "string") {
      try {
        const instant = Temporal.Instant.from(input);
        const zdt = instant.toZonedDateTimeISO(tz);
        return timeZone && tz !== zdt.timeZoneId ? zdt.withTimeZone(timeZone) : zdt;
      } catch (e) {
        try {
          const pdt = Temporal.PlainDateTime.from(input);
          return pdt.toZonedDateTime(tz);
        } catch (e2) {
          throw new Error(`Invalid date string: ${input}`);
        }
      }
    }
    if (typeof input === "number") {
      return Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO(tz);
    }
    throw new Error(`Unsupported date input type: ${typeof input}`);
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
    return Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === -1;
  }
  /**
   * Checks if date `a` is after date `b`.
   */
  static isAfter(a, b) {
    return Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === 1;
  }
  /**
   * Checks if a date `a` is between two other dates, `b` and `c`.
   */
  static isBetween(a, b, c, inclusivity = "[]") {
    const date = _TemporalUtils.from(a);
    const start = _TemporalUtils.from(b);
    const end = _TemporalUtils.from(c);
    const compareWithStart = Temporal.ZonedDateTime.compare(date, start);
    const compareWithEnd = Temporal.ZonedDateTime.compare(date, end);
    const isAfterStart = inclusivity[0] === "[" ? compareWithStart >= 0 : compareWithStart > 0;
    const isBeforeEnd = inclusivity[1] === "]" ? compareWithEnd <= 0 : compareWithEnd < 0;
    return isAfterStart && isBeforeEnd;
  }
  /**
   * Checks if date `a` is the same instant in time as date `b`.
   */
  static isSame(a, b) {
    return Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === 0;
  }
  /**
   * Checks if date `a` is on the same calendar day as date `b`, ignoring time and timezone.
   */
  static isSameDay(a, b) {
    return _TemporalUtils.from(a).toPlainDate().equals(_TemporalUtils.from(b).toPlainDate());
  }
  /**
   * Checks if a given input can be parsed into a valid date without throwing an error.
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
var formatReplacementsCache = /* @__PURE__ */ new WeakMap();
function createTokenReplacements(instance, locale) {
  if (formatReplacementsCache.has(instance)) {
    return formatReplacementsCache.get(instance);
  }
  const replacements = {
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
    SSS: () => instance.millisecond.toString().padStart(3, "0"),
    dddd: () => instance.dayOfWeekName,
    ddd: () => instance.raw.toLocaleString(locale || TemporalUtils.getDefaultLocale(), { weekday: "short" }),
    // Timezone tokens
    Z: () => instance.raw.offset,
    // e.g., +01:00
    ZZ: () => instance.raw.offset.replace(":", ""),
    // e.g., +0100,
    z: () => instance.raw.timeZoneId
  };
  formatReplacementsCache.set(instance, replacements);
  return replacements;
}
var TemporalWrapper = class _TemporalWrapper {
  /**
   * The constructor is private to control instance creation through the static `from` method.
   */
  constructor(input, timeZone) {
    try {
      this._datetime = TemporalUtils.from(input, timeZone);
      this._isValid = true;
    } catch (e) {
      this._datetime = null;
      this._isValid = false;
    }
  }
  /**
   * Creates a new TemporalWrapper instance. This is the primary entry point for creating objects.
   */
  static from(input, tz) {
    return new _TemporalWrapper(input, tz);
  }
  /**
   * Creates a new TemporalWrapper instance from a Unix timestamp (seconds since epoch).
   */
  static unix(timestampInSeconds) {
    const timestampInMs = timestampInSeconds * 1e3;
    return new _TemporalWrapper(timestampInMs);
  }
  /**
   * Creates a new instance from an existing ZonedDateTime, bypassing the parsing logic for efficiency.
   * @internal
   */
  static _fromZonedDateTime(dateTime) {
    const wrapper = Object.create(_TemporalWrapper.prototype);
    wrapper._datetime = dateTime;
    wrapper._isValid = true;
    return wrapper;
  }
  /**
   * Clones the current instance with a new ZonedDateTime object.
   * @internal
   */
  _cloneWith(newDateTime) {
    return _TemporalWrapper._fromZonedDateTime(newDateTime);
  }
  isValid() {
    return this._isValid;
  }
  get datetime() {
    if (!this.isValid() || !this._datetime) {
      throw new Error("Cannot perform operations on an invalid Atemporal object.");
    }
    return this._datetime;
  }
  timeZone(tz) {
    if (!this.isValid()) return this;
    return new _TemporalWrapper(this.datetime.withTimeZone(tz));
  }
  add(value, unit) {
    if (!this.isValid()) return this;
    const duration = { [getDurationUnit(unit)]: value };
    const newDate = this.datetime.add(duration);
    return this._cloneWith(newDate);
  }
  subtract(value, unit) {
    if (!this.isValid()) return this;
    const duration = { [getDurationUnit(unit)]: value };
    const newDate = this.datetime.subtract(duration);
    return this._cloneWith(newDate);
  }
  set(unit, value) {
    if (!this.isValid()) return this;
    const newDate = this.datetime.with({ [unit]: value });
    return this._cloneWith(newDate);
  }
  /**
   * Returns a new instance set to the start of a given unit of time.
   * Note: `startOf('week')` assumes the week starts on Monday (ISO 8601 standard).
   */
  startOf(unit) {
    if (!this.isValid()) return this;
    switch (unit) {
      case "year": {
        const newDateTime = this.datetime.with({ month: 1, day: 1 }).startOfDay();
        return this._cloneWith(newDateTime);
      }
      case "month": {
        const newDateTime = this.datetime.with({ day: 1 }).startOfDay();
        return this._cloneWith(newDateTime);
      }
      case "week": {
        const dayOfWeek = this.datetime.dayOfWeek;
        const daysToSubtract = dayOfWeek - 1;
        const newDateTime = this.datetime.subtract({ days: daysToSubtract });
        return this._cloneWith(newDateTime.startOfDay());
      }
      case "day":
        return this._cloneWith(this.datetime.startOfDay());
      case "hour":
      case "minute":
      case "second":
        const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: "floor" });
        return this._cloneWith(newDate);
    }
  }
  endOf(unit) {
    if (!this.isValid()) return this;
    const start = this.startOf(unit);
    const nextStart = start.add(1, unit);
    return nextStart.subtract(1, "millisecond");
  }
  clone() {
    if (!this.isValid()) return this;
    return this._cloneWith(this.datetime);
  }
  get(unit) {
    if (!this.isValid()) return NaN;
    return this.datetime[unit];
  }
  // --- Getters ---
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
  format(templateOrOptions, localeCode) {
    if (!this.isValid()) {
      return "Invalid Date";
    }
    if (typeof templateOrOptions === "string") {
      const formatString = templateOrOptions;
      const replacements = createTokenReplacements(this, localeCode);
      const tokenRegex = /\[([^\]]+)]|YYYY|YY|MM|M|DD|D|HH|H|mm|m|SSS|ss|s|dddd|ddd|z|Z|ZZ/g;
      return formatString.replace(tokenRegex, (match, literal) => {
        if (literal) {
          return literal;
        }
        if (match in replacements) {
          return replacements[match]();
        }
        return match;
      });
    }
    const options = templateOrOptions;
    const locale = localeCode || TemporalUtils.getDefaultLocale();
    if (options && ("dateStyle" in options || "timeStyle" in options)) {
      return new Intl.DateTimeFormat(locale, {
        timeZone: this.datetime.timeZoneId,
        ...options
      }).format(this.toDate());
    }
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
      // User can still override specific components, e.g., { hour: undefined }
    }).format(this.toDate());
  }
  // --- Comparison & Conversion Methods ---
  diff(other, unit = "millisecond") {
    if (!this.isValid()) return NaN;
    try {
      return TemporalUtils.diff(this.datetime, other, unit);
    } catch {
      return NaN;
    }
  }
  toDate() {
    if (!this.isValid()) return /* @__PURE__ */ new Date(NaN);
    return TemporalUtils.toDate(this.datetime);
  }
  // toString(): string {
  //     if (!this.isValid()) return 'Invalid Date';
  //     return this.datetime.toString();
  // }
  toString() {
    if (!this.isValid()) return "Invalid Date";
    const hasFractional = this.datetime.millisecond > 0 || this.datetime.microsecond > 0 || this.datetime.nanosecond > 0;
    const fractionalSecondDigits = hasFractional ? 3 : 0;
    if (this.datetime.timeZoneId === "UTC") {
      return this.datetime.toInstant().toString({ fractionalSecondDigits });
    }
    return this.datetime.toString({
      offset: "auto",
      timeZoneName: "never",
      fractionalSecondDigits
    });
  }
  get raw() {
    return this.datetime;
  }
  isBefore(other) {
    if (!this.isValid()) return false;
    try {
      return TemporalUtils.isBefore(this.datetime, other);
    } catch {
      return false;
    }
  }
  isAfter(other) {
    if (!this.isValid()) return false;
    try {
      return TemporalUtils.isAfter(this.datetime, other);
    } catch {
      return false;
    }
  }
  isBetween(start, end, inclusivity = "[]") {
    if (!this.isValid()) return false;
    try {
      return TemporalUtils.isBetween(this.datetime, start, end, inclusivity);
    } catch (e) {
      return false;
    }
  }
  isSame(otherDate, unit) {
    if (!this.isValid()) return false;
    try {
      const otherDateTime = TemporalUtils.from(otherDate, this.datetime.timeZoneId);
      switch (unit) {
        case "year":
          return this.datetime.year === otherDateTime.year;
        case "month":
          return this.datetime.year === otherDateTime.year && this.datetime.month === otherDateTime.month;
        case "day":
          return this.datetime.toPlainDate().equals(otherDateTime.toPlainDate());
        default:
          return this.datetime.epochMilliseconds === otherDateTime.epochMilliseconds;
      }
    } catch {
      return false;
    }
  }
  isSameDay(other) {
    if (!this.isValid()) return false;
    try {
      return TemporalUtils.isSameDay(this.datetime, other);
    } catch {
      return false;
    }
  }
  isLeapYear() {
    if (!this.isValid()) return false;
    return this.datetime.inLeapYear;
  }
};

// src/index.ts
var atemporalFn = (input, timeZone) => {
  if (input instanceof TemporalWrapper) {
    return timeZone ? input.timeZone(timeZone) : input.clone();
  }
  if (input === void 0) {
    const nowTemporal = Temporal2.Now.zonedDateTimeISO(timeZone || TemporalUtils.defaultTimeZone);
    return TemporalWrapper.from(nowTemporal);
  }
  return TemporalWrapper.from(input, timeZone);
};
var atemporal = atemporalFn;
atemporal.from = TemporalWrapper.from;
atemporal.unix = TemporalWrapper.unix;
atemporal.isValid = TemporalUtils.isValid;
atemporal.setDefaultLocale = TemporalUtils.setDefaultLocale;
atemporal.setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;
atemporal.getDefaultLocale = TemporalUtils.getDefaultLocale;
atemporal.extend = (plugin, options) => {
  plugin(TemporalWrapper, atemporal, options);
};
var index_default = atemporal;
export {
  TemporalWrapper as Atemporal,
  index_default as default
};
//# sourceMappingURL=index.mjs.map