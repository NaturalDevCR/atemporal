/**
 * @file This file defines the TemporalWrapper class, which is the public-facing,
 * chainable, and immutable interface for the atemporal library. It wraps the
 * native Temporal.ZonedDateTime object to provide a more ergonomic API.
 */

import { Temporal } from '@js-temporal/polyfill';
import { TemporalUtils } from './TemporalUtils';
import type {DateInput, TimeUnit, SettableUnit, FormatTokenMap} from './types';

// ... (las funciones auxiliares getDurationUnit y createTokenReplacements no cambian) ...
function getDurationUnit(unit: TimeUnit): string {
    if (unit === 'millisecond') return 'milliseconds';
    return `${unit}s`;
}

function createTokenReplacements(instance: TemporalWrapper, locale?: string): FormatTokenMap {
    return {
        YYYY: () => instance.year.toString(),
        YY: () => instance.year.toString().slice(-2),
        MM: () => instance.month.toString().padStart(2, '0'),
        M: () => instance.month.toString(),
        DD: () => instance.day.toString().padStart(2, '0'),
        D: () => instance.day.toString(),
        HH: () => instance.hour.toString().padStart(2, '0'),
        H: () => instance.hour.toString(),
        mm: () => instance.minute.toString().padStart(2, '0'),
        m: () => instance.minute.toString(),
        ss: () => instance.second.toString().padStart(2, '0'),
        s: () => instance.second.toString(),
        dddd: () => instance.dayOfWeekName,
        ddd: () => instance.raw.toLocaleString(locale || TemporalUtils.getDefaultLocale(), { weekday: 'short' }),
        // [NUEVO] Añadimos los tokens de zona horaria
        Z: () => instance.raw.offset, // e.g., +01:00
        ZZ: () => instance.raw.offset.replace(':', ''), // e.g., +0100
    };
}


export class TemporalWrapper {
    private readonly _datetime: Temporal.ZonedDateTime | null;
    private readonly _isValid: boolean;

    // [CAMBIO] El constructor ahora es privado para controlar la creación de instancias.
    private constructor(input: DateInput, timeZone?: string) {
        try {
            this._datetime = TemporalUtils.from(input, timeZone);
            this._isValid = true;
        } catch (e) {
            this._datetime = null;
            this._isValid = false;
        }
    }

    /**
     * [NUEVO] Método de fábrica público para crear instancias.
     * Este es ahora el punto de entrada principal.
     */
    static from(input: DateInput, tz?: string): TemporalWrapper {
        return new TemporalWrapper(input, tz);
    }

    /**
     * [NUEVO] Un método estático privado para crear una instancia desde un ZonedDateTime ya existente.
     * Esto es más eficiente y claro que pasar por la lógica de parsing completa.
     */
    private static _fromZonedDateTime(dateTime: Temporal.ZonedDateTime): TemporalWrapper {
        // Usamos Object.create para instanciar sin llamar al constructor y sus validaciones.
        const wrapper = Object.create(TemporalWrapper.prototype);
        wrapper._datetime = dateTime;
        wrapper._isValid = true;
        return wrapper;
    }

    /**
     * [MODIFICADO] _cloneWith ahora usa el método estático directo y más eficiente.
     */
    private _cloneWith(newDateTime: Temporal.ZonedDateTime): TemporalWrapper {
        return TemporalWrapper._fromZonedDateTime(newDateTime);
    }

    // --- El resto de la clase sigue igual, pero aquí la incluyo completa por claridad ---

    isValid(): boolean {
        return this._isValid;
    }

    get datetime(): Temporal.ZonedDateTime {
        if (!this._isValid || !this._datetime) {
            throw new Error("Cannot perform operations on an invalid Atemporal object.");
        }
        return this._datetime;
    }

    timeZone(tz: string): TemporalWrapper {
        if (!this.isValid()) return this;
        // Aquí sí creamos una nueva instancia pasando por el constructor,
        // ya que withTimeZone puede fallar si la zona es inválida.
        return new TemporalWrapper(this.datetime.withTimeZone(tz));
    }

    add(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.add(duration);
        return this._cloneWith(newDate);
    }

    subtract(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.subtract(duration);
        return this._cloneWith(newDate);
    }

    set(unit: SettableUnit, value: number): TemporalWrapper {
        if (!this.isValid()) return this;
        const newDate = this.datetime.with({ [unit]: value });
        return this._cloneWith(newDate);
    }

