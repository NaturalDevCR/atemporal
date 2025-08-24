/**
 * @file Comprehensive test suite for InstanceValidator
 * Tests all validation methods with edge cases and error scenarios
 */

import { Temporal } from '@js-temporal/polyfill';
import { InstanceValidator } from '../../../core/validation/instance-validator';

describe('InstanceValidator', () => {
    describe('isValidZonedDateTime', () => {
        it('should return true for valid ZonedDateTime instances', () => {
            const validDateTime = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            expect(InstanceValidator.isValidZonedDateTime(validDateTime)).toBe(true);
        });

        it('should return false for null input', () => {
            expect(InstanceValidator.isValidZonedDateTime(null)).toBe(false);
        });

        it('should return false for undefined input', () => {
            expect(InstanceValidator.isValidZonedDateTime(undefined)).toBe(false);
        });

        it('should return false for invalid objects', () => {
            const invalidObject = { year: 'invalid', month: 1, day: 1 } as any;
            expect(InstanceValidator.isValidZonedDateTime(invalidObject)).toBe(false);
        });

        it('should return false for objects with NaN epochMilliseconds', () => {
            const invalidDateTime = {
                year: 2023,
                month: 1,
                day: 1,
                epochMilliseconds: NaN
            } as any;
            expect(InstanceValidator.isValidZonedDateTime(invalidDateTime)).toBe(false);
        });

        it('should handle objects that throw errors when accessing properties', () => {
            const throwingObject = {
                get year() { throw new Error('Property access error'); }
            } as any;
            expect(InstanceValidator.isValidZonedDateTime(throwingObject)).toBe(false);
        });
    });

    describe('isValidDateInput', () => {
        it('should return true for valid string dates', () => {
            expect(InstanceValidator.isValidDateInput('2023-01-01')).toBe(true);
            expect(InstanceValidator.isValidDateInput('2023-01-01T00:00:00Z')).toBe(true);
        });

        it('should return true for valid numbers', () => {
            expect(InstanceValidator.isValidDateInput(1672531200000)).toBe(true); // Valid timestamp
            expect(InstanceValidator.isValidDateInput(0)).toBe(true);
        });

        it('should return true for valid Date objects', () => {
            expect(InstanceValidator.isValidDateInput(new Date('2023-01-01'))).toBe(true);
        });

        it('should return false for null and undefined', () => {
            expect(InstanceValidator.isValidDateInput(null)).toBe(false);
            expect(InstanceValidator.isValidDateInput(undefined)).toBe(false);
        });

        it('should return false for empty strings', () => {
            expect(InstanceValidator.isValidDateInput('')).toBe(false);
            expect(InstanceValidator.isValidDateInput('   ')).toBe(false);
        });

        it('should return false for infinite numbers', () => {
            expect(InstanceValidator.isValidDateInput(Infinity)).toBe(false);
            expect(InstanceValidator.isValidDateInput(-Infinity)).toBe(false);
            expect(InstanceValidator.isValidDateInput(NaN)).toBe(false);
        });

        it('should return false for invalid Date objects', () => {
            expect(InstanceValidator.isValidDateInput(new Date('invalid'))).toBe(false);
        });

        it('should handle objects that throw errors', () => {
            const throwingObject = {
                toString() { throw new Error('toString error'); }
            };
            expect(InstanceValidator.isValidDateInput(throwingObject)).toBe(false);
        });
    });

    describe('isValidTimeZone', () => {
        it('should return true for valid timezone identifiers', () => {
            expect(InstanceValidator.isValidTimeZone('UTC')).toBe(true);
            expect(InstanceValidator.isValidTimeZone('America/New_York')).toBe(true);
            expect(InstanceValidator.isValidTimeZone('Europe/London')).toBe(true);
            expect(InstanceValidator.isValidTimeZone('Asia/Tokyo')).toBe(true);
        });

        it('should return false for invalid timezone identifiers', () => {
            expect(InstanceValidator.isValidTimeZone('Invalid/Timezone')).toBe(false);
            expect(InstanceValidator.isValidTimeZone('NotATimezone')).toBe(false);
            expect(InstanceValidator.isValidTimeZone('')).toBe(false);
        });

        it('should handle edge cases', () => {
            // GMT is valid, but GMT with offsets are not
            expect(InstanceValidator.isValidTimeZone('GMT')).toBe(true);
            expect(InstanceValidator.isValidTimeZone('GMT+5')).toBe(false);
            expect(InstanceValidator.isValidTimeZone('GMT-8')).toBe(false);
            // Test some actual IANA identifiers that should work
            expect(InstanceValidator.isValidTimeZone('Etc/GMT')).toBe(true);
            expect(InstanceValidator.isValidTimeZone('Etc/GMT+5')).toBe(true);
            expect(InstanceValidator.isValidTimeZone('Etc/GMT-8')).toBe(true);
        });

        it('should fallback to Intl.DateTimeFormat when supportedValuesOf fails', () => {
            // Mock supportedValuesOf to throw an error
            const originalSupportedValuesOf = Intl.supportedValuesOf;
            (Intl as any).supportedValuesOf = () => { throw new Error('Not supported'); };
            
            try {
                expect(InstanceValidator.isValidTimeZone('UTC')).toBe(true);
                expect(InstanceValidator.isValidTimeZone('Invalid/Timezone')).toBe(false);
            } finally {
                (Intl as any).supportedValuesOf = originalSupportedValuesOf;
            }
        });
    });

    describe('isValidLocale', () => {
        it('should return true for valid locale strings', () => {
            expect(InstanceValidator.isValidLocale('en')).toBe(true);
            expect(InstanceValidator.isValidLocale('en-US')).toBe(true);
            expect(InstanceValidator.isValidLocale('fr-FR')).toBe(true);
            expect(InstanceValidator.isValidLocale('ja-JP')).toBe(true);
        });

        it('should return false for invalid locale strings', () => {
            expect(InstanceValidator.isValidLocale('invalid-locale')).toBe(false);
            expect(InstanceValidator.isValidLocale('xx-XX')).toBe(false);
            expect(InstanceValidator.isValidLocale('')).toBe(false);
        });

        it('should handle edge cases', () => {
            expect(InstanceValidator.isValidLocale('en-GB')).toBe(true);
            expect(InstanceValidator.isValidLocale('zh-CN')).toBe(true);
        });
    });

    describe('isValidNumber', () => {
        it('should return true for valid finite numbers', () => {
            expect(InstanceValidator.isValidNumber(0)).toBe(true);
            expect(InstanceValidator.isValidNumber(42)).toBe(true);
            expect(InstanceValidator.isValidNumber(-42)).toBe(true);
            expect(InstanceValidator.isValidNumber(3.14159)).toBe(true);
            expect(InstanceValidator.isValidNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
            expect(InstanceValidator.isValidNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
        });

        it('should return false for non-numbers', () => {
            expect(InstanceValidator.isValidNumber('42')).toBe(false);
            expect(InstanceValidator.isValidNumber(null)).toBe(false);
            expect(InstanceValidator.isValidNumber(undefined)).toBe(false);
            expect(InstanceValidator.isValidNumber({})).toBe(false);
            expect(InstanceValidator.isValidNumber([])).toBe(false);
            expect(InstanceValidator.isValidNumber(true)).toBe(false);
        });

        it('should return false for invalid numbers', () => {
            expect(InstanceValidator.isValidNumber(NaN)).toBe(false);
            expect(InstanceValidator.isValidNumber(Infinity)).toBe(false);
            expect(InstanceValidator.isValidNumber(-Infinity)).toBe(false);
        });
    });

    describe('isValidTimeUnit', () => {
        it('should return true for valid singular time units', () => {
            expect(InstanceValidator.isValidTimeUnit('year')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('month')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('week')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('day')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('hour')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('minute')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('second')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('millisecond')).toBe(true);
        });

        it('should return true for valid plural time units', () => {
            expect(InstanceValidator.isValidTimeUnit('years')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('months')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('weeks')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('days')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('hours')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('minutes')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('seconds')).toBe(true);
            expect(InstanceValidator.isValidTimeUnit('milliseconds')).toBe(true);
        });

        it('should return false for invalid time units', () => {
            expect(InstanceValidator.isValidTimeUnit('invalid')).toBe(false);
            expect(InstanceValidator.isValidTimeUnit('decade')).toBe(false);
            expect(InstanceValidator.isValidTimeUnit('century')).toBe(false);
            expect(InstanceValidator.isValidTimeUnit('')).toBe(false);
            expect(InstanceValidator.isValidTimeUnit('YEAR')).toBe(false); // Case sensitive
        });
    });

    describe('isValidInclusivity', () => {
        it('should return true for valid inclusivity strings', () => {
            expect(InstanceValidator.isValidInclusivity('()')).toBe(true); // Exclusive both
            expect(InstanceValidator.isValidInclusivity('[]')).toBe(true); // Inclusive both
            expect(InstanceValidator.isValidInclusivity('(]')).toBe(true); // Exclusive start, inclusive end
            expect(InstanceValidator.isValidInclusivity('[)')).toBe(true); // Inclusive start, exclusive end
        });

        it('should return false for invalid inclusivity strings', () => {
            expect(InstanceValidator.isValidInclusivity('(')).toBe(false);
            expect(InstanceValidator.isValidInclusivity(')')).toBe(false);
            expect(InstanceValidator.isValidInclusivity('[')).toBe(false);
            expect(InstanceValidator.isValidInclusivity(']')).toBe(false);
            expect(InstanceValidator.isValidInclusivity('((')).toBe(false);
            expect(InstanceValidator.isValidInclusivity('))')).toBe(false);
            expect(InstanceValidator.isValidInclusivity('invalid')).toBe(false);
            expect(InstanceValidator.isValidInclusivity('')).toBe(false);
        });
    });
});