"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalUtils = void 0;
const temporal_polyfill_1 = require("temporal-polyfill");
const TemporalWrapper_1 = require("./TemporalWrapper"); // Importa el wrapper para el método 'wrap'
class TemporalUtils {
    static setDefaultLocale(code) {
        this._defaultLocale = code;
    }
    static getDefaultLocale() {
        return this._defaultLocale;
    }
    static setDefaultTimeZone(tz) {
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            this._defaultTimeZone = tz;
        }
        catch (e) {
            throw new Error(`Invalid time zone: ${tz}`);
        }
    }
    static get defaultTimeZone() {
        return this._defaultTimeZone;
    }
    static from(input, timeZone = this._defaultTimeZone) {
        if (input instanceof temporal_polyfill_1.Temporal.ZonedDateTime)
            return input.withTimeZone(timeZone);
        if (input instanceof temporal_polyfill_1.Temporal.PlainDateTime)
            return input.toZonedDateTime(timeZone);
        if (input instanceof Date) {
            return temporal_polyfill_1.Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(timeZone);
        }
        if (typeof input === 'string') {
            const temporal = temporal_polyfill_1.Temporal.ZonedDateTime.from(input);
            return temporal.withTimeZone(timeZone);
        }
        throw new Error('Unsupported date input');
    }
    static toDate(temporal) {
        return new Date(temporal.epochMilliseconds);
    }
    static format(input, options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }, localeCode = this._defaultLocale) {
        const dt = this.from(input);
        return new Intl.DateTimeFormat(localeCode, {
            timeZone: dt.timeZoneId,
            ...options
        }).format(this.toDate(dt));
    }
    static diff(a, b, unit = 'millisecond') {
        const d1 = this.from(a);
        const d2 = this.from(b);
        // @ts-ignore
        return d1.since(d2).total({ unit, relativeTo: d1 });
    }
    static isBefore(a, b) {
        return temporal_polyfill_1.Temporal.ZonedDateTime.compare(this.from(a), this.from(b)) === -1;
    }
    static isAfter(a, b) {
        return temporal_polyfill_1.Temporal.ZonedDateTime.compare(this.from(a), this.from(b)) === 1;
    }
    static isSame(a, b) {
        return temporal_polyfill_1.Temporal.ZonedDateTime.compare(this.from(a), this.from(b)) === 0;
    }
    static isSameDay(a, b) {
        return this.from(a).toPlainDate().equals(this.from(b).toPlainDate());
    }
    static isValid(input) {
        try {
            temporal_polyfill_1.Temporal.ZonedDateTime.from(input);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static wrap(input, timeZone) {
        // 1. Si no hay input, creamos una instancia con la fecha y hora actuales.
        if (input === undefined) {
            const now = temporal_polyfill_1.Temporal.Now.zonedDateTimeISO(this.defaultTimeZone);
            return new TemporalWrapper_1.TemporalWrapper(now);
        }
        // 2. Si hay input, continuamos con la validación y creación como antes.
        if (!this.isValid(input)) {
            throw new Error(`Invalid date input: ${String(input)}`);
        }
        return new TemporalWrapper_1.TemporalWrapper(input, timeZone);
    }
}
exports.TemporalUtils = TemporalUtils;
TemporalUtils._defaultTimeZone = 'UTC';
TemporalUtils._defaultLocale = 'en-US';