    /**
     * ...
     * Note: `startOf('week')` assumes the week starts on Monday (ISO 8601 standard).
     */
    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        switch (unit) {
            case 'year': {
                const newDateTime = this.datetime.with({ month: 1, day: 1 }).startOfDay();
                return this._cloneWith(newDateTime);
            }
            case 'month': {
                const newDateTime = this.datetime.with({ day: 1 }).startOfDay();
                return this._cloneWith(newDateTime);
            }
            case 'week': {
                // dayOfWeek is 1 for Monday and 7 for Sunday.
                const dayOfWeek = this.datetime.dayOfWeek;
                const daysToSubtract = dayOfWeek - 1;
                const newDateTime = this.datetime.subtract({ days: daysToSubtract });
                return this._cloneWith(newDateTime.startOfDay());
            }
            case 'day':
                return this._cloneWith(this.datetime.startOfDay());
            case 'hour':
            case 'minute':
            case 'second':
                const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: 'floor' });
                return this._cloneWith(newDate);
        }
    }

    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        const start = this.startOf(unit);
        const nextStart = start.add(1, unit);
        return nextStart.subtract(1, 'millisecond');
    }

    clone(): TemporalWrapper {
        if (!this.isValid()) return this;
        return this._cloneWith(this.datetime);
    }

    get(unit: SettableUnit): number {
        if (!this.isValid()) return NaN;
        return this.datetime[unit];
    }

    // --- Getters ---
    get year(): number { return this.isValid() ? this.datetime.year : NaN; }
    get month(): number { return this.isValid() ? this.datetime.month : NaN; }
    get day(): number { return this.isValid() ? this.datetime.day : NaN; }
    get dayOfWeekName(): string {
        if (!this.isValid()) return 'Invalid Date';
        const locale = TemporalUtils.getDefaultLocale();
        return this.datetime.toLocaleString(locale, { weekday: 'long' });
    }
    get hour(): number { return this.isValid() ? this.datetime.hour : NaN; }
    get minute(): number { return this.isValid() ? this.datetime.minute : NaN; }
    get second(): number { return this.isValid() ? this.datetime.second : NaN; }
    get millisecond(): number { return this.isValid() ? this.datetime.millisecond : NaN; }
    get quarter(): number { return this.isValid() ? Math.ceil(this.datetime.month / 3) : NaN; }
    get weekOfYear(): number { return this.isValid() ? this.datetime.weekOfYear! : NaN; }

    // --- Formatters ---
    format(formatString: string): string;
    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string;
    format(templateOrOptions?: string | Intl.DateTimeFormatOptions, localeCode?: string): string {
        if (!this.isValid()) {
            return 'Invalid Date';
        }

        if (typeof templateOrOptions === 'string') {
            const formatString = templateOrOptions;
            const replacements = createTokenReplacements(this, localeCode);
            const tokenRegex = /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|dddd|ddd|Z|ZZ/g;

            return formatString.replace(tokenRegex, match => {
                if (match in replacements) {
                    return (replacements)[match]();
                }
                return match;
            });
        }

        const options = templateOrOptions as Intl.DateTimeFormatOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();

        // [FIX] You cannot mix `dateStyle`/`timeStyle` with component options like `year`.
        // We must check if the user provided style options and use them exclusively if they exist.
        if (options && ('dateStyle' in options || 'timeStyle' in options)) {
            // If style options are present, use them directly without our defaults.
            return new Intl.DateTimeFormat(locale, {
                timeZone: this.datetime.timeZoneId,
                ...options
            }).format(this.toDate());
        }

        // If no style options are provided, then we can safely use our component defaults.
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };

        return new Intl.DateTimeFormat(locale, {
            timeZone: this.datetime.timeZoneId,
            ...defaultOptions,
            ...options // User can still override specific components, e.g., { hour: undefined }
        }).format(this.toDate());
    }

    // --- Comparison & Conversion Methods ---
    diff(other: DateInput, unit: TimeUnit = 'millisecond'): number {
        if (!this.isValid()) return NaN;
        try {
            return TemporalUtils.diff(this.datetime, other, unit);
        } catch {
            return NaN;
        }
    }

    toDate(): Date {
        if (!this.isValid()) return new Date(NaN);
        return TemporalUtils.toDate(this.datetime);
    }

    toString(): string {
        if (!this.isValid()) return 'Invalid Date';
        return this.datetime.toString();
    }

    get raw(): Temporal.ZonedDateTime {
        return this.datetime;
    }

    isBefore(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isBefore(this.datetime, other);
        } catch {
            return false;
        }
    }

    isAfter(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isAfter(this.datetime, other);
        } catch {
            return false;
        }
    }

    isBetween(start: DateInput, end: DateInput, inclusivity: '()' | '[]' | '(]' | '[)' = '[]'): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isBetween(this.datetime, start, end, inclusivity);
        } catch (e) {
            return false;
        }
    }

    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean {
        if (!this.isValid()) return false;
        try {
            const otherDateTime = TemporalUtils.from(otherDate, this.datetime.timeZoneId);
            switch (unit) {
                case 'year':
                    return this.datetime.year === otherDateTime.year;
                case 'month':
                    return this.datetime.year === otherDateTime.year &&
                        this.datetime.month === otherDateTime.month;
                case 'day':
                    return this.datetime.toPlainDate().equals(otherDateTime.toPlainDate());
                default:
                    return this.datetime.epochMilliseconds === otherDateTime.epochMilliseconds;
            }
        } catch {
            return false;
        }
    }

    isSameDay(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isSameDay(this.datetime, other);
        } catch {
            return false;
        }
    }

    isLeapYear(): boolean {
        if (!this.isValid()) return false;
        return this.datetime.inLeapYear;
    }
}