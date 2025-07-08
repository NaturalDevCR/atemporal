// src/index.ts
import "@js-temporal/polyfill";
import { Temporal as Temporal2 } from "@js-temporal/polyfill";

// src/TemporalUtils.ts
import { Temporal } from "@js-temporal/polyfill";
var _TemporalUtils = class _TemporalUtils {
  static setDefaultLocale(code) {
    _TemporalUtils._defaultLocale = code;
  }
  static getDefaultLocale() {
    return _TemporalUtils._defaultLocale;
  }
  static setDefaultTimeZone(tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      _TemporalUtils._defaultTimeZone = tz;
    } catch (e) {
      throw new Error(`Invalid time zone: ${tz}`);
    }
  }
  static get defaultTimeZone() {
    return _TemporalUtils._defaultTimeZone;
  }
  static from(input, timeZone = _TemporalUtils.defaultTimeZone) {
    if (typeof input === "object" && input !== null && "raw" in input) {
      return input.raw;
    }
    if (input instanceof Temporal.ZonedDateTime) {
      return input.withTimeZone(timeZone);
    }
    if (input instanceof Temporal.PlainDateTime) {
      return input.toZonedDateTime(timeZone);
    }
    if (input instanceof Date) {
      return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(timeZone);
    }
    if (typeof input === "string") {
      try {
        return Temporal.ZonedDateTime.from(input).withTimeZone(timeZone);
      } catch (e) {
        try {
          const plainDateTime = Temporal.PlainDateTime.from(input);
          return plainDateTime.toZonedDateTime(timeZone);
        } catch (e2) {
          throw new Error(`Invalid date string: ${input}`);
        }
      }
    }
    throw new Error("Unsupported date input");
  }
  static toDate(temporal) {
    return new Date(temporal.epochMilliseconds);
  }
  // static format(
  //     input: DateInput,
  //     options: Intl.DateTimeFormatOptions = {
  //         year: 'numeric', month: '2-digit', day: '2-digit',
  //         hour: '2-digit', minute: '2-digit', second: '2-digit'
  //     },
  //     localeCode: string = TemporalUtils._defaultLocale
  // ): string {
  //     const dt = TemporalUtils.from(input);
  //     return new Intl.DateTimeFormat(localeCode, {
  //         timeZone: dt.timeZoneId,
  //         ...options
  //     }).format(TemporalUtils.toDate(dt));
  // }
  static diff(a, b, unit = "millisecond") {
    const d1 = _TemporalUtils.from(a);
    const d2 = _TemporalUtils.from(b);
    return d1.since(d2).total({ unit, relativeTo: d1 });
  }
  static isBefore(a, b) {
    return Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === -1;
  }
  static isAfter(a, b) {
    return Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === 1;
  }
  static isSame(a, b) {
    return Temporal.ZonedDateTime.compare(_TemporalUtils.from(a), _TemporalUtils.from(b)) === 0;
  }
  static isSameDay(a, b) {
    return _TemporalUtils.from(a).toPlainDate().equals(_TemporalUtils.from(b).toPlainDate());
  }
  static isValid(input) {
    try {
      _TemporalUtils.from(input);
      return true;
    } catch (e) {
      return false;
    }
  }
};
_TemporalUtils._defaultTimeZone = "UTC";
_TemporalUtils._defaultLocale = "en-US";
var TemporalUtils = _TemporalUtils;

// src/TemporalWrapper.ts
function getDurationUnit(unit) {
  if (unit === "millisecond") return "milliseconds";
  return `${unit}s`;
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
  // --- CAMBIO 3: El método `isValid` de instancia ---
  /**
   * Comprueba si la instancia de Atemporal representa una fecha y hora válidas.
   * @returns {boolean} `true` si es válida, `false` en caso contrario.
   */
  isValid() {
    return this._isValid;
  }
  // --- CAMBIO 4: Getter protegido para el objeto Temporal interno ---
  // Este getter asegura que no intentemos operar sobre un objeto nulo.
  // Los métodos públicos usarán `isValid()` para evitar llegar a este error.
  get datetime() {
    if (!this._isValid || !this._datetime) {
      throw new Error("Cannot perform operations on an invalid Atemporal object.");
    }
    return this._datetime;
  }
  // --- CAMBIO 5: Todos los métodos públicos ahora están protegidos ---
  // A partir de aquí, cada método primero comprueba si la instancia es válida.
  static from(input, tz) {
    return new _TemporalWrapper(input, tz);
  }
  timeZone(tz) {
    if (!this.isValid()) return this;
    return new _TemporalWrapper(this.datetime.withTimeZone(tz));
  }
  add(value, unit) {
    if (!this.isValid()) return this;
    const duration = { [getDurationUnit(unit)]: value };
    const newDate = this.datetime.add(duration);
    return new _TemporalWrapper(newDate);
  }
  subtract(value, unit) {
    if (!this.isValid()) return this;
    const duration = { [getDurationUnit(unit)]: value };
    const newDate = this.datetime.subtract(duration);
    return new _TemporalWrapper(newDate);
  }
  set(unit, value) {
    if (!this.isValid()) return this;
    const newDate = this.datetime.with({ [unit]: value });
    return new _TemporalWrapper(newDate);
  }
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
  endOf(unit) {
    if (!this.isValid()) return this;
    const start = this.startOf(unit);
    const nextStart = start.add(1, unit);
    return nextStart.subtract(1, "millisecond");
  }
  clone() {
    if (!this.isValid()) return this;
    return new _TemporalWrapper(this.datetime);
  }
  get(unit) {
    if (!this.isValid()) return NaN;
    return this.datetime[unit];
  }
  // Getters protegidos
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
  format(options, localeCode) {
    if (!this.isValid()) return "Invalid Date";
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
      // Las opciones del usuario sobreescriben las por defecto
    }).format(this.toDate());
  }
  diff(other, unit = "millisecond") {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return NaN;
    return TemporalUtils.diff(this.datetime, other, unit);
  }
  toDate() {
    if (!this.isValid()) return /* @__PURE__ */ new Date(NaN);
    return TemporalUtils.toDate(this.datetime);
  }
  toString() {
    if (!this.isValid()) return "Invalid Date";
    return this.datetime.toString();
  }
  get raw() {
    return this.datetime;
  }
  isBefore(other) {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return false;
    return TemporalUtils.isBefore(this.datetime, other);
  }
  isAfter(other) {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return false;
    return TemporalUtils.isAfter(this.datetime, other);
  }
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
  isSameDay(other) {
    const otherAtemporal = new _TemporalWrapper(other);
    if (!this.isValid() || !otherAtemporal.isValid()) return false;
    return TemporalUtils.isSameDay(this.datetime, other);
  }
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
    const now = Temporal2.Now.zonedDateTimeISO(TemporalUtils.defaultTimeZone);
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
export {
  TemporalWrapper as Atemporal,
  index_default as default
};
//# sourceMappingURL=index.mjs.map