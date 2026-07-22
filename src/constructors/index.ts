import { Temporal } from '../core/temporal-api';
import type { Temporal as TemporalTypes } from '@js-temporal/polyfill';
import { InvalidDateError } from '../errors';
import type { InstantInput, PlainDateInput, PlainDateTimeInput, ZonedDateTimeInput, ZonedDateTimeOptions } from '../types/temporal-inputs';

function invalid(name: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  throw new InvalidDateError(`${name} failed: ${message}`);
}

export function instant(input: InstantInput): TemporalTypes.Instant {
  try {
    if (input instanceof Temporal.Instant) return input;
    if (input instanceof Date) return Temporal.Instant.fromEpochMilliseconds(input.getTime());
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) throw new TypeError('epoch milliseconds must be finite');
      return Temporal.Instant.fromEpochMilliseconds(input);
    }
    if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(input)) throw new TypeError('ISO input requires Z or an explicit offset');
    return Temporal.Instant.from(input);
  } catch (error) { return invalid('instant', error); }
}

export function date(input: PlainDateInput): TemporalTypes.PlainDate {
  try { return input instanceof Temporal.PlainDate ? input : Temporal.PlainDate.from(input, { overflow: 'reject' }); }
  catch (error) { return invalid('date', error); }
}

export function plainDateTime(input: PlainDateTimeInput): TemporalTypes.PlainDateTime {
  try { return input instanceof Temporal.PlainDateTime ? input : Temporal.PlainDateTime.from(input, { overflow: 'reject' }); }
  catch (error) { return invalid('plainDateTime', error); }
}

export function zonedDateTime(input: ZonedDateTimeInput, options: ZonedDateTimeOptions = {}): TemporalTypes.ZonedDateTime {
  try {
    const policy = { disambiguation: options.disambiguation ?? 'reject', overflow: options.overflow ?? 'reject' } as const;
    if (input instanceof Temporal.ZonedDateTime) return options.timeZone ? input.withTimeZone(options.timeZone) : input;
    if (typeof input === 'string' && /\[[^\]]+\]$/.test(input)) return Temporal.ZonedDateTime.from(input, policy);
    const plain = input instanceof Temporal.PlainDateTime ? input : Temporal.PlainDateTime.from(input, policy);
    if (!options.timeZone) throw new TypeError('timeZone is required for a local date-time');
    return Temporal.ZonedDateTime.from({
      year: plain.year, month: plain.month, day: plain.day, hour: plain.hour, minute: plain.minute,
      second: plain.second, millisecond: plain.millisecond, microsecond: plain.microsecond,
      nanosecond: plain.nanosecond, timeZone: options.timeZone,
    }, policy);
  } catch (error) { return invalid('zonedDateTime', error); }
}
