import atemporal from '../index';

describe('Atemporal: Final Coverage and Edge Case Tests', () => {

    // Section 1: Covering index.ts and TemporalUtils.ts parsing
    describe('Factory and Parsing Edge Cases', () => {
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
            // This test confirms the library's robust error handling.
            // It should create an invalid instance, not throw an error.
            // @ts-expect-error - We are intentionally passing an invalid type
            expect(atemporal(true).isValid()).toBe(false);
            // @ts-expect-error
            expect(atemporal({ a: 1 }).isValid()).toBe(false);
        });
    });

    // Section 2: Covering TemporalWrapper.ts branches
    describe('TemporalWrapper Method Branches', () => {
        const date = atemporal('2024-03-15T10:30:45.500Z');

        it('should format correctly with single-digit tokens', () => {
            const date = atemporal('2024-07-09T05:06:07Z');
            const format = date.format('M/D/YY H:m:s');
            expect(format).toBe('7/9/24 5:6:7');
        });

        it('should cover all startOf units', () => {
            expect(date.startOf('year').format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 00:00:00');
            expect(date.startOf('day').format('YYYY-MM-DD HH:mm:ss')).toBe('2024-03-15 00:00:00');
            expect(date.startOf('hour').format('YYYY-MM-DD HH:mm:ss')).toBe('2024-03-15 10:00:00');
            expect(date.startOf('minute').format('YYYY-MM-DD HH:mm:ss')).toBe('2024-03-15 10:30:00');
            expect(date.startOf('second').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-15 10:30:45.000');
        });

        it('should cover endOf for year and month', () => {
            expect(date.endOf('year').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-12-31 23:59:59.999');
            expect(date.endOf('month').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-31 23:59:59.999');
        });

        it('should handle cloning an invalid instance', () => {
            const invalid = atemporal('invalid');
            const clonedInvalid = invalid.clone();
            expect(clonedInvalid.isValid()).toBe(false);
            expect(clonedInvalid).toBe(invalid);
        });

        it('should handle literal strings in format()', () => {
            // This covers the `return match` part of the formatter's replace logic
            const formatted = date.format('[The time is] HH:mm');
            expect(formatted).toBe('The time is 10:30');
        });

        it('should handle Intl component options in format()', () => {
            // This covers the branch for Intl.format that doesn't use dateStyle/timeStyle
            const formatted = date.format({ month: 'long', day: 'numeric' }, 'en-US');
            expect(formatted).toContain('March 15');
        });
    });

    // Section 3: Covering error-handling catch blocks
    describe('Error Handling Catch Blocks', () => {
        const validDate = atemporal();
        const invalidInput = 'not a real date';

        it('should return false from comparison methods when the other date is invalid', () => {
            // These tests trigger the `catch` blocks inside the comparison methods
            expect(validDate.isBefore(invalidInput)).toBe(false);
            expect(validDate.isAfter(invalidInput)).toBe(false);
            expect(validDate.isSame(invalidInput)).toBe(false);
            expect(validDate.isSameDay(invalidInput)).toBe(false);
            expect(validDate.isBetween(invalidInput, validDate)).toBe(false);
            expect(validDate.isBetween(validDate, invalidInput)).toBe(false);
        });

        it('should return NaN from diff when the other date is invalid', () => {
            // This test triggers the `catch` block inside the diff method
            expect(validDate.diff(invalidInput)).toBe(NaN);
        });
    });
});