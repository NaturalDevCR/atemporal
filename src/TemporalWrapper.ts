import { Temporal } from 'temporal-polyfill';
import { TemporalUtils } from './TemporalUtils';

import type { DateInput, TimeUnit, SettableUnit } from './types';

export class TemporalWrapper {
    private readonly datetime: Temporal.ZonedDateTime;

    constructor(input: DateInput, timeZone: string = TemporalUtils.defaultTimeZone) {
        this.datetime = TemporalUtils.from(input, timeZone);
    }

    static from(input: DateInput, tz?: string) {
        return new TemporalWrapper(input, tz);
    }

    timeZone(tz: string): TemporalWrapper {
        return new TemporalWrapper(this.datetime.withTimeZone(tz));
    }

    add(value: number, unit: TimeUnit): TemporalWrapper {
        // @ts-ignore
        const newDate = this.datetime.add({ [unit]: value });
        return new TemporalWrapper(newDate);
    }

    subtract(value: number, unit: TimeUnit): TemporalWrapper {
        // @ts-ignore
        const newDate = this.datetime.subtract({ [unit]: value });
        return new TemporalWrapper(newDate);
    }

    set(unit: SettableUnit, value: number): TemporalWrapper {
        const newDate = this.datetime.with({ [unit]: value });
        return new TemporalWrapper(newDate);
    }

    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        // @ts-ignore
        const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: 'floor' });
        return new TemporalWrapper(newDate);
    }

    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        const start = this.startOf(unit).raw;
        // @ts-ignore
        const nextStart = start.add({ [unit]: 1 });
        const endDate = nextStart.subtract({ milliseconds: 1 });
        return new TemporalWrapper(endDate);
    }

    clone(): TemporalWrapper {
        return new TemporalWrapper(this.datetime);
    }

    get(unit: SettableUnit): number {
        return this.datetime[unit];
    }

    get year(): number { return this.datetime.year; }
    get month(): number { return this.datetime.month; }
    get day(): number { return this.datetime.day; }
    get hour(): number { return this.datetime.hour; }
    get minute(): number { return this.datetime.minute; }
    get second(): number { return this.datetime.second; }
    get millisecond(): number { return this.datetime.millisecond; }

    get quarter(): number {
        return Math.ceil(this.datetime.month / 3);
    }

    get weekOfYear(): number {
        return this.datetime.weekOfYear!;
    }

    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string {
        return TemporalUtils.format(this.datetime, options, localeCode);
    }

    diff(other: DateInput, unit: TimeUnit = 'millisecond'): number {
        return TemporalUtils.diff(this.datetime, other, unit);
    }

    toDate(): Date {
        return TemporalUtils.toDate(this.datetime);
    }

    toString(): string {
        return this.datetime.toString();
    }

    get raw(): Temporal.ZonedDateTime {
        return this.datetime;
    }

    isBefore(other: DateInput): boolean {
        return TemporalUtils.isBefore(this.datetime, other);
    }

    isAfter(other: DateInput): boolean {
        return TemporalUtils.isAfter(this.datetime, other);
    }

    isSameDay(other: DateInput): boolean {
        return TemporalUtils.isSameDay(this.datetime, other);
    }

    isLeapYear(): boolean {
        return this.datetime.inLeapYear;
    }
}