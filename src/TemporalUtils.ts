import { Temporal } from '@js-temporal/polyfill';
// import { TemporalWrapper } from './TemporalWrapper';
import type { DateInput, TimeUnit } from './types';

export class TemporalUtils {
    private static _defaultTimeZone = 'UTC';
    private static _defaultLocale = 'en-US';

    static setDefaultLocale(code: string) {
        TemporalUtils._defaultLocale = code;
    }

    static getDefaultLocale(): string {
        return TemporalUtils._defaultLocale;
    }

    static setDefaultTimeZone(tz: string) {
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            TemporalUtils._defaultTimeZone = tz;
        } catch (e) {
            throw new Error(`Invalid time zone: ${tz}`);
        }
    }

    static get defaultTimeZone() {
        return TemporalUtils._defaultTimeZone;
    }

    static from(input: DateInput, timeZone: string = TemporalUtils.defaultTimeZone): Temporal.ZonedDateTime {
        // La comprobación 'instanceof TemporalWrapper' se movió a index.ts, pero dejarla aquí no hace daño.
        // if (input instanceof TemporalWrapper) {
        //     return input.raw;
        // }
        if (typeof input === 'object' && input !== null && 'raw' in input) {
            // Sabemos que es un TemporalWrapper, así que accedemos a su propiedad .raw
            return (input as any).raw;
        }

        // NO debe haber ninguna comprobación de 'toDate()' aquí.

        if (input instanceof Temporal.ZonedDateTime) {
            return input.withTimeZone(timeZone);
        }
        if (input instanceof Temporal.PlainDateTime) {
            return input.toZonedDateTime(timeZone);
        }
        if (input instanceof Date) {
            return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(timeZone);
        }
        if (typeof input === 'string') {
            try {
                // Intenta parsear como ZonedDateTime (espera offset/zona horaria en el string)
                return Temporal.ZonedDateTime.from(input).withTimeZone(timeZone);
            } catch (e) {
                // Si falla, puede ser un string sin zona horaria (PlainDateTime)
                try {
                    const plainDateTime = Temporal.PlainDateTime.from(input);
                    return plainDateTime.toZonedDateTime(timeZone);
                } catch (e2) {
                    // Si ambos fallan, el string es inválido.
                    throw new Error(`Invalid date string: ${input}`);
                }
            }
        }
        throw new Error('Unsupported date input');
    }

    static toDate(temporal: Temporal.ZonedDateTime): Date {
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

    static diff(a: DateInput, b: DateInput, unit: TimeUnit = 'millisecond'): number {
        const d1 = TemporalUtils.from(a);
        const d2 = TemporalUtils.from(b);

        // Ayudamos a TypeScript a entender que nuestra 'unit' es compatible.
        type TotalUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
        return d1.since(d2).total({ unit: unit as TotalUnit, relativeTo: d1 });
    }

    static isBefore(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === -1;
    }

    static isAfter(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === 1;
    }

    static isSame(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === 0;
    }

    static isSameDay(a: DateInput, b: DateInput): boolean {
        return TemporalUtils.from(a).toPlainDate().equals(TemporalUtils.from(b).toPlainDate());
    }

    static isValid(input: any): boolean {
        try {
            // Intentamos procesar el input con nuestro método principal.
            // Si no lanza un error, el input es válido.
            TemporalUtils.from(input);
            return true;
        } catch (e) {
            // Si 'from' lanza cualquier error, el input es inválido.
            return false;
        }
    }
}