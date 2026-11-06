import { isTemporalValue, Temporal } from '../core/temporal-api';
import { getExplicitOffset, hasTrailingTimeZoneAnnotation, withFixedOffsetZone } from '../core/parsing/input-safety';
import type { Temporal as TemporalTypes } from '@js-temporal/polyfill';
import { InvalidDateError } from '../errors';
import type { InstantInput, PlainDateInput, PlainDateTimeInput, ZonedDateTimeInput, ZonedDateTimeOptions } from '../types/temporal-inputs';

function invalid(name: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  throw new InvalidDateError(`${name} failed: ${message}`);
}

export function instant(input: InstantInput): TemporalTypes.Instant {
  try {
    if (input instanceof Date) return Temporal.Instant.fromEpochMilliseconds(input.getTime());
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) throw new TypeError('epoch milliseconds must be finite');
      return Temporal.Instant.fromEpochMilliseconds(input);
    }
    if (typeof input === 'string') return Temporal.Instant.from(input);
    if (isTemporalValue(input, 'Instant')) {
      const epochNanoseconds = input.epochNanoseconds;
      return input instanceof Temporal.Instant ? input : Temporal.Instant.fromEpochNanoseconds(epochNanoseconds);
    }
    throw new TypeError('Expected an instant, date, epoch milliseconds, or ISO string with an offset');
  } catch (error) { return invalid('instant', error); }
}

export function date(input: PlainDateInput): TemporalTypes.PlainDate {
  try {
    if (input instanceof Temporal.PlainDate) return input;
    return Temporal.PlainDate.from(isTemporalValue(input, 'PlainDate') ? String(input) : input, { overflow: 'reject' });
  }
  catch (error) { return invalid('date', error); }
}

export function plainDateTime(input: PlainDateTimeInput): TemporalTypes.PlainDateTime {
  try {
    if (input instanceof Temporal.PlainDateTime) return input;
    return Temporal.PlainDateTime.from(isTemporalValue(input, 'PlainDateTime') ? String(input) : input, { overflow: 'reject' });
  }
  catch (error) { return invalid('plainDateTime', error); }
}

export function zonedDateTime(input: ZonedDateTimeInput, options: ZonedDateTimeOptions = {}): TemporalTypes.ZonedDateTime {
  try {
    const policy = { disambiguation: options.disambiguation ?? 'reject', overflow: options.overflow ?? 'reject' } as const;
    if (input instanceof Temporal.ZonedDateTime || isTemporalValue(input, 'ZonedDateTime') ||
        (typeof input === 'string' && hasTrailingTimeZoneAnnotation(input))) {
      const value = input instanceof Temporal.ZonedDateTime ? input : Temporal.ZonedDateTime.from(String(input), policy);
      return options.timeZone ? value.withTimeZone(options.timeZone) : value;
    }

    if (typeof input === 'string') {
      const offset = getExplicitOffset(input);
      if (offset) {
        const value = Temporal.ZonedDateTime.from(withFixedOffsetZone(input, offset), {
          ...policy, offset: 'use',
        });
        return options.timeZone ? value.withTimeZone(options.timeZone) : value;
      }
    }

    if (!options.timeZone) throw new TypeError('timeZone is required for a local date-time');
    const plain = input instanceof Temporal.PlainDateTime ? input : Temporal.PlainDateTime.from(
      isTemporalValue(input, 'PlainDateTime') ? String(input) : input, policy,
    );
    return plain.toZonedDateTime(options.timeZone, policy);
  } catch (error) { return invalid('zonedDateTime', error); }
}
