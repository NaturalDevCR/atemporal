import { TemporalWrapper } from '../TemporalWrapper';
import atemporal from '../index';

/**
 * Consolidated TemporalWrapper Test Suite
 * 
 * This file consolidates tests from:
 * - TemporalWrapper.coverage.test.ts
 * - TemporalWrapper.additional-coverage.test.ts
 * 
 * Provides comprehensive coverage for TemporalWrapper edge cases and functionality
 */
describe('TemporalWrapper: Consolidated Coverage Tests', () => {
    describe('Instance Creation and Validation', () => {
        it('should create valid TemporalWrapper instances', () => {
            const date = atemporal('2024-01-01');
            expect(date).toBeInstanceOf(TemporalWrapper);
            expect(date.isValid()).toBe(true);
            expect(date.format('YYYY-MM-DD')).toBe('2024-01-01');
        });

        it('should handle invalid date inputs', () => {
            const invalidDate = atemporal('invalid-date');
            expect(invalidDate.isValid()).toBe(false);
            
            const invalidFromMethod = TemporalWrapper.from('not-a-date');
            expect(invalidFromMethod.isValid()).toBe(false);
            
            const invalidGarbage = TemporalWrapper.from('garbage');
            expect(invalidGarbage.isValid()).toBe(false);
        });

        it('should create instances from various input types', () => {
            // String input
            const fromString = atemporal('2024-01-15T10:30:00Z');
            expect(fromString.isValid()).toBe(true);
            
            // Date object input
            const fromDate = atemporal(new Date('2024-01-15'));
            expect(fromDate.isValid()).toBe(true);
            
            // Array input
            const fromArray = atemporal([2024, 1, 15]);
            expect(fromArray.isValid()).toBe(true);
        });
    });

    describe('Basic Operations and Manipulation', () => {
        it('should perform basic date arithmetic', () => {
            const date = atemporal('2024-01-01');
            const nextDay = date.add(1, 'day');
            expect(nextDay.format('YYYY-MM-DD')).toBe('2024-01-02');
            
            const prevWeek = date.subtract(1, 'week');
            expect(prevWeek.format('YYYY-MM-DD')).toBe('2023-12-25');
        });

        it('should handle set operations', () => {
            const date = atemporal('2024-01-15T10:30:00Z');
            const newYear = date.set('year', 2025);
            expect(newYear.year).toBe(2025);
            expect(newYear.month).toBe(1); // Should preserve other values
        });

        it('should handle startOf and endOf operations', () => {
            const date = atemporal('2024-01-15T10:30:45.500Z');
            
            const startOfDay = date.startOf('day');
            expect(startOfDay.format('HH:mm:ss.SSS')).toBe('00:00:00.000');
            
            const endOfMonth = date.endOf('month');
            expect(endOfMonth.format('DD')).toBe('31'); // January has 31 days
        });
    });

    describe('Day of Week Operations', () => {
        it('should handle valid dayOfWeek changes', () => {
            const date = atemporal('2024-01-15'); // Monday
            
            // Valid day changes
            const wednesday = date.dayOfWeek(3);
            expect(wednesday.format('YYYY-MM-DD')).toBe('2024-01-17');
            
            const sunday = date.dayOfWeek(7);
            expect(sunday.format('YYYY-MM-DD')).toBe('2024-01-21');
        });

        it('should handle invalid dayOfWeek ranges (lines 371-372)', () => {
            const date = atemporal('2024-01-15');
            
            // Test boundary values that should return same instance
            expect(date.dayOfWeek(0)).toBe(date); // Invalid: 0
            expect(date.dayOfWeek(8)).toBe(date); // Invalid: 8
            expect(date.dayOfWeek(-1)).toBe(date); // Invalid: negative
            expect(date.dayOfWeek(10)).toBe(date); // Invalid: > 7
        });

        it('should handle dayOfWeekName getter (lines 457-458)', () => {
            const validDate = atemporal('2024-01-15'); // Monday
            expect(validDate.dayOfWeekName).toBe('Monday');
            
            // Test with invalid date
            const invalidDate = TemporalWrapper.from('not-a-date');
            expect(invalidDate.isValid()).toBe(false);
            expect(invalidDate.dayOfWeekName).toBe('Invalid Date');
        });
    });

    describe('Invalid Date Edge Cases', () => {
        let invalidDate: TemporalWrapper;
        
        beforeEach(() => {
            invalidDate = TemporalWrapper.from('invalid');
        });

        it('should handle startOf with invalid date (line 406)', () => {
            expect(invalidDate.isValid()).toBe(false);
            
            const result = invalidDate.startOf('day');
            expect(result.isValid()).toBe(false);
            expect(result).toBe(invalidDate); // Should return same instance
        });

        it('should handle endOf with invalid date', () => {
            const result = invalidDate.endOf('month');
            expect(result.isValid()).toBe(false);
            expect(result).toBe(invalidDate);
        });

        it('should handle manipulation methods with invalid dates', () => {
            expect(invalidDate.add(1, 'day')).toBe(invalidDate);
            expect(invalidDate.subtract(1, 'hour')).toBe(invalidDate);
            expect(invalidDate.set('year', 2025)).toBe(invalidDate);
            expect(invalidDate.dayOfWeek(3)).toBe(invalidDate);
        });
    });

    describe('Formatting Edge Cases', () => {
        it('should handle complex format options (line 588)', () => {
            const date = atemporal('2024-01-15T10:30:00Z');
            
            // Test with complex Intl.DateTimeFormatOptions
            const complexOptions: Intl.DateTimeFormatOptions = {
                era: 'long',
                year: '2-digit',
                month: 'narrow',
                day: '2-digit',
                hour12: false,
                timeZoneName: 'longOffset'
            };
            
            const result = date.format(complexOptions);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle format with different locales', () => {
            const date = atemporal('2024-01-15T10:30:00Z');
            
            const enFormat = date.format('dddd, MMMM D, YYYY', 'en-US');
            expect(enFormat).toContain('Monday');
            expect(enFormat).toContain('January');
            
            const esFormat = date.format('dddd, MMMM D, YYYY', 'es-ES');
            expect(typeof esFormat).toBe('string');
        });

        it('should handle format with invalid dates', () => {
            const invalidDate = TemporalWrapper.from('invalid');
            expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
            expect(invalidDate.format()).toBe('Invalid Date');
        });
    });

    describe('Range Method Edge Cases', () => {
        it('should handle small time ranges (lines 898-901)', () => {
            const startDate = atemporal('2024-01-01T00:00:00Z');
            const endDate = atemporal('2024-01-01T00:00:02Z'); // 2 seconds later
            
            // Test with millisecond unit and exclusive inclusivity
            const rangeMs = startDate.range(endDate, 'millisecond', { 
                inclusivity: '()' 
            });
            expect(Array.isArray(rangeMs)).toBe(true);
            expect(rangeMs.length).toBeLessThan(2000); // Should be manageable
            expect(rangeMs.length).toBeGreaterThan(0);
        });

        it('should handle larger time ranges with seconds', () => {
            const startDate = atemporal('2024-01-01T00:00:00Z');
            const endDate = atemporal('2024-01-02T00:00:00Z'); // 1 day later
            
            const rangeSeconds = startDate.range(endDate, 'second', {
                inclusivity: '[]'
            });
            expect(Array.isArray(rangeSeconds)).toBe(true);
            expect(rangeSeconds.length).toBe(86401); // 24 hours * 3600 seconds + 1
        });

        it('should handle range with invalid dates', () => {
            const validDate = atemporal('2024-01-01T00:00:00Z');
            const invalidDate = TemporalWrapper.from('invalid');
            
            // Invalid start date
            const invalidRange1 = invalidDate.range(validDate, 'day');
            expect(invalidRange1).toEqual([]);
            
            // Invalid end date
            const invalidRange2 = validDate.range(invalidDate, 'day');
            expect(invalidRange2).toEqual([]);
        });

        it('should handle reversed ranges', () => {
            const startDate = atemporal('2024-01-02T00:00:00Z');
            const endDate = atemporal('2024-01-01T00:00:00Z'); // Earlier date
            
            // Range where start is after end should return empty array
            const reverseRange = startDate.range(endDate, 'second');
            expect(reverseRange).toEqual([]);
        });

        it('should handle range with format option', () => {
            const startDate = atemporal('2024-01-01T00:00:00Z');
            const endDate = atemporal('2024-01-01T00:00:02Z');
            
            const formattedRange = startDate.range(endDate, 'second', {
                inclusivity: '[]',
                format: 'HH:mm:ss'
            });
            
            expect(Array.isArray(formattedRange)).toBe(true);
            expect(formattedRange.length).toBe(3); // 0, 1, 2 seconds
            expect(typeof formattedRange[0]).toBe('string');
            expect(formattedRange[0]).toBe('00:00:00');
            expect(formattedRange[1]).toBe('00:00:01');
            expect(formattedRange[2]).toBe('00:00:02');
        });

        it('should handle different inclusivity options', () => {
            const start = atemporal('2024-01-01T00:00:00Z');
            const end = atemporal('2024-01-01T00:00:03Z');
            
            // Inclusive both ends
            const inclusive = start.range(end, 'second', { inclusivity: '[]' });
            expect(inclusive.length).toBe(4); // 0, 1, 2, 3
            
            // Exclusive both ends
            const exclusive = start.range(end, 'second', { inclusivity: '()' });
            expect(exclusive.length).toBe(2); // 1, 2
            
            // Start inclusive, end exclusive
            const startInc = start.range(end, 'second', { inclusivity: '[)' });
            expect(startInc.length).toBe(3); // 0, 1, 2
            
            // Start exclusive, end inclusive
            const endInc = start.range(end, 'second', { inclusivity: '(]' });
            expect(endInc.length).toBe(3); // 1, 2, 3
        });
    });

    describe('Getter Properties Edge Cases', () => {
        it('should handle all getter properties with valid dates', () => {
            const date = atemporal('2024-07-15T14:30:45.123Z');
            
            expect(typeof date.year).toBe('number');
            expect(typeof date.month).toBe('number');
            expect(typeof date.day).toBe('number');
            expect(typeof date.hour).toBe('number');
            expect(typeof date.minute).toBe('number');
            expect(typeof date.second).toBe('number');
            expect(typeof date.millisecond).toBe('number');
            expect(typeof date.weekOfYear).toBe('number');
            expect(typeof date.daysInMonth).toBe('number');
            expect(typeof date.dayOfWeekName).toBe('string');
        });

        it('should handle getter properties with invalid dates', () => {
            const invalidDate = TemporalWrapper.from('invalid');
            
            expect(invalidDate.year).toBeNaN();
            expect(invalidDate.month).toBeNaN();
            expect(invalidDate.day).toBeNaN();
            expect(invalidDate.hour).toBeNaN();
            expect(invalidDate.minute).toBeNaN();
            expect(invalidDate.second).toBeNaN();
            expect(invalidDate.millisecond).toBeNaN();
            expect(invalidDate.weekOfYear).toBeNaN();
            expect(invalidDate.daysInMonth).toBeNaN();
            expect(invalidDate.dayOfWeekName).toBe('Invalid Date');
        });
    });

    describe('Timezone Operations', () => {
        it('should handle timezone changes', () => {
            const utcDate = atemporal('2024-01-15T12:00:00Z');
            const nyDate = utcDate.timeZone('America/New_York');
            
            expect(nyDate.raw.timeZoneId).toBe('America/New_York');
            expect(nyDate.hour).toBe(7); // UTC-5 in January
        });

        it('should handle timezone operations with invalid dates', () => {
            const invalidDate = TemporalWrapper.from('invalid');
            const result = invalidDate.timeZone('America/New_York');
            
            expect(result).toBe(invalidDate);
            expect(result.isValid()).toBe(false);
        });
    });

    describe('Comparison Methods', () => {
        it('should handle comparison methods with valid dates', () => {
            const date1 = atemporal('2024-01-15T12:00:00Z');
            const date2 = atemporal('2024-01-16T12:00:00Z');
            
            expect(date1.isBefore(date2)).toBe(true);
            expect(date2.isAfter(date1)).toBe(true);
            expect(date1.isSame(date1)).toBe(true);
        });

        it('should handle comparison methods with invalid dates', () => {
            const validDate = atemporal('2024-01-15T12:00:00Z');
            const invalidDate = TemporalWrapper.from('invalid');
            
            expect(invalidDate.isBefore(validDate)).toBe(false);
            expect(invalidDate.isAfter(validDate)).toBe(false);
            expect(invalidDate.isSame(validDate)).toBe(false);
            expect(invalidDate.isBetween(validDate, validDate)).toBe(false);
        });
    });

    describe('Utility Methods', () => {
        it('should handle diff calculations', () => {
            const date1 = atemporal('2024-01-15T12:00:00Z');
            const date2 = atemporal('2024-01-16T12:00:00Z');
            
            expect(date2.diff(date1, 'day')).toBe(1);
            expect(date2.diff(date1, 'hour')).toBe(24);
        });

        it('should handle diff with invalid dates', () => {
            const validDate = atemporal('2024-01-15T12:00:00Z');
            const invalidDate = TemporalWrapper.from('invalid');
            
            expect(invalidDate.diff(validDate)).toBeNaN();
            expect(validDate.diff(invalidDate)).toBeNaN();
        });

        it('should handle clone operations', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            const cloned = date.clone();
            
            expect(cloned).not.toBe(date);
            expect(cloned.toString()).toBe(date.toString());
            
            // Invalid date clone
            const invalidDate = TemporalWrapper.from('invalid');
            expect(invalidDate.clone()).toBe(invalidDate);
        });
    });
});