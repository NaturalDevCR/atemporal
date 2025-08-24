import atemporal from '../index';
import customParseFormat, { setCurrentDateFunction, resetCurrentDateFunction } from '../plugins/customParseFormat';
import { Temporal } from '@js-temporal/polyfill';

// Extend atemporal with customParseFormat plugin
atemporal.extend(customParseFormat);

/**
 * CustomParseFormat Plugin Branch Coverage Test Suite
 * 
 * This file specifically targets uncovered branch lines in customParseFormat.ts
 * to achieve >90% branch coverage by testing error paths, edge cases, and validation scenarios.
 */
describe('CustomParseFormat Plugin - Branch Coverage Improvements', () => {
    beforeEach(() => {
        // Clear caches and reset to default state
        (atemporal as any).clearFormatCache();
        resetCurrentDateFunction();
    });

    describe('validateDateParts Error Scenarios', () => {
        it('should handle month name validation failures (lines 137-138)', () => {
            // Test invalid month names that should trigger null return
            const invalidMonthResult1 = atemporal.fromFormat('InvalidMonth 15, 2024', 'MMMM DD, YYYY');
            expect(invalidMonthResult1.isValid()).toBe(false);
            
            const invalidMonthResult2 = atemporal.fromFormat('Xyz 15, 2024', 'MMM DD, YYYY');
            expect(invalidMonthResult2.isValid()).toBe(false);
            
            // Test empty month names
            const emptyMonthResult = atemporal.fromFormat(' 15, 2024', 'MMMM DD, YYYY');
            expect(emptyMonthResult.isValid()).toBe(false);
        });

        it('should handle day of year validation failures', () => {
            // Test invalid day of year values that should trigger null return
            const invalidDayOfYear1 = atemporal.fromFormat('2024-400', 'YYYY-DDD');
            expect(invalidDayOfYear1.isValid()).toBe(false);
            
            const invalidDayOfYear2 = atemporal.fromFormat('2024-0', 'YYYY-DDD');
            expect(invalidDayOfYear2.isValid()).toBe(false);
            
            // Test day of year 366 in non-leap year
            const nonLeapYear366 = atemporal.fromFormat('2023-366', 'YYYY-DDD');
            expect(nonLeapYear366.isValid()).toBe(false);
        });

        it('should handle AM/PM validation failures (line 329)', () => {
            // Test 12-hour format without AM/PM - should return null
            const noAmPmResult1 = atemporal.fromFormat('2024-01-01 03:30', 'YYYY-MM-DD hh:mm');
            expect(noAmPmResult1.isValid()).toBe(false);
            
            const noAmPmResult2 = atemporal.fromFormat('2024-01-01 11', 'YYYY-MM-DD h');
            expect(noAmPmResult2.isValid()).toBe(false);
        });

        it('should handle Temporal.PlainDate validation errors', () => {
            // Test dates that should fail Temporal validation (like Feb 30)
            const invalidDate1 = atemporal.fromFormat('2024-02-30', 'YYYY-MM-DD');
            expect(invalidDate1.isValid()).toBe(false);
            
            const invalidDate2 = atemporal.fromFormat('2024-13-01', 'YYYY-MM-DD');
            expect(invalidDate2.isValid()).toBe(false);
            
            const invalidDate3 = atemporal.fromFormat('2024-04-31', 'YYYY-MM-DD');
            expect(invalidDate3.isValid()).toBe(false);
        });
    });

    describe('parseToISO Branch Coverage', () => {
        it('should handle null returns from getMonthFromName (line 347)', () => {
            // Test MMMM path with invalid month name
            const result1 = atemporal.fromFormat('BadMonth 15, 2024', 'MMMM DD, YYYY');
            expect(result1.isValid()).toBe(false);
            
            // Test MMM path with invalid month name  
            const result2 = atemporal.fromFormat('Bad 15, 2024', 'MMM DD, YYYY');
            expect(result2.isValid()).toBe(false);
        });

        it('should handle null returns from getDayFromDayOfYear (line 369)', () => {
            // Test DDD path with invalid day of year
            const result1 = atemporal.fromFormat('2024-400', 'YYYY-DDD');
            expect(result1.isValid()).toBe(false);
            
            // Test DDDD path with invalid day of year
            const result2 = atemporal.fromFormat('2024-0000', 'YYYY-DDDD');
            expect(result2.isValid()).toBe(false);
        });

        it('should handle 12-hour format without AM/PM (lines 376-378)', () => {
            // Test hh format without AM/PM
            const result1 = atemporal.fromFormat('2024-01-01 03:30', 'YYYY-MM-DD hh:mm');
            expect(result1.isValid()).toBe(false);
            
            // Test h format without AM/PM
            const result2 = atemporal.fromFormat('2024-01-01 3:30', 'YYYY-MM-DD h:mm');
            expect(result2.isValid()).toBe(false);
        });
    });

    describe('Helper Function Error Scenarios', () => {
        it('should handle getMonthFromName with various invalid inputs', () => {
            // These should all return null and cause parsing to fail
            const invalidInputs = [
                'NotAMonth',
                '',
                '13',
                'Month13',
                'InvalidMonthName',
                'Foo',
                'Bar'
            ];
            
            invalidInputs.forEach(invalidMonth => {
                const result = atemporal.fromFormat(`${invalidMonth} 15, 2024`, 'MMMM DD, YYYY');
                expect(result.isValid()).toBe(false);
            });
        });

        it('should handle getDayFromDayOfYear edge cases (line 498-499)', () => {
            // Test boundary conditions that should trigger null returns
            const edgeCases = [
                { dayOfYear: 0, year: 2024 },
                { dayOfYear: 367, year: 2024 }, // Even in leap year
                { dayOfYear: 366, year: 2023 }, // Non-leap year
                { dayOfYear: -1, year: 2024 },
                { dayOfYear: 1000, year: 2024 }
            ];
            
            edgeCases.forEach(({ dayOfYear, year }) => {
                const dayStr = dayOfYear.toString().padStart(3, '0');
                const result = atemporal.fromFormat(`${year}-${dayStr}`, 'YYYY-DDD');
                expect(result.isValid()).toBe(false);
            });
        });

        it('should handle Temporal.PlainDate.from errors in getDayFromDayOfYear', () => {
            // Mock Temporal.PlainDate.from to throw an error
            const originalFrom = Temporal.PlainDate.from;
            const mockFrom = jest.fn().mockImplementation(() => {
                throw new Error('Temporal error');
            });
            Temporal.PlainDate.from = mockFrom;
            
            try {
                const result = atemporal.fromFormat('2024-100', 'YYYY-DDD');
                expect(result.isValid()).toBe(false);
            } finally {
                // Restore original
                Temporal.PlainDate.from = originalFrom;
            }
        });
    });

    describe('Edge Cases in Date Component Parsing', () => {
        it('should handle edge cases in hour validation', () => {
            // Test hour values at boundaries
            const result1 = atemporal.fromFormat('2024-01-01 24:00', 'YYYY-MM-DD HH:mm');
            expect(result1.isValid()).toBe(false);
            
            const result2 = atemporal.fromFormat('2024-01-01 -1:00', 'YYYY-MM-DD H:mm');
            expect(result2.isValid()).toBe(false);
        });

        it('should handle edge cases in minute validation', () => {
            // Test minute values at boundaries
            const result1 = atemporal.fromFormat('2024-01-01 12:60', 'YYYY-MM-DD HH:mm');
            expect(result1.isValid()).toBe(false);
            
            const result2 = atemporal.fromFormat('2024-01-01 12:-1', 'YYYY-MM-DD HH:m');
            expect(result2.isValid()).toBe(false);
        });

        it('should handle edge cases in second validation', () => {
            // Test second values at boundaries
            const result1 = atemporal.fromFormat('2024-01-01 12:30:60', 'YYYY-MM-DD HH:mm:ss');
            expect(result1.isValid()).toBe(false);
            
            const result2 = atemporal.fromFormat('2024-01-01 12:30:-1', 'YYYY-MM-DD HH:mm:s');
            expect(result2.isValid()).toBe(false);
        });

        it('should handle edge cases in millisecond validation', () => {
            // Test millisecond values at boundaries
            const result1 = atemporal.fromFormat('2024-01-01 12:30:45.1000', 'YYYY-MM-DD HH:mm:ss.SSS');
            expect(result1.isValid()).toBe(false);
            
            const result2 = atemporal.fromFormat('2024-01-01 12:30:45.-1', 'YYYY-MM-DD HH:mm:ss.SSS');
            expect(result2.isValid()).toBe(false);
        });
    });

    describe('Complex Validation Scenarios', () => {
        it('should handle complex date validation with current date injection', () => {
            // Set a specific current date for testing
            setCurrentDateFunction(() => ({ year: 2024, month: 6, day: 15 }));
            
            try {
                // Test parsing with missing components that should use current date
                const result1 = atemporal.fromFormat('14:30', 'HH:mm');
                expect(result1.isValid()).toBe(true);
                expect(result1.year).toBe(2024);
                expect(result1.month).toBe(6);
                expect(result1.day).toBe(15);
                
                // Test with invalid time that should fail validation
                const result2 = atemporal.fromFormat('25:30', 'HH:mm');
                expect(result2.isValid()).toBe(false);
            } finally {
                resetCurrentDateFunction();
            }
        });

        it('should handle Y2K year conversion edge cases', () => {
            // Test Y2K boundary conditions
            const result1 = atemporal.fromFormat('68-12-31', 'YY-MM-DD');
            expect(result1.isValid()).toBe(true);
            expect(result1.year).toBe(2068);
            
            const result2 = atemporal.fromFormat('69-01-01', 'YY-MM-DD');
            expect(result2.isValid()).toBe(true);
            expect(result2.year).toBe(1969);
            
            const result3 = atemporal.fromFormat('00-01-01', 'YY-MM-DD');
            expect(result3.isValid()).toBe(true);
            expect(result3.year).toBe(2000);
        });

        it('should handle 12-hour to 24-hour conversion edge cases', () => {
            // Test 12 AM conversion
            const result1 = atemporal.fromFormat('2024-01-01 12:00 AM', 'YYYY-MM-DD hh:mm A');
            expect(result1.isValid()).toBe(true);
            expect(result1.hour).toBe(0);
            
            // Test 12 PM conversion
            const result2 = atemporal.fromFormat('2024-01-01 12:00 PM', 'YYYY-MM-DD hh:mm A');
            expect(result2.isValid()).toBe(true);
            expect(result2.hour).toBe(12);
            
            // Test other PM hours
            const result3 = atemporal.fromFormat('2024-01-01 1:00 PM', 'YYYY-MM-DD h:mm A');
            expect(result3.isValid()).toBe(true);
            expect(result3.hour).toBe(13);
        });
    });

    describe('Cache and Performance Edge Cases', () => {
        it('should handle format cache edge cases', () => {
            // Test with formats that might cause cache issues
            const complexFormats = [
                'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]',
                '[Year] YYYY [Month] MM [Day] DD',
                'YYYY-DDD',
                'YYYY-[W]WW',
                'hh:mm A'
            ];
            
            complexFormats.forEach(format => {
                const result = atemporal.fromFormat('2024-01-01T12:00:00.000Z', format);
                // Some may be valid, some invalid, but should not crash
                expect(typeof result.isValid()).toBe('boolean');
            });
        });

        it('should handle cache statistics and management', () => {
            // Test cache management functions
            const initialSize = (atemporal as any).getFormatCacheSize();
            expect(typeof initialSize).toBe('number');
            
            // Parse some formats to populate cache
            atemporal.fromFormat('2024-01-01', 'YYYY-MM-DD');
            atemporal.fromFormat('01/01/2024', 'MM/DD/YYYY');
            
            const newSize = (atemporal as any).getFormatCacheSize();
            expect(newSize).toBeGreaterThanOrEqual(initialSize);
            
            // Clear cache
            (atemporal as any).clearFormatCache();
            const clearedSize = (atemporal as any).getFormatCacheSize();
            expect(clearedSize).toBe(0);
            
            // Test cache stats
            const stats = (atemporal as any).getFormatCacheStats();
            expect(typeof stats).toBe('object');
            expect(typeof stats.size).toBe('number');
        });
    });
});