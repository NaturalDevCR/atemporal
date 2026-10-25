function isAsciiDigit(value: string | undefined): boolean {
  return value !== undefined && value >= '0' && value <= '9';
}

export function hasExplicitOffset(input: string): boolean {
  return getExplicitOffset(input) !== undefined;
}

export function hasTrailingTimeZoneAnnotation(input: string): boolean {
  const openingBracket = input.lastIndexOf('[');
  return openingBracket >= 0 && openingBracket < input.length - 1 && input.endsWith(']');
}

export function getExplicitOffset(input: string): string | undefined {
  const compact = input.slice(-5);
  if ((compact[0] === '+' || compact[0] === '-') &&
      isAsciiDigit(compact[1]) && isAsciiDigit(compact[2]) &&
      isAsciiDigit(compact[3]) && isAsciiDigit(compact[4])) return compact;

  const separated = input.slice(-6);
  if ((separated[0] === '+' || separated[0] === '-') &&
      isAsciiDigit(separated[1]) && isAsciiDigit(separated[2]) &&
      separated[3] === ':' && isAsciiDigit(separated[4]) && isAsciiDigit(separated[5])) return separated;

  return input.endsWith('Z') || input.endsWith('z') ? 'UTC' : undefined;
}
