import { Temporal } from 'temporal-polyfill';
import { TemporalWrapper } from './TemporalWrapper';
import type { DateInput, TimeUnit } from './types';
export declare class TemporalUtils {
    private static _defaultTimeZone;
    private static _defaultLocale;
    static setDefaultLocale(code: string): void;
    static getDefaultLocale(): string;
    static setDefaultTimeZone(tz: string): void;
    static get defaultTimeZone(): string;
    static from(input: DateInput, timeZone?: string): Temporal.ZonedDateTime;
    static toDate(temporal: Temporal.ZonedDateTime): Date;
    static format(input: DateInput, options?: Intl.DateTimeFormatOptions, localeCode?: string): string;
    static diff(a: DateInput, b: DateInput, unit?: TimeUnit): number;
    static isBefore(a: DateInput, b: DateInput): boolean;
    static isAfter(a: DateInput, b: DateInput): boolean;
    static isSame(a: DateInput, b: DateInput): boolean;
    static isSameDay(a: DateInput, b: DateInput): boolean;
    static isValid(input: any): boolean;
    static wrap(input?: DateInput, timeZone?: string): TemporalWrapper;
}
