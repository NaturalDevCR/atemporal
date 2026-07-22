import type { Temporal } from '@js-temporal/polyfill';
import type { AtemporalDisambiguation, AtemporalOverflow } from '../types';

export type DateFields = { year: number; month: number; day: number };
export type DateTimeFields = DateFields & {
  hour?: number; minute?: number; second?: number; millisecond?: number;
  microsecond?: number; nanosecond?: number;
};

export type InstantInput = Temporal.Instant | Date | number | string;
export type PlainDateInput = Temporal.PlainDate | string | DateFields;
export type PlainDateTimeInput = Temporal.PlainDateTime | string | DateTimeFields;
export type ZonedDateTimeInput = Temporal.ZonedDateTime | string | Temporal.PlainDateTime | DateTimeFields;

export interface ZonedDateTimeOptions {
  timeZone?: string;
  disambiguation?: AtemporalDisambiguation;
  overflow?: AtemporalOverflow;
}
