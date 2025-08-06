import { TemporalWrapper } from '../TemporalWrapper';
import atemporal from '../index';

describe('TemporalWrapper Additional Coverage Tests', () => {
    describe('Edge Cases for Remaining Lines', () => {
        it('should cover lines 371-372 - dayOfWeek with invalid day range', () => {
            // Test lines 371-372: dayOfWeek validation edge cases
            const date = atemporal('2024-01-15');
            
            // Test boundary values (avoid fractional values that cause RangeError)
            expect(date.dayOfWeek(0)).toBe(date); // Invalid: 0
            expect(date.dayOfWeek(8)).toBe(date); // Invalid: 8
            expect(date.dayOfWeek(-1)).toBe(date); // Invalid: negative
        });

        it('should cover line 406 - startOf method edge case', () => {
            // Test line 406: startOf with invalid date
            const invalidDate = TemporalWrapper.from('invalid');
            expect(invalidDate.isValid()).toBe(false);
            
            const result = invalidDate.startOf('day');
            expect(result.isValid()).toBe(false);
        });

        it('should cover lines 457-458 - dayOfWeekName with invalid date', () => {
            // Test lines 457-458: dayOfWeekName getter with invalid date
            const invalidDate = TemporalWrapper.from('not-a-date');
            expect(invalidDate.isValid()).toBe(false);
            expect(invalidDate.dayOfWeekName).toBe('Invalid Date');
        });

        it('should cover line 588 - format method with complex edge case', () => {
            // Test line 588: format method edge case
            const date = atemporal('2024-01-15T10:30:00Z');
            
            // Test with edge case format options
            const edgeCaseOptions: Intl.DateTimeFormatOptions = {
                era: 'long',
                year: '2-digit',
                month: 'narrow',
                day: '2-digit',
                hour12: false,
                timeZoneName: 'longOffset'
            };
            
            const result = date.format(edgeCaseOptions);
            expect(typeof result).toBe('string');
        });

        it('should cover lines 898-901 - range method complex edge cases', () => {
            // Test lines 898-901: range method edge cases
            const startDate = atemporal('2024-01-01T00:00:00Z');
            
            // Use a much smaller time range to avoid hanging (just 2 seconds)
            const endDate = atemporal('2024-01-01T00:00:02Z');
            
            // Test with millisecond unit and exclusive inclusivity (small range)
            const rangeMs = startDate.range(endDate, 'millisecond', { 
                inclusivity: '()' 
            });
            expect(Array.isArray(rangeMs)).toBe(true);
            expect(rangeMs.length).toBeLessThan(2000); // Should be manageable
            
            // Test with second unit instead of millisecond for larger range
            const endDateLarger = atemporal('2024-01-02T00:00:00Z');
            const rangeSeconds = startDate.range(endDateLarger, 'second', {
                inclusivity: '[]'
            });
            expect(Array.isArray(rangeSeconds)).toBe(true);
            expect(rangeSeconds.length).toBe(86401); // 24 hours * 3600 seconds + 1
            
            // Test with invalid date in range
            const invalidDate = TemporalWrapper.from('invalid');
            const invalidRange = invalidDate.range(endDate, 'day');
            expect(invalidRange).toEqual([]);
            
            // Test range where start is after end
            const reverseRange = endDate.range(startDate, 'second');
            expect(reverseRange).toEqual([]);
            
            // Test with format option
            const formattedRange = startDate.range(endDate, 'second', {
                inclusivity: '[]',
                format: 'HH:mm:ss'
            });
            expect(Array.isArray(formattedRange)).toBe(true);
            expect(typeof formattedRange[0]).toBe('string');
        });
    });
});