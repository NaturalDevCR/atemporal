import atemporal from '../index';
import { Temporal } from '@js-temporal/polyfill';

describe('Atemporal: Final Coverage Tests', () => {

    // Section 1: Testing invalid instance behavior
    describe('Behavior with Invalid Instances', () => {
        const invalidDate = atemporal('invalid date');

        it('should return NaN for all getters on an invalid instance', () => {
            expect(invalidDate.year).toBe(NaN);
            expect(invalidDate.month).toBe(NaN);
            expect(invalidDate.day).toBe(NaN);
            expect(invalidDate.hour).toBe(NaN);
            expect(invalidDate.minute).toBe(NaN);
            expect(invalidDate.second).toBe(NaN);
            expect(invalidDate.millisecond).toBe(NaN);
            expect(invalidDate.quarter).toBe(NaN);
            expect(invalidDate.weekOfYear).toBe(NaN);
        });

        it('should return false for all comparison methods on an invalid instance', () => {
            const validDate = atemporal();
            expect(invalidDate.isBefore(validDate)).toBe(false);
            expect(invalidDate.isAfter(validDate)).toBe(false);
            expect(invalidDate.isSame(validDate)).toBe(false);
            expect(invalidDate.isSameDay(validDate)).toBe(false);
            expect(invalidDate.isBetween(validDate, validDate)).toBe(false);
            expect(invalidDate.isLeapYear()).toBe(false);
        });

        it('should return NaN for diff on an invalid instance', () => {
            expect(invalidDate.diff(atemporal())).toBe(NaN);
        });
    });

    // Section 2: Testing specific parsing paths in TemporalUtils
    describe('Specific Parsing Paths', () => {
        it('should correctly parse a Temporal.PlainDateTime object', () => {
            const pdt = new Temporal.PlainDateTime(2025, 7, 26, 10, 30);
            const date = atemporal(pdt, 'America/New_York');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2025-07-26 10:30');
            expect(date.raw.timeZoneId).toBe('America/New_York');
        });

        it('should correctly parse an ISO string with an offset and apply a different timezone', () => {
            // This string has a +02:00 offset
            const date = atemporal('2024-10-27T10:00:00+02:00', 'America/Los_Angeles');
            // The instant is 8:00 UTC. In LA (UTC-7 in Oct), it should be 1:00 AM.
            expect(date.format('YYYY-MM-DD HH:mm Z')).toBe('2024-10-27 01:00 -07:00');
        });
    });

    // Section 3: Testing edge cases and uncovered branches
    describe('Edge Cases and Branches', () => {
        it('should hit the format cache on second call', () => {
            // This test is primarily for coverage of the WeakMap cache logic.
            const date = atemporal();
            const format1 = date.format('YYYY-MM-DD');
            const format2 = date.format('YYYY-MM-DD');
            expect(format1).toBe(format2);
        });

        it('should cover all inclusivity branches of isBetween', () => {
            const start = atemporal('2024-01-15');
            const end = atemporal('2024-01-20');
            const date = atemporal('2024-01-15');

            expect(date.isBetween(start, end, '()')).toBe(false);
            expect(date.isBetween(start, end, '(]')).toBe(false);
            expect(date.isBetween(start, end, '[)')).toBe(true);
            expect(date.isBetween(start, end, '[]')).toBe(true);
        });

        it('should cover isSame for year and month', () => {
            const date = atemporal('2024-05-15');
            const sameYear = atemporal('2024-01-01');
            const sameMonth = atemporal('2024-05-30');
            const differentYear = atemporal('2025-05-15');

            expect(date.isSame(sameYear, 'year')).toBe(true);
            expect(date.isSame(differentYear, 'year')).toBe(false);
            expect(date.isSame(sameMonth, 'month')).toBe(true);
            expect(date.isSame(sameYear, 'month')).toBe(false);
        });
    });
});