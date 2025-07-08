import { Temporal } from '@js-temporal/polyfill';
import { TemporalUtils } from './TemporalUtils';
import type { DateInput, TimeUnit, SettableUnit } from './types';

// Función auxiliar para pluralizar unidades, se mantiene igual.
function getDurationUnit(unit: TimeUnit): string {
    if (unit === 'millisecond') return 'milliseconds';
    return `${unit}s`;
}

export class TemporalWrapper {
    // --- CAMBIO 1: Estado Interno ---
    // _datetime ahora puede ser null si la fecha es inválida.
    // _isValid guarda el estado de la instancia.
    private readonly _datetime: Temporal.ZonedDateTime | null;
    private readonly _isValid: boolean;

    constructor(input: DateInput, timeZone: string = TemporalUtils.defaultTimeZone) {
        // --- CAMBIO 2: El Constructor ahora es a prueba de errores ---
        try {
            // Intentamos crear la fecha como antes.
            this._datetime = TemporalUtils.from(input, timeZone);
            this._isValid = true;
        } catch (e) {
            // Si TemporalUtils.from lanza un error, lo capturamos.
            // Marcamos la instancia como inválida y asignamos null.
            this._datetime = null;
            this._isValid = false;
        }
    }

    // --- CAMBIO 3: El método `isValid` de instancia ---
    /**
     * Comprueba si la instancia de Atemporal representa una fecha y hora válidas.
     * @returns {boolean} `true` si es válida, `false` en caso contrario.
     */
    isValid(): boolean {
        return this._isValid;
    }

    // --- CAMBIO 4: Getter protegido para el objeto Temporal interno ---
    // Este getter asegura que no intentemos operar sobre un objeto nulo.
    // Los métodos públicos usarán `isValid()` para evitar llegar a este error.
    get datetime(): Temporal.ZonedDateTime {
        if (!this._isValid || !this._datetime) {
            throw new Error("Cannot perform operations on an invalid Atemporal object.");
        }
        return this._datetime;
    }

    // --- CAMBIO 5: Todos los métodos públicos ahora están protegidos ---
    // A partir de aquí, cada método primero comprueba si la instancia es válida.

    static from(input: DateInput, tz?: string) {
        return new TemporalWrapper(input, tz);
    }

    timeZone(tz: string): TemporalWrapper {
        if (!this.isValid()) return this; // Devuelve la misma instancia inválida
        return new TemporalWrapper(this.datetime.withTimeZone(tz));
    }

    add(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.add(duration);
        return new TemporalWrapper(newDate);
    }

    subtract(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.subtract(duration);
        return new TemporalWrapper(newDate);
    }

    set(unit: SettableUnit, value: number): TemporalWrapper {
        if (!this.isValid()) return this;
        const newDate = this.datetime.with({ [unit]: value });
        return new TemporalWrapper(newDate);
    }

    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        // La lógica interna no cambia, solo se protege la entrada.
        switch (unit) {
            case 'year': {
                const pDate = this.datetime.toPlainDate().with({ month: 1, day: 1 });
                return new TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
            }
            case 'month': {
                const pDate = this.datetime.toPlainDate().with({ day: 1 });
                return new TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
            }
            case 'week': {
                const dayOfWeek = this.datetime.dayOfWeek;
                const daysToSubtract = dayOfWeek - 1;
                const pDate = this.datetime.subtract({ days: daysToSubtract }).toPlainDate();
                return new TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
            }
            case 'day':
                return new TemporalWrapper(this.datetime.startOfDay());
            case 'hour':
            case 'minute':
            case 'second':
                const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: 'floor' });
                return new TemporalWrapper(newDate);
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
        return new TemporalWrapper(this.datetime);
    }

    get(unit: SettableUnit): number {
        if (!this.isValid()) return NaN;
        return this.datetime[unit];
    }

    // Getters protegidos
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

    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string {
        if (!this.isValid()) return 'Invalid Date';

        // La lógica ahora vive aquí, haciendo la clase más autocontenida.
        const locale = localeCode || TemporalUtils.getDefaultLocale();
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };

        return new Intl.DateTimeFormat(locale, {
            timeZone: this.datetime.timeZoneId,
            ...defaultOptions,
            ...options // Las opciones del usuario sobreescriben las por defecto
        }).format(this.toDate());
    }

    diff(other: DateInput, unit: TimeUnit = 'millisecond'): number {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return NaN;
        return TemporalUtils.diff(this.datetime, other, unit);
    }

    toDate(): Date {
        if (!this.isValid()) return new Date(NaN); // Devuelve un objeto Date inválido estándar
        return TemporalUtils.toDate(this.datetime);
    }

    toString(): string {
        if (!this.isValid()) return 'Invalid Date';
        return this.datetime.toString();
    }

    get raw(): Temporal.ZonedDateTime {
        // Este es el único lugar donde lanzamos un error si se intenta acceder al objeto raw de una instancia inválida.
        return this.datetime;
    }

    isBefore(other: DateInput): boolean {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return false;
        return TemporalUtils.isBefore(this.datetime, other);
    }

    isAfter(other: DateInput): boolean {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return false;
        return TemporalUtils.isAfter(this.datetime, other);
    }

    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean {
        const other = new TemporalWrapper(otherDate);
        if (!this.isValid() || !other.isValid()) return false;

        switch (unit) {
            case 'year':
                return this.datetime.year === other.datetime.year;
            case 'month':
                return this.datetime.year === other.datetime.year &&
                    this.datetime.month === other.datetime.month;
            case 'day':
                return this.datetime.toPlainDate().equals(other.datetime.toPlainDate());
            default:
                return this.datetime.epochMilliseconds === other.datetime.epochMilliseconds;
        }
    }

    isSameDay(other: DateInput): boolean {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return false;
        return TemporalUtils.isSameDay(this.datetime, other);
    }

    isLeapYear(): boolean {
        if (!this.isValid()) return false;
        return this.datetime.inLeapYear;
    }
}