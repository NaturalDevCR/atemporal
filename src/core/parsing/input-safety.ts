export function hasTrailingTimeZoneAnnotation(input: string): boolean {
  const openingBracket = input.indexOf('[');
  if (openingBracket < 0) return false;
  const closingBracket = input.indexOf(']', openingBracket + 1);
  return closingBracket > openingBracket + 1 &&
    !input.slice(openingBracket + 1, closingBracket).includes('=');
}

export function getExplicitOffset(input: string): string | undefined {
  const annotation = input.indexOf('[');
  const base = annotation < 0 ? input : input.slice(0, annotation);
  if (!/[Tt ]/.test(base)) return undefined;
  if (base.endsWith('Z') || base.endsWith('z')) return 'UTC';
  // RFC 9557 offsets have at most 19 characters, including fractional seconds.
  return /[+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?$/.exec(base.slice(-19))?.[0];
}

export function withFixedOffsetZone(input: string, offset: string): string {
  // ZonedDateTime offset zone IDs have minute precision. Use UTC for
  // sub-minute offsets while retaining the original offset in the input.
  const timeZone = /^[+-]\d{2}(?::?\d{2})?$/.test(offset) ? offset : 'UTC';
  const annotation = input.indexOf('[');
  const end = annotation < 0 ? input.length : annotation;
  return `${input.slice(0, end)}[${timeZone}]${input.slice(end)}`;
}
