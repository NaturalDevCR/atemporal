/**
 * Behavioral Baseline Test Suite
 * 
 * This test suite captures the current behavior of TemporalUtils.ts and TemporalWrapper.ts
 * to ensure zero regression during refactoring. It covers edge cases, timezone handling,
 * formatting, immutability, and performance characteristics.
 */

import { TemporalUtils } from '../TemporalUtils';
import { TemporalWrapper } from '../TemporalWrapper';
import { Temporal } from '@js-temporal/polyfill';

describe('Behavioral Baseline Tests', () => {
    
    describe('TemporalUtils Core Behavior', () => {
        
        describe('Input Parsing Edge Cases', () => {
            it('should handle undefined input consistently', () => {
                const result = TemporalUtils.from(undefined);
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.timeZoneId).toBe(TemporalUtils.defaultTimeZone);
            });
            
            it('should handle null input by treating as undefined', () => {
                const result = TemporalUtils.from(null);
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            });
            
            it('should handle Firebase timestamp objects', () => {
                const timestamp = { seconds: 1672531200, nanoseconds: 500000000 };
                const result = TemporalUtils.from(timestamp);
                // Check that the timestamp was parsed correctly by comparing the instant
                const expectedMillis = 1672531200 * 1000 + 500; // seconds to millis + nanos to millis
                expect(result.epochMilliseconds).toBe(expectedMillis);
                // Also verify the nanosecond precision is preserved
                const expectedNanos = BigInt(1672531200) * 1_000_000_000n + BigInt(500000000);
                expect(result.epochNanoseconds).toBe(expectedNanos);
            });
            
            it('should handle array input [year, month, day]', () => {
                const result = TemporalUtils.from([2024, 1, 15]);
                expect(result.year).toBe(2024);
                expect(result.month).toBe(1);
                expect(result.day).toBe(15);
            });
            
            it('should handle array input with time components', () => {
                const result = TemporalUtils.from([2024, 1, 15, 10, 30, 45, 500]);
                expect(result.year).toBe(2024);
                expect(result.hour).toBe(10);
                expect(result.minute).toBe(30);
                expect(result.second).toBe(45);
                expect(result.millisecond).toBe(500);
            });
            
            it('should handle plain object input', () => {
                const obj = { year: 2024, month: 1, day: 15, hour: 10, minute: 30 };
                const result = TemporalUtils.from(obj);
                expect(result.year).toBe(2024);
                expect(result.month).toBe(1);
                expect(result.day).toBe(15);
                expect(result.hour).toBe(10);
                expect(result.minute).toBe(30);
            });
            
            it('should handle Temporal.PlainDateTime with timezone conversion', () => {
                const pdt = new Temporal.PlainDateTime(2024, 1, 15, 10, 30);
                const result = TemporalUtils.from(pdt, 'America/New_York');
                expect(result.timeZoneId).toBe('America/New_York');
                expect(result.year).toBe(2024);
            });
        });
        
        describe('Timezone Handling Edge Cases', () => {
            it('should handle DST transitions correctly', () => {
                // Spring forward in New York (2024-03-10 02:00 -> 03:00)
                const beforeDST = TemporalUtils.from('2024-03-10T01:30:00', 'America/New_York');
                const afterDST = TemporalUtils.from('2024-03-10T03:30:00', 'America/New_York');
                
                expect(beforeDST.offset).toBe('-05:00');
                expect(afterDST.offset).toBe('-04:00');
            });
            
            it('should handle fall back DST transition', () => {
                // Fall back in New York (2024-11-03 02:00 -> 01:00)
                const beforeFallBack = TemporalUtils.from('2024-11-03T01:30:00-04:00');
                const afterFallBack = TemporalUtils.from('2024-11-03T01:30:00-05:00');
                
                expect(beforeFallBack.offset).toBe('-04:00');
                expect(afterFallBack.offset).toBe('-05:00');
            });
            
            it('should handle UTC timezone consistently', () => {
                const utcDate = TemporalUtils.from('2024-01-15T10:30:00Z');
                expect(utcDate.timeZoneId).toBe('UTC');
                expect(utcDate.offset).toBe('+00:00');
            });
            
            it('should preserve timezone when cloning', () => {
                const original = TemporalUtils.from('2024-01-15T10:30:00', 'Asia/Tokyo');
                const cloned = TemporalUtils.from(original);
                expect(cloned.timeZoneId).toBe('Asia/Tokyo');
            });
        });
        
        describe('Comparison Method Behavior', () => {
            const base = TemporalUtils.from('2024-01-15T10:30:00Z');
            const earlier = TemporalUtils.from('2024-01-15T09:30:00Z');
            const later = TemporalUtils.from('2024-01-15T11:30:00Z');
            const same = TemporalUtils.from('2024-01-15T10:30:00Z');
            
            it('should handle isBefore correctly', () => {
                expect(TemporalUtils.isBefore(base, later)).toBe(true);
                expect(TemporalUtils.isBefore(base, earlier)).toBe(false);
                expect(TemporalUtils.isBefore(base, same)).toBe(false);
            });
            
            it('should handle isAfter correctly', () => {
                expect(TemporalUtils.isAfter(base, earlier)).toBe(true);
                expect(TemporalUtils.isAfter(base, later)).toBe(false);
                expect(TemporalUtils.isAfter(base, same)).toBe(false);
            });
            
            it('should handle isSameOrBefore correctly', () => {
                expect(TemporalUtils.isSameOrBefore(base, later)).toBe(true);
                expect(TemporalUtils.isSameOrBefore(base, same)).toBe(true);
                expect(TemporalUtils.isSameOrBefore(base, earlier)).toBe(false);
            });
            
            it('should handle isSameOrAfter correctly', () => {
                expect(TemporalUtils.isSameOrAfter(base, earlier)).toBe(true);
                expect(TemporalUtils.isSameOrAfter(base, same)).toBe(true);
                expect(TemporalUtils.isSameOrAfter(base, later)).toBe(false);
            });
            
            it('should handle isSameDay across timezones', () => {
                const utc = TemporalUtils.from('2024-01-15T23:30:00Z');
                const tokyo = TemporalUtils.from('2024-01-16T08:30:00+09:00');
                // These represent the same instant but different calendar days in their respective timezones
                expect(TemporalUtils.isSameDay(utc, tokyo)).toBe(false);
            });
        });
        
        describe('Diff Calculation Behavior', () => {
            it('should calculate millisecond differences accurately', () => {
                const start = TemporalUtils.from('2024-01-15T10:30:00.000Z');
                const end = TemporalUtils.from('2024-01-15T10:30:00.500Z');
                const diff = TemporalUtils.diff(end, start, 'millisecond');
                expect(diff).toBe(500);
            });
            
            it('should calculate day differences across DST', () => {
                const before = TemporalUtils.from('2024-03-09T12:00:00', 'America/New_York');
                const after = TemporalUtils.from('2024-03-11T12:00:00', 'America/New_York');
                const diff = TemporalUtils.diff(after, before, 'day');
                // DST transition affects the calculation, resulting in slightly less than 2 days
                expect(diff).toBeCloseTo(1.958, 2);
            });
            
            it('should handle negative differences', () => {
                const later = TemporalUtils.from('2024-01-16T10:30:00Z');
                const earlier = TemporalUtils.from('2024-01-15T10:30:00Z');
                const diff = TemporalUtils.diff(earlier, later, 'day');
                expect(diff).toBe(-1);
            });
            
            it('should handle fractional differences', () => {
                const start = TemporalUtils.from('2024-01-15T10:00:00Z');
                const end = TemporalUtils.from('2024-01-15T22:00:00Z');
                const diff = TemporalUtils.diff(end, start, 'day');
                expect(diff).toBe(0.5);
            });
        });
    });
    
    describe('TemporalWrapper Immutability Guarantees', () => {
        
        it('should never mutate original instance in add operations', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:00Z');
            const originalDatetime = original.datetime;
            const modified = original.add(1, 'day');
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.format('YYYY-MM-DD')).toBe('2024-01-15');
            expect(modified.format('YYYY-MM-DD')).toBe('2024-01-16');
        });
        
        it('should never mutate original instance in subtract operations', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:00Z');
            const originalDatetime = original.datetime;
            const modified = original.subtract(1, 'hour');
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.hour).toBe(10);
            expect(modified.hour).toBe(9);
        });
        
        it('should never mutate original instance in set operations', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:00Z');
            const originalDatetime = original.datetime;
            const modified = original.set('year', 2025);
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.year).toBe(2024);
            expect(modified.year).toBe(2025);
        });
        
        it('should never mutate original instance in startOf operations', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:45.500Z');
            const originalDatetime = original.datetime;
            const modified = original.startOf('day');
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.hour).toBe(10);
            expect(modified.hour).toBe(0);
        });
        
        it('should never mutate original instance in endOf operations', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:45.500Z');
            const originalDatetime = original.datetime;
            const modified = original.endOf('day');
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.hour).toBe(10);
            expect(modified.hour).toBe(23);
        });
        
        it('should never mutate original instance in timezone changes', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:00Z');
            const originalDatetime = original.datetime;
            const modified = original.timeZone('America/New_York');
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.timeZoneName).toContain('UTC');
            expect(modified.timeZoneName).toContain('America/New_York');
        });
        
        it('should never mutate original instance in dayOfWeek changes', () => {
            const original = TemporalWrapper.from('2024-01-15T10:30:00Z'); // Monday
            const originalDatetime = original.datetime;
            const modified = original.dayOfWeek(3); // Wednesday
            
            expect(original.datetime).toBe(originalDatetime);
            expect(modified.datetime).not.toBe(originalDatetime);
            expect(original.dayOfWeek()).toBe(1);
            expect(modified.dayOfWeek()).toBe(3);
        });
    });
    
    describe('Formatting Behavior Consistency', () => {
        
        it('should format Day.js tokens consistently', () => {
            const date = TemporalWrapper.from('2024-01-15T10:30:45.500Z');
            
            expect(date.format('YYYY')).toBe('2024');
            expect(date.format('MM')).toBe('01');
            expect(date.format('DD')).toBe('15');
            expect(date.format('HH')).toBe('10');
            expect(date.format('mm')).toBe('30');
            expect(date.format('ss')).toBe('45');
            expect(date.format('SSS')).toBe('500');
        });
        
        it('should handle complex format patterns', () => {
            const date = TemporalWrapper.from('2024-01-15T10:30:45.500Z');
            const formatted = date.format('YYYY-MM-DD HH:mm:ss.SSS');
            expect(formatted).toBe('2024-01-15 10:30:45.500');
        });
        
        it('should handle Intl.DateTimeFormatOptions', () => {
            const date = TemporalWrapper.from('2024-01-15T10:30:45.500Z');
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            };
            const formatted = date.format(options, 'en-US');
            expect(formatted).toContain('Monday');
            expect(formatted).toContain('January');
            expect(formatted).toContain('15');
            expect(formatted).toContain('2024');
        });
        
        it('should handle locale-specific formatting', () => {
            const date = TemporalWrapper.from('2024-01-15T10:30:45.500Z');
            const enFormat = date.format('MMMM', 'en-US');
            const esFormat = date.format('MMMM', 'es-ES');
            
            expect(enFormat).toBe('January');
            expect(esFormat).toBe('enero');
        });
        
        it('should handle invalid date formatting', () => {
            const invalidDate = TemporalWrapper.from('invalid-date');
            expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
            expect(invalidDate.toString()).toBe('Invalid Date');
        });
    });
    
    describe('Edge Cases and Error Handling', () => {
        
        it('should handle leap year edge cases', () => {
            const leapYear = TemporalWrapper.from('2024-02-29T10:30:00Z');
            const nonLeapYear = TemporalWrapper.from('2023-02-28T10:30:00Z');
            
            expect(leapYear.isLeapYear()).toBe(true);
            expect(nonLeapYear.isLeapYear()).toBe(false);
            
            // Adding a year to Feb 29 should handle gracefully
            const nextYear = leapYear.add(1, 'year');
            expect(nextYear.year).toBe(2025);
            expect(nextYear.month).toBe(2);
            expect(nextYear.day).toBe(28); // Should adjust to Feb 28
        });
        
        it('should handle month overflow correctly', () => {
            const jan31 = TemporalWrapper.from('2024-01-31T10:30:00Z');
            const nextMonth = jan31.add(1, 'month');
            
            expect(nextMonth.year).toBe(2024);
            expect(nextMonth.month).toBe(2);
            expect(nextMonth.day).toBe(29); // 2024 is leap year
        });
        
        it('should handle invalid dayOfWeek values', () => {
            const date = TemporalWrapper.from('2024-01-15T10:30:00Z');
            
            // Invalid values should return same instance
            expect(date.dayOfWeek(0)).toBe(date);
            expect(date.dayOfWeek(8)).toBe(date);
            expect(date.dayOfWeek(-1)).toBe(date);
        });
        
        it('should handle invalid quarter values', () => {
            const date = TemporalWrapper.from('2024-01-15T10:30:00Z');
            
            // Invalid values should return same instance
            expect(date.quarter(0)).toBe(date);
            expect(date.quarter(5)).toBe(date);
            expect(date.quarter(-1)).toBe(date);
        });
        
        it('should handle range with invalid dates', () => {
            const validDate = TemporalWrapper.from('2024-01-15T10:30:00Z');
            const invalidDate = TemporalWrapper.from('invalid-date');
            
            expect(invalidDate.range(validDate, 'day')).toEqual([]);
            expect(validDate.range(invalidDate, 'day')).toEqual([]);
        });
        
        it('should handle range with end before start', () => {
            const start = TemporalWrapper.from('2024-01-15T10:30:00Z');
            const end = TemporalWrapper.from('2024-01-14T10:30:00Z');
            
            expect(start.range(end, 'day')).toEqual([]);
        });
    });
    
    describe('Configuration and State Management', () => {
        
        it('should maintain default locale state', () => {
            const originalLocale = TemporalUtils.getDefaultLocale();
            
            TemporalUtils.setDefaultLocale('es-ES');
            expect(TemporalUtils.getDefaultLocale()).toBe('es-ES');
            
            // Restore original
            TemporalUtils.setDefaultLocale(originalLocale);
            expect(TemporalUtils.getDefaultLocale()).toBe(originalLocale);
        });
        
        it('should maintain default timezone state', () => {
            const originalTz = TemporalUtils.defaultTimeZone;
            
            TemporalUtils.setDefaultTimeZone('America/New_York');
            expect(TemporalUtils.defaultTimeZone).toBe('America/New_York');
            
            // Restore original
            TemporalUtils.setDefaultTimeZone(originalTz);
            expect(TemporalUtils.defaultTimeZone).toBe(originalTz);
        });
        
        it('should maintain week start configuration', () => {
            const originalWeekStart = TemporalUtils.getWeekStartsOn();
            
            TemporalUtils.setWeekStartsOn(0); // Sunday
            expect(TemporalUtils.getWeekStartsOn()).toBe(0);
            
            TemporalUtils.setWeekStartsOn(1); // Monday
            expect(TemporalUtils.getWeekStartsOn()).toBe(1);
            
            // Restore original
            TemporalUtils.setWeekStartsOn(originalWeekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6);
        });
    });
});