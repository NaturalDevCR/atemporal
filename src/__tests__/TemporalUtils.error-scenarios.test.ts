import { TemporalUtils } from '../TemporalUtils';
import { InvalidTimeZoneError, InvalidDateError } from '../errors';
import { Temporal } from '@js-temporal/polyfill';

describe('TemporalUtils Error Scenarios', () => {
    describe('Invalid timezone handling', () => {
        it('should throw when setting invalid default timezone', () => {
            expect(() => TemporalUtils.setDefaultTimeZone('Invalid/Zone'))
                .toThrow(InvalidTimeZoneError);
        });

        it('should handle invalid timezone in withTimeZone conversion', () => {
            const zdt = TemporalUtils.from('2024-01-01T00:00:00Z');
            expect(() => zdt.withTimeZone('Invalid/Zone'))
                .toThrow();
        });
    });

    describe('Number input edge cases', () => {
        it('should handle number inputs as epoch milliseconds', () => {
            const result = TemporalUtils.from(1640995200000); // 2022-01-01
            expect(result.year).toBe(2022);
            expect(result.month).toBe(1);
            expect(result.day).toBe(1);
        });

        it('should handle negative epoch milliseconds', () => {
            const result = TemporalUtils.from(-86400000); // 1969-12-31
            expect(result.year).toBe(1969);
            expect(result.month).toBe(12);
            expect(result.day).toBe(31);
        });
    });

    describe('Array input validation', () => {
        it('should throw for invalid date arrays with overflow month', () => {
            expect(() => TemporalUtils.from([2024, 13, 1])) // Invalid month
                .toThrow(InvalidDateError);
        });

        it('should throw for invalid date arrays with overflow day', () => {
            expect(() => TemporalUtils.from([2024, 2, 30])) // Invalid day for February
                .toThrow(InvalidDateError);
        });

        it('should throw for invalid date arrays with negative values', () => {
            expect(() => TemporalUtils.from([2024, -1, 1])) // Negative month
                .toThrow(InvalidDateError);
        });

        it('should handle valid minimal array input', () => {
            const result = TemporalUtils.from([2024]); // Only year
            expect(result.year).toBe(2024);
            expect(result.month).toBe(1);
            expect(result.day).toBe(1);
        });
    });

    describe('Object input validation', () => {
        it('should throw for invalid date objects with overflow', () => {
            expect(() => TemporalUtils.from({ year: 2024, month: 13, day: 1 }))
                .toThrow(InvalidDateError);
        });

        it('should throw for invalid date objects with missing required fields', () => {
            expect(() => TemporalUtils.from({ month: 5, day: 15 } as any)) // Missing year
                .toThrow(InvalidDateError);
        });

        it('should throw for incomplete object input', () => {
        // Objects need at least year, month, day for Temporal.PlainDateTime.from with overflow: 'reject'
        expect(() => TemporalUtils.from({ year: 2024 }))
            .toThrow(InvalidDateError);
        });

        it('should handle valid complete object input', () => {
            const result = TemporalUtils.from({ year: 2024, month: 1, day: 1 });
            expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            expect(result.year).toBe(2024);
            expect(result.month).toBe(1);
            expect(result.day).toBe(1);
        });

        it('should throw for object with overflow values', () => {
            expect(() => TemporalUtils.from({ year: 2024, month: 13, day: 1 }))
                .toThrow(InvalidDateError);
            expect(() => TemporalUtils.from({ year: 2024, month: 1, day: 32 }))
                .toThrow(InvalidDateError);
        });

        it('should throw for object with negative values', () => {
            expect(() => TemporalUtils.from({ year: 2024, month: -1, day: 1 }))
                .toThrow(InvalidDateError);
            expect(() => TemporalUtils.from({ year: 2024, month: 1, day: -1 }))
                .toThrow(InvalidDateError);
        });
    });

    describe('Firebase timestamp edge cases', () => {
        it('should throw for corrupted Firebase timestamps with NaN', () => {
            const invalidTimestamp = { seconds: NaN, nanoseconds: 0 };
            expect(() => TemporalUtils.from(invalidTimestamp))
                .toThrow(InvalidDateError);
        });

        it('should throw for Firebase timestamps with invalid toDate method', () => {
            const corruptedTimestamp = {
                seconds: 1640995200,
                nanoseconds: 0,
                toDate: () => { throw new Error('Corrupted toDate'); }
            };
            expect(() => TemporalUtils.from(corruptedTimestamp))
                .toThrow(InvalidDateError);
        });

        it('should throw for Firebase-like objects with invalid values', () => {
            const invalidTimestamp = { seconds: Infinity, nanoseconds: 0 };
            expect(() => TemporalUtils.from(invalidTimestamp))
                .toThrow(InvalidDateError);
        });

        it('should handle valid Firebase-like timestamp objects', () => {
            const validTimestamp = { seconds: 1640995200, nanoseconds: 0 };
            const result = TemporalUtils.from(validTimestamp);
            // 1640995200 seconds = January 1, 2022 00:00:00 UTC
            expect(result.year).toBe(2022);
        });
    });

    describe('String parsing edge cases', () => {
        it('should throw for completely invalid date strings', () => {
            expect(() => TemporalUtils.from('not-a-date'))
                .toThrow(InvalidDateError);
        });

        it('should throw for malformed ISO strings', () => {
            expect(() => TemporalUtils.from('2024-13-45T25:70:80Z'))
                .toThrow(InvalidDateError);
        });

        it('should handle strings with explicit offset when no timezone provided', () => {
            const result = TemporalUtils.from('2024-01-01T12:00:00+05:30');
            expect(result.year).toBe(2024);
            expect(result.timeZoneId).toBe('+05:30');
        });

        it('should handle plain datetime strings without timezone info', () => {
            const result = TemporalUtils.from('2024-01-01T12:00:00', 'America/New_York');
            expect(result.year).toBe(2024);
            expect(result.timeZoneId).toBe('America/New_York');
        });
    });

    describe('Unsupported input types', () => {
        it('should throw for boolean input', () => {
            expect(() => TemporalUtils.from(true as any))
                .toThrow(InvalidDateError);
        });

        it('should throw for function input', () => {
            expect(() => TemporalUtils.from((() => {}) as any))
                .toThrow(InvalidDateError);
        });

        it('should throw for symbol input', () => {
            expect(() => TemporalUtils.from(Symbol('test') as any))
                .toThrow(InvalidDateError);
        });
    });

    describe('Temporal type handling', () => {
        it('should handle Temporal.PlainDateTime with timezone conversion', () => {
            const pdt = new Temporal.PlainDateTime(2024, 7, 15, 10, 30);
            const result = TemporalUtils.from(pdt, 'America/New_York');
            expect(result.timeZoneId).toBe('America/New_York');
            expect(result.year).toBe(2024);
        });

        it('should handle ZonedDateTime with timezone conversion', () => {
            const zdt = new Temporal.ZonedDateTime(
                Temporal.Instant.from('2024-01-01T00:00:00Z').epochNanoseconds,
                'UTC'
            );
            const result = TemporalUtils.from(zdt, 'America/New_York');
            expect(result.timeZoneId).toBe('America/New_York');
        });

        it('should handle ZonedDateTime without timezone conversion', () => {
            const zdt = new Temporal.ZonedDateTime(
                Temporal.Instant.from('2024-01-01T00:00:00Z').epochNanoseconds,
                'UTC'
            );
            const result = TemporalUtils.from(zdt);
            expect(result.timeZoneId).toBe('UTC');
            expect(result).toBe(zdt); // Should return the same instance
        });
    });

    describe('Default values and null handling', () => {
        it('should handle undefined input by returning current time', () => {
            const result = TemporalUtils.from(undefined);
            expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            expect(result.timeZoneId).toBe(TemporalUtils.defaultTimeZone);
        });

        it('should handle null input by returning current time', () => {
            const result = TemporalUtils.from(null);
            expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            expect(result.timeZoneId).toBe(TemporalUtils.defaultTimeZone);
        });

        it('should use custom timezone for null/undefined input', () => {
            const result = TemporalUtils.from(null, 'America/New_York');
            expect(result.timeZoneId).toBe('America/New_York');
        });
    });

    describe('Date object handling', () => {
        it('should handle valid JavaScript Date objects', () => {
            const validDate = new Date('2024-01-01');
            const result = TemporalUtils.from(validDate);
            expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
        });

        it('should throw InvalidDateError for invalid JavaScript Date objects', () => {
            const invalidDate = new Date('invalid-date');
            // The new parsing system wraps RangeError in InvalidDateError for consistency
            expect(() => TemporalUtils.from(invalidDate))
                .toThrow(InvalidDateError);
        });
    });
});