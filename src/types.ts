import { Temporal } from 'temporal-polyfill';
import { TemporalWrapper } from './TemporalWrapper';

// --- Tipos Generales ---
export type DateInput = Date | string | Temporal.PlainDateTime | Temporal.ZonedDateTime;
export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

// --- Tipos del Sistema de Plugins ---
export type AtemporalFactory = (input?: DateInput, tz?: string) => TemporalWrapper;
export type AtemporalClass = typeof TemporalWrapper;
export type Plugin<T = any> = (cls: AtemporalClass, factory: AtemporalFactory, options?: T) => void;