import { Temporal } from '@js-temporal/polyfill';

type DateInput = Date | string | Temporal.PlainDateTime | Temporal.ZonedDateTime | TemporalWrapper;
type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
type AtemporalClass = typeof TemporalWrapper;
type Plugin<T = any> = (cls: AtemporalClass, factory: AtemporalFactory, options?: T) => void;
type AtemporalFunction = (input?: DateInput, tz?: string) => TemporalWrapper;
type AtemporalStatics = {
    extend: (plugin: Plugin, options?: any) => void;
    isValid: (input: any) => boolean;
    setDefaultLocale: (code: string) => void;
    setDefaultTimeZone: (tz: string) => void;
    getDefaultLocale: () => string;
};
type AtemporalFactory = AtemporalFunction & AtemporalStatics;

declare class TemporalWrapper {
    private readonly _datetime;
    private readonly _isValid;
    constructor(input: DateInput, timeZone?: string);
    /**
     * Comprueba si la instancia de Atemporal representa una fecha y hora válidas.
     * @returns {boolean} `true` si es válida, `false` en caso contrario.
     */
    isValid(): boolean;
    get datetime(): Temporal.ZonedDateTime;
    static from(input: DateInput, tz?: string): TemporalWrapper;
    timeZone(tz: string): TemporalWrapper;
    add(value: number, unit: TimeUnit): TemporalWrapper;
    subtract(value: number, unit: TimeUnit): TemporalWrapper;
    set(unit: SettableUnit, value: number): TemporalWrapper;
    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;
    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;
    clone(): TemporalWrapper;
    get(unit: SettableUnit): number;
    get year(): number;
    get month(): number;
    get day(): number;
    get dayOfWeekName(): string;
    get hour(): number;
    get minute(): number;
    get second(): number;
    get millisecond(): number;
    get quarter(): number;
    get weekOfYear(): number;
    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string;
    diff(other: DateInput, unit?: TimeUnit): number;
    toDate(): Date;
    toString(): string;
    get raw(): Temporal.ZonedDateTime;
    isBefore(other: DateInput): boolean;
    isAfter(other: DateInput): boolean;
    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean;
    isSameDay(other: DateInput): boolean;
    isLeapYear(): boolean;
}

export { type AtemporalFactory as A, type DateInput as D, type Plugin as P, type SettableUnit as S, TemporalWrapper as T, type TimeUnit as a };
