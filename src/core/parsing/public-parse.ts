import { TemporalWrapper } from '../../TemporalWrapper';
import { TemporalUtils } from '../../TemporalUtils';
import { InvalidDateError } from '../../errors';
import { Temporal } from '../temporal-api';
import type { DateInput, ParseOptions } from '../../types';

type StrictTemporalOptions = Required<Pick<ParseOptions, 'disambiguation' | 'overflow'>>;

function strictOptions(options: ParseOptions): StrictTemporalOptions {
  return {
    disambiguation: options.disambiguation ?? 'reject',
    overflow: options.overflow ?? 'reject',
  };
}

function toZonedDateTime(
  plain: InstanceType<typeof Temporal.PlainDateTime>,
  timeZone: string,
  options: StrictTemporalOptions,
): InstanceType<typeof Temporal.ZonedDateTime> {
  return Temporal.ZonedDateTime.from({
    year: plain.year,
    month: plain.month,
    day: plain.day,
    hour: plain.hour,
    minute: plain.minute,
    second: plain.second,
    millisecond: plain.millisecond,
    microsecond: plain.microsecond,
    nanosecond: plain.nanosecond,
    timeZone,
  }, options);
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

  if (/\[[^\]]+\]$/.test(input)) {
    return preserveOrConvert(Temporal.ZonedDateTime.from(input, policy), options, timeZone);
  }

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(input)) {
    const instant = Temporal.Instant.from(input);
    const originalOffset = input.match(/([+-]\d{2}:?\d{2})(?:$|\[)/)?.[1];
    const originalTimeZone = originalOffset
      ? originalOffset.includes(':')
        ? originalOffset
        : `${originalOffset.slice(0, 3)}:${originalOffset.slice(3)}`
      : 'UTC';
    return preserveOrConvert(instant.toZonedDateTimeISO(originalTimeZone), options, timeZone);
  }

  const plain = input.includes('T')
    ? Temporal.PlainDateTime.from(input, policy)
    : Temporal.PlainDate.from(input, policy).toPlainDateTime();
  return toZonedDateTime(plain, timeZone, policy);
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
    return preserveOrConvert(input.raw, options, timeZone);
  }

  if (input instanceof Temporal.ZonedDateTime) {
    return preserveOrConvert(input, options, timeZone);
  }

  if (input instanceof Temporal.PlainDateTime) {
    return toZonedDateTime(input, timeZone, policy);
  }

  if (typeof input === 'string') {
    return parseString(input, timeZone, options);
  }

  if (typeof input === 'object' && 'year' in input) {
    return toZonedDateTime(Temporal.PlainDateTime.from(input, policy), timeZone, policy);
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
