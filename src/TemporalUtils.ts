import { Temporal } from 'temporal-polyfill';
import { TemporalWrapper } from './TemporalWrapper'; // Importa el wrapper para el método 'wrap'
import type { DateInput, TimeUnit } from './types';

export class TemporalUtils {
    private static _defaultTimeZone = 'UTC';
    private static _defaultLocale = 'en-US';

    static setDefaultLocale(code: string) {
        this._defaultLocale = code;
    }

    static getDefaultLocale(): string {
        return this._defaultLocale;
    }

    static setDefaultTimeZone(tz: string) {
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            this._defaultTimeZone = tz;
        } catch (e) {
            throw new Error(`Invalid time zone: ${tz}`);
        }
    }

    static get defaultTimeZone() {
        return this._defaultTimeZone;
    }

    static from(input: DateInput, timeZone: string = this._defaultTimeZone): Temporal.ZonedDateTime {
        if (input instanceof Temporal.ZonedDateTime) return input.withTimeZone(timeZone);
        if (input instanceof Temporal.PlainDateTime) return input.toZonedDateTime(timeZone);
        if (input instanceof Date) {
            return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(timeZone);
        }
        if (typeof input === 'string') {
            const temporal = Temporal.ZonedDateTime.from(input);
            return temporal.withTimeZone(timeZone);
        }
        throw new Error('Unsupported date input');
    }

    static toDate(temporal: Temporal.ZonedDateTime): Date {
        return new Date(temporal.epochMilliseconds);
    }

    static format(
        input: DateInput,
        options: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        },
        localeCode: string = this._defaultLocale
    ): string {
        const dt = this.from(input);
        return new Intl.DateTimeFormat(localeCode, {
            timeZone: dt.timeZoneId,
            ...options
        }).format(this.toDate(dt));
    }

    static diff(
        a: DateInput,
        b: DateInput,
        unit: TimeUnit = 'millisecond'
    ): number {
        const d1 = this.from(a);
        const d2 = this.from(b);
        // @ts-ignore
        return d1.since(d2).total({ unit, relativeTo: d1 });
    }

    static isBefore(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(this.from(a), this.from(b)) === -1;
    }

    static isAfter(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(this.from(a), this.from(b)) === 1;
    }

    static isSame(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(this.from(a), this.from(b)) === 0;
    }

    static isSameDay(a: DateInput, b: DateInput): boolean {
        return this.from(a).toPlainDate().equals(this.from(b).toPlainDate());
    }

    static isValid(input: any): boolean {
        try {
            Temporal.ZonedDateTime.from(input as any);
            return true;
        } catch (e) {
            return false;
        }
    }

    static wrap(input?: DateInput, timeZone?: string): TemporalWrapper {
        // 1. Si no hay input, creamos una instancia con la fecha y hora actuales.
        if (input === undefined) {
            const now = Temporal.Now.zonedDateTimeISO(this.defaultTimeZone);
            return new TemporalWrapper(now);
        }

        // 2. Si hay input, continuamos con la validación y creación como antes.
        if (!this.isValid(input)) {
            throw new Error(`Invalid date input: ${String(input)}`);
        }
        return new TemporalWrapper(input, timeZone);
    }
}