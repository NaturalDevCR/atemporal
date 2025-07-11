import atemporal from '../index';
import { Temporal } from '@js-temporal/polyfill';

describe('Atemporal: Edge Cases, Error Handling, and Branch Coverage', () => {

    // --- Section 1: Factory and Parsing Edge Cases ---
    describe('Factory and Parsing', () => {
        it('should handle being passed an existing atemporal instance', () => {
            const original = atemporal('2024-01-01T12:00:00Z');

            // Test cloning path (no timezone provided)
            const cloned = atemporal(original);
            expect(cloned.toString()).toBe(original.toString());
            expect(cloned).not.toBe(original); // Should be a new instance

            // Test timezone change path
            const changedTz = atemporal(original, 'Asia/Tokyo');
            expect(changedTz.raw.timeZoneId).toBe('Asia/Tokyo');
        });

        it('should return an invalid instance for unsupported input types', () => {
            // @ts-expect-error - We are intentionally passing an invalid type
            expect(atemporal(true).isValid()).toBe(false);
            // @ts-expect-error
            expect(atemporal({ a: 1 }).isValid()).toBe(false);
        });

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

    // --- Section 2: Operations on Invalid Instances ---
    describe('Operations on Invalid Instances', () => {
        const invalidDate = atemporal('this is not a date');

        it('should return false for all boolean-returning methods', () => {
            const validDate = atemporal();
            expect(invalidDate.isBefore(validDate)).toBe(false);
            expect(invalidDate.isAfter(validDate)).toBe(false);
            expect(invalidDate.isSame(validDate)).toBe(false);
            expect(invalidDate.isSameOrBefore(validDate)).toBe(false);
            expect(invalidDate.isSameOrAfter(validDate)).toBe(false);
            expect(invalidDate.isBetween(validDate, validDate)).toBe(false);
            expect(invalidDate.isSameDay(validDate)).toBe(false);
            expect(invalidDate.isLeapYear()).toBe(false);
        });

        it('should return NaN for all number-returning methods', () => {
            expect(invalidDate.diff(new Date())).toBeNaN();
            expect(invalidDate.get('year')).toBeNaN();
            expect(invalidDate.year).toBeNaN();
            expect(invalidDate.month).toBeNaN();
            expect(invalidDate.day).toBeNaN();
            expect(invalidDate.hour).toBeNaN();
            expect(invalidDate.minute).toBeNaN();
            expect(invalidDate.second).toBeNaN();
            expect(invalidDate.millisecond).toBeNaN();
            expect(invalidDate.quarter()).toBeNaN();
            expect(invalidDate.weekOfYear).toBeNaN();
            expect(invalidDate.daysInMonth).toBeNaN();
        });

        it('should return "Invalid Date" for all string-returning methods', () => {
            expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
            expect(invalidDate.toString()).toBe('Invalid Date');
            expect(invalidDate.dayOfWeekName).toBe('Invalid Date');
        });

        it('should return an invalid Date object for .toDate()', () => {
            const date = invalidDate.toDate();
            expect(date.getTime()).toBeNaN();
        });

        it('should return the same invalid instance for manipulation methods', () => {
            expect(invalidDate.add(1, 'day')).toBe(invalidDate);
            expect(invalidDate.subtract(1, 'hour')).toBe(invalidDate);
            expect(invalidDate.set('year', 2025)).toBe(invalidDate);
            expect(invalidDate.startOf('day')).toBe(invalidDate);
            expect(invalidDate.endOf('month')).toBe(invalidDate);
            expect(invalidDate.timeZone('America/New_York')).toBe(invalidDate);
            expect(invalidDate.clone()).toBe(invalidDate);
            expect(invalidDate.dayOfWeek(3)).toBe(invalidDate);
        });

        it('should throw an error when accessing .raw or .datetime', () => {
            expect(() => invalidDate.raw).toThrow('Cannot perform operations on an invalid Atemporal object.');
            expect(() => invalidDate.datetime).toThrow('Cannot perform operations on an invalid Atemporal object.');
        });
    });

    // --- Section 3: Operations with Invalid Inputs (triggers catch blocks) ---
    describe('Operations with Invalid Inputs', () => {
        const validDate = atemporal('2024-01-15');
        const invalidInput = 'not a valid date';

        it('should return false for comparison methods when the other date is invalid', () => {
            expect(validDate.isBefore(invalidInput)).toBe(false);
            expect(validDate.isAfter(invalidInput)).toBe(false);
            expect(validDate.isSame(invalidInput)).toBe(false);
            expect(validDate.isSameOrBefore(invalidInput)).toBe(false);
            expect(validDate.isSameOrAfter(invalidInput)).toBe(false);
            expect(validDate.isBetween(invalidInput, '2025-01-01')).toBe(false);
            expect(validDate.isBetween('2023-01-01', invalidInput)).toBe(false);
            expect(validDate.isSameDay(invalidInput)).toBe(false);
        });

        it('should return NaN for .diff() when the other date is invalid', () => {
            expect(validDate.diff(invalidInput)).toBeNaN();
        });
    });

    // --- Section 4: Specific Method Branch Coverage ---
    describe('Method Branch Coverage', () => {
        const date = atemporal('2024-03-15T10:30:45.500Z');

        it('should format correctly with single-digit tokens', () => {
            const d = atemporal('2024-07-09T05:06:07Z');
            expect(d.format('M/D/YY H:m:s')).toBe('7/9/24 5:6:7');
        });

        it('should handle literal brackets in format string', () => {
            expect(date.format('[The year is] YYYY')).toBe('The year is 2024');
        });

        it('should handle format with only Intl options and no locale', () => {
            const d = atemporal('2024-01-05T12:00:00Z');
            const formatted = d.format({ year: '2-digit', month: 'numeric', day: 'numeric' });
            expect(formatted).toBe('1/5/24'); // Based on default 'en-US' locale
        });

        it('should hit the format cache on second call', () => {
            const d = atemporal();
            const format1 = d.format('YYYY-MM-DD');
            const format2 = d.format('YYYY-MM-DD');
            expect(format1).toBe(format2);
        });

        it('should cover all startOf and endOf units', () => {
            expect(date.startOf('year').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-01-01 00:00:00.000');
            expect(date.endOf('year').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-12-31 23:59:59.999');
            expect(date.startOf('week').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-11 00:00:00.000');
            expect(date.endOf('week').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-17 23:59:59.999');
        });

        it('should cover all inclusivity branches for isBetween()', () => {
            const start = atemporal('2024-01-15');
            const end = atemporal('2024-01-20');
            const dateOnBoundary = atemporal('2024-01-15');

            expect(dateOnBoundary.isBetween(start, end, '()')).toBe(false);
            expect(dateOnBoundary.isBetween(start, end, '(]')).toBe(false);
            expect(dateOnBoundary.isBetween(start, end, '[)')).toBe(true);
            expect(dateOnBoundary.isBetween(start, end, '[]')).toBe(true);
        });

        it('should cover all branches for isSame()', () => {
            const d = atemporal('2024-05-15T12:00:00Z');
            const sameYear = atemporal('2024-01-01');
            const sameMonth = atemporal('2024-05-30');
            const sameDay = atemporal('2024-05-15T20:00:00Z');
            const sameInstant = atemporal('2024-05-15T12:00:00Z');
            const different = atemporal('2025-01-01');

            expect(d.isSame(sameYear, 'year')).toBe(true);
            expect(d.isSame(different, 'year')).toBe(false);
            expect(d.isSame(sameMonth, 'month')).toBe(true);
            expect(d.isSame(sameYear, 'month')).toBe(false);
            expect(d.isSame(sameDay, 'day')).toBe(true);
            expect(d.isSame(different, 'day')).toBe(false);
            expect(d.isSame(sameInstant)).toBe(true); // Default case (millisecond)
            expect(d.isSame(sameDay)).toBe(false); // Default case (millisecond)
        });

        it('should cover the UTC path in toString()', () => {
            const utcDate = atemporal('2024-01-15T12:30:00Z', 'UTC');
            expect(utcDate.toString()).toBe('2024-01-15T12:30:00Z');
            const utcDateWithMs = atemporal('2024-01-15T12:30:00.500Z', 'UTC');
            expect(utcDateWithMs.toString()).toBe('2024-01-15T12:30:00.500Z');
        });

        it('should return the same instance for invalid dayOfWeek() input', () => {
            const originalDate = atemporal();
            expect(originalDate.dayOfWeek(0)).toBe(originalDate);
            expect(originalDate.dayOfWeek(8)).toBe(originalDate);
        });
    });
});