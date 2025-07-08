import { Temporal } from '@js-temporal/polyfill';
import { TemporalWrapper } from './TemporalWrapper';

// --- Tipos Generales ---
export type DateInput = Date | string | Temporal.PlainDateTime | Temporal.ZonedDateTime | TemporalWrapper;
export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

// --- Tipos del Sistema de Plugins ---
export type AtemporalClass = typeof TemporalWrapper;
export type Plugin<T = any> = (cls: AtemporalClass, factory: AtemporalFactory, options?: T) => void;

// La firma de la función principal
export type AtemporalFunction = (input?: DateInput, tz?: string) => TemporalWrapper;

// Las propiedades estáticas que cuelgan de la función principal
export type AtemporalStatics = {
    extend: (plugin: Plugin, options?: any) => void;
    isValid: (input: any) => boolean;
    setDefaultLocale: (code: string) => void;
    setDefaultTimeZone: (tz: string) => void;
    getDefaultLocale: () => string;
};

// El tipo final es la combinación de la función y sus propiedades
export type AtemporalFactory = AtemporalFunction & AtemporalStatics;