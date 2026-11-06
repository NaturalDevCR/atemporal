import { TemporalWrapper } from '../../TemporalWrapper';
import { TemporalUtils } from '../../TemporalUtils';
import { InvalidDateError } from '../../errors';
import { isTemporalValue, Temporal } from '../temporal-api';
import { getExplicitOffset, hasTrailingTimeZoneAnnotation, withFixedOffsetZone } from './input-safety';
import type { DateInput, ParseOptions } from '../../types';

type StrictTemporalOptions = Required<Pick<ParseOptions, 'disambiguation' | 'overflow'>>;

function strictOptions(options: ParseOptions): StrictTemporalOptions {
  return {
    disambiguation: options.disambiguation ?? 'reject',
    overflow: options.overflow ?? 'reject',
  };
}

function preserveOrConvert(
  value: InstanceType<typeof Temporal.ZonedDateTime>,
  options: ParseOptions,
  fallbackTimeZone: string,
): InstanceType<typeof Temporal.ZonedDateTime> {
  if (options.preserveOriginalTimeZone ?? true) return value;
  const targetTimeZone = options.timeZone ?? fallbackTimeZone;
  return value.timeZoneId === targetTimeZone ? value : value.withTimeZone(targetTimeZone);
}

function parseString(
  input: string,
  timeZone: string,
  options: ParseOptions,
): InstanceType<typeof Temporal.ZonedDateTime> {
  const policy = strictOptions(options);

  if (hasTrailingTimeZoneAnnotation(input)) {
    return preserveOrConvert(Temporal.ZonedDateTime.from(input, policy), options, timeZone);
  }

  const explicitOffset = getExplicitOffset(input);
  if (explicitOffset) {
    const value = Temporal.ZonedDateTime.from(withFixedOffsetZone(input, explicitOffset), { offset: 'use' });
    return preserveOrConvert(value, options, timeZone);
  }

  return Temporal.PlainDateTime.from(input, policy).toZonedDateTime(timeZone, policy);
}

function parseStrictInput(
  input: DateInput,
  options: ParseOptions,
): InstanceType<typeof Temporal.ZonedDateTime> {
  const timeZone = options.timeZone ?? TemporalUtils.defaultTimeZone;
  const policy = strictOptions(options);

  if (input === null || input === undefined) {
    throw new InvalidDateError('Strict parsing requires a date input');
  }

  if (input instanceof TemporalWrapper) {
    if (!input.isValid()) throw new InvalidDateError(input.error ?? 'Invalid atemporal instance');
    return preserveOrConvert(TemporalUtils.from(input), options, timeZone);
  }

  if (input instanceof Temporal.ZonedDateTime) {
    return preserveOrConvert(input, options, timeZone);
  }

  if (isTemporalValue(input, 'ZonedDateTime')) {
    return preserveOrConvert(Temporal.ZonedDateTime.from(String(input), policy), options, timeZone);
  }

  if (input instanceof Temporal.PlainDateTime) {
    return input.toZonedDateTime(timeZone, policy);
  }

  if (isTemporalValue(input, 'PlainDateTime')) {
    return Temporal.PlainDateTime.from(String(input), policy).toZonedDateTime(timeZone, policy);
  }

  if (typeof input === 'string') {
    return parseString(input, timeZone, options);
  }

  if (Array.isArray(input)) {
    if (input.length === 0 || input.length > 9 || !Array.from(input).every(Number.isInteger)) {
      throw new InvalidDateError('Strict parsing requires one to nine integer date components');
    }
    const [year, month = 1, day = 1, hour, minute, second, millisecond, microsecond, nanosecond] = input;
    return Temporal.ZonedDateTime.from({
      year, month, day, hour, minute, second, millisecond, microsecond, nanosecond, timeZone,
    }, policy);
  }

  if (typeof input === 'object' && 'year' in input) {
    return Temporal.PlainDateTime.from(input, policy).toZonedDateTime(timeZone, policy);
  }

  const compatible = TemporalWrapper.from(input, timeZone);
  if (!compatible.isValid()) throw new InvalidDateError(compatible.error ?? 'Invalid date input');
  return compatible.raw;
}

/** Parses input with rejecting DST and calendar policies by default. */
export function parseStrict(input: DateInput, options: ParseOptions = {}): TemporalWrapper {
  try {
    return TemporalWrapper.from(parseStrictInput(input, options));
  } catch (error) {
    if (error instanceof InvalidDateError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new InvalidDateError(`Strict parsing failed: ${message}`);
  }
}

/** Parses input strictly, returning null for every invalid user input. */
export function tryParseStrict(input: DateInput, options: ParseOptions = {}): TemporalWrapper | null {
  try {
    return parseStrict(input, options);
  } catch {
    return null;
  }
}
