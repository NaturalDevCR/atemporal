import { Temporal } from 'temporal-polyfill';
import { TemporalWrapper } from './TemporalWrapper';
export type DateInput = Date | string | Temporal.PlainDateTime | Temporal.ZonedDateTime;
export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
export type AtemporalClass = typeof TemporalWrapper;
export type Plugin<T = any> = (cls: AtemporalClass, factory: AtemporalFactory, options?: T) => void;
export type AtemporalFunction = (input?: DateInput, tz?: string) => TemporalWrapper;
export type AtemporalStatics = {
    extend: (plugin: Plugin, options?: any) => void;
    isValid: (input: any) => boolean;
    setDefaultLocale: (code: string) => void;
    setDefaultTimeZone: (tz: string) => void;
    getDefaultLocale: () => string;
};
export type AtemporalFactory = AtemporalFunction & AtemporalStatics;
