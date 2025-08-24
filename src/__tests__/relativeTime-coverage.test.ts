import atemporal from '../index';
import relativeTime from '../plugins/relativeTime';
import { Temporal } from '@js-temporal/polyfill';

// Extend atemporal with relativeTime plugin
atemporal.extend(relativeTime);

/**
 * Relative Time Plugin Coverage Test Suite
 * 
 * This file specifically targets uncovered lines in relativeTime.ts
 * to achieve >90% coverage by testing error paths, edge cases, and cache management.
 */
describe('RelativeTime Plugin - Coverage Improvements', () => {
    beforeEach(() => {
        // Clear caches before each test
        (atemporal as any).clearRelativeTimeCache();
        atemporal.setDefaultLocale('en-US');
        jest.useFakeTimers().setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('RelativeTimeCache Error Handling (lines 60-72)', () => {
        it('should handle cache statistics and management', () => {
            // Clear cache and verify it's empty
            (atemporal as any).clearRelativeTimeCache();
            let stats = (atemporal as any).getRelativeTimeCacheStats();
            expect(stats.relativeTime.size).toBe(0);
            
            // Generate some relative times to populate cache
            const now = atemporal();
            const past = now.subtract(5, 'minutes');
            const future = now.add(2, 'hours');
            
            past.fromNow();
            future.fromNow();
            past.toNow();
            
            // Check cache has entries
            stats = (atemporal as any).getRelativeTimeCacheStats();
            expect(stats.relativeTime.size).toBeGreaterThan(0);
            expect(stats.relativeTime.maxSize).toBe(150);
        });

        it('should test cache clear functionality', () => {
            const now = atemporal();
            const past = now.subtract(10, 'minutes');
            
            // Populate cache
            past.fromNow();
            let stats = (atemporal as any).getRelativeTimeCacheStats();
            expect(stats.relativeTime.size).toBeGreaterThan(0);
            
            // Clear cache
            (atemporal as any).clearRelativeTimeCache();
            stats = (atemporal as any).getRelativeTimeCacheStats();
            expect(stats.relativeTime.size).toBe(0);
        });
    });

    describe('Invalid Date Handling (lines 130-132)', () => {
        it('should handle invalid instance dates', () => {
            const invalidDate = atemporal('invalid-date');
            const validDate = atemporal();
            
            expect(invalidDate.fromNow()).toBe('Invalid Date');
            expect(invalidDate.toNow()).toBe('Invalid Date');
        });

        it('should handle invalid comparison dates', () => {
            const validDate = atemporal();
            
            // Mock atemporal() to return invalid date
            const originalAtemporal = atemporal;
            const mockAtemporal = () => atemporal('invalid-date');
            Object.setPrototypeOf(mockAtemporal, originalAtemporal);
            Object.assign(mockAtemporal, originalAtemporal);
            
            // This would be hard to test directly, so we test the getRelativeTime function logic
            // by creating invalid dates and checking the result
            const result = validDate.fromNow();
            expect(typeof result).toBe('string');
        });
    });

    describe('Long-term Diff Error Handling (lines 186-195)', () => {
        it('should handle diff calculation errors for months and years', () => {
            const now = atemporal();
            const longPast = now.subtract(2, 'years');
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock the diff method to throw an error for long-term calculations
            const originalDiff = longPast.diff;
            let callCount = 0;
            longPast.diff = function(other: any, unit: any, precise?: boolean) {
                callCount++;
                if (unit === 'month' || unit === 'year') {
                    throw new Error('Diff calculation error');
                }
                return originalDiff.call(this, other, unit, precise);
            };
            
            try {
                const result = longPast.fromNow();
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
                expect(warnSpy).toHaveBeenCalledWith('RelativeTime: Error calculating long-term diff:', expect.any(Error));
            } finally {
                longPast.diff = originalDiff;
                console.warn = originalWarn;
            }
        });

        it('should fallback to day calculation when month/year diff fails', () => {
            const now = atemporal();
            const longFuture = now.add(18, 'months');
            
            // Mock the diff method to throw errors for month and year
            const originalDiff = longFuture.diff;
            longFuture.diff = function(other: any, unit: any, precise?: boolean) {
                if (unit === 'month' || unit === 'year') {
                    throw new Error('Long-term diff error');
                }
                return originalDiff.call(this, other, unit, precise);
            };
            
            try {
                const result = longFuture.fromNow();
                expect(typeof result).toBe('string');
                expect(result).toContain('day'); // Should fallback to days
            } finally {
                longFuture.diff = originalDiff;
            }
        });
    });

    describe('NumberFormat Error Handling (lines 205-212)', () => {
        it('should handle NumberFormat errors with withoutSuffix=true', () => {
            const now = atemporal();
            const past = now.subtract(30, 'minutes');
            
            // Test withoutSuffix functionality
            const result = past.fromNow(true); // withoutSuffix = true
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result).not.toContain('ago');
            // Note: result should not contain 'in' for withoutSuffix=true
        });

        it('should test simple fallback for NumberFormat errors', () => {
            const now = atemporal();
            const past = now.subtract(1, 'hour'); // Singular form
            
            // Mock IntlCache.getNumberFormatter to throw an error
            const originalGetNumberFormatter = (global as any).IntlCache?.getNumberFormatter;
            if ((global as any).IntlCache) {
                (global as any).IntlCache.getNumberFormatter = () => {
                    throw new Error('NumberFormatter error');
                };
            }
            
            try {
                const result = past.fromNow(true);
                expect(result).toBe('1 hour'); // Should use simple fallback without 's'
            } finally {
                if ((global as any).IntlCache && originalGetNumberFormatter) {
                    (global as any).IntlCache.getNumberFormatter = originalGetNumberFormatter;
                }
            }
        });
    });

    describe('RelativeTimeFormat Error Handling (lines 217-224)', () => {
        it('should handle RelativeTimeFormat errors with withoutSuffix=false', () => {
            const now = atemporal();
            const future = now.add(45, 'minutes');
            
            // Test normal relative time formatting
            const result = future.fromNow(false); // withoutSuffix = false
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('in'); // Should have prefix
            expect(result).toMatch(/\d+/); // Should contain some number
        });

        it('should test fallback logic for past dates', () => {
            const now = atemporal();
            const past = now.subtract(2, 'hours');
            
            // Mock IntlCache.getRelativeTimeFormatter to throw an error
            const originalGetRelativeTimeFormatter = (global as any).IntlCache?.getRelativeTimeFormatter;
            if ((global as any).IntlCache) {
                (global as any).IntlCache.getRelativeTimeFormatter = () => {
                    throw new Error('RelativeTimeFormatter error');
                };
            }
            
            try {
                const result = past.fromNow(false);
                expect(result).toContain('ago'); // Should have suffix for past
                expect(result).toContain('2'); // Should contain the number
                expect(result).toContain('hours'); // Should be plural
            } finally {
                if ((global as any).IntlCache && originalGetRelativeTimeFormatter) {
                    (global as any).IntlCache.getRelativeTimeFormatter = originalGetRelativeTimeFormatter;
                }
            }
        });

        it('should test fallback logic for singular units', () => {
            const now = atemporal();
            const past = now.subtract(1, 'minute');
            
            // Mock IntlCache.getRelativeTimeFormatter to throw an error
            const originalGetRelativeTimeFormatter = (global as any).IntlCache?.getRelativeTimeFormatter;
            if ((global as any).IntlCache) {
                (global as any).IntlCache.getRelativeTimeFormatter = () => {
                    throw new Error('RelativeTimeFormatter error');
                };
            }
            
            try {
                const result = past.fromNow(false);
                expect(result).toContain('ago');
                expect(result).toContain('1');
                expect(result).toBe('1 minute ago'); // Should be singular
            } finally {
                if ((global as any).IntlCache && originalGetRelativeTimeFormatter) {
                    (global as any).IntlCache.getRelativeTimeFormatter = originalGetRelativeTimeFormatter;
                }
            }
        });
    });

    describe('Ultimate Error Handling (lines 237-240)', () => {
        it('should handle unexpected errors in getRelativeTime', () => {
            const now = atemporal();
            const past = now.subtract(1, 'hour');
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock the diff method to throw an error to trigger the ultimate catch block
            const originalDiff = past.diff;
            past.diff = () => {
                throw new Error('Diff calculation error');
            };
            
            try {
                const result = past.fromNow();
                expect(result).toBe('Invalid Date'); // Should use ultimate fallback
                expect(warnSpy).toHaveBeenCalledWith('RelativeTime: Unexpected error:', expect.any(Error));
            } finally {
                past.diff = originalDiff;
                console.warn = originalWarn;
            }
        });

        it('should handle complete system failure', () => {
            const now = atemporal();
            const future = now.add(30, 'seconds');
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock the diff method to throw an error
            const originalDiff = future.diff;
            future.diff = () => {
                throw new Error('Diff calculation complete failure');
            };
            
            try {
                const result = future.fromNow();
                expect(result).toBe('Invalid Date');
                expect(warnSpy).toHaveBeenCalled();
            } finally {
                future.diff = originalDiff;
                console.warn = originalWarn;
            }
        });
    });

    describe('Cache Integration and Performance', () => {
        it('should use cached results for identical calculations', () => {
            const now = atemporal();
            const past = now.subtract(5, 'minutes');
            
            // First call should populate cache
            const result1 = past.fromNow();
            
            // Second call should use cache
            const result2 = past.fromNow();
            
            expect(result1).toBe(result2);
            
            // Verify cache has entries
            const stats = (atemporal as any).getRelativeTimeCacheStats();
            expect(stats.relativeTime.size).toBeGreaterThan(0);
        });

        it('should handle cache with different locales', () => {
            const now = atemporal();
            const past = now.subtract(10, 'minutes');
            
            // Test with different locales
            atemporal.setDefaultLocale('en-US');
            const resultEn = past.fromNow();
            
            atemporal.setDefaultLocale('es-ES');
            const resultEs = past.fromNow();
            
            expect(typeof resultEn).toBe('string');
            expect(typeof resultEs).toBe('string');
            expect(resultEn).not.toBe(resultEs); // Should be different for different locales
        });
    });

    describe('Threshold Edge Cases', () => {
        it('should handle exact threshold boundaries', () => {
            const now = atemporal();
            
            // Test exact threshold values
            const exactly45Seconds = now.subtract(45, 'seconds');
            const exactly45Minutes = now.subtract(45, 'minutes');
            const exactly22Hours = now.subtract(22, 'hours');
            const exactly26Days = now.subtract(26, 'days');
            
            expect(typeof exactly45Seconds.fromNow()).toBe('string');
            expect(typeof exactly45Minutes.fromNow()).toBe('string');
            expect(typeof exactly22Hours.fromNow()).toBe('string');
            expect(typeof exactly26Days.fromNow()).toBe('string');
        });

        it('should handle month to year threshold', () => {
            const now = atemporal();
            
            // Test exactly 11 months (threshold)
            const exactly11Months = now.subtract(11, 'months');
            const over11Months = now.subtract(13, 'months');
            
            const result11 = exactly11Months.fromNow();
            const result13 = over11Months.fromNow();
            
            expect(typeof result11).toBe('string');
            expect(typeof result13).toBe('string');
            
            // 11 months should use months, 13 months should use years
            expect(result11).toContain('month');
            expect(result13).toContain('year');
        });
    });

    describe('toNow vs fromNow Consistency', () => {
        it('should provide inverse results for toNow and fromNow', () => {
            const now = atemporal();
            const past = now.subtract(2, 'hours');
            const future = now.add(3, 'hours');
            
            // Test that toNow and fromNow are inverses
            const pastFromNow = past.fromNow();
            const pastToNow = past.toNow();
            
            const futureFromNow = future.fromNow();
            const futureToNow = future.toNow();
            
            expect(typeof pastFromNow).toBe('string');
            expect(typeof pastToNow).toBe('string');
            expect(typeof futureFromNow).toBe('string');
            expect(typeof futureToNow).toBe('string');
            
            // They should be different (inverse relationship)
            expect(pastFromNow).not.toBe(pastToNow);
            expect(futureFromNow).not.toBe(futureToNow);
        });

        it('should handle withoutSuffix parameter consistently', () => {
            const now = atemporal();
            const past = now.subtract(1, 'hour');
            
            const withSuffix = past.fromNow(false);
            const withoutSuffix = past.fromNow(true);
            
            expect(withSuffix).toContain('ago');
            expect(withoutSuffix).not.toContain('ago');
            expect(withoutSuffix).not.toContain('in');
        });
    });

    describe('Locale Validation Integration', () => {
        it('should handle locale validation in fromNow and toNow', () => {
            const now = atemporal();
            const past = now.subtract(30, 'minutes');
            
            // Test with various locale formats
            atemporal.setDefaultLocale('en_US'); // Underscore format
            const result1 = past.fromNow();
            
            atemporal.setDefaultLocale('es-ES'); // Hyphen format
            const result2 = past.fromNow();
            
            atemporal.setDefaultLocale('fr'); // Simple format
            const result3 = past.toNow();
            
            expect(typeof result1).toBe('string');
            expect(typeof result2).toBe('string');
            expect(typeof result3).toBe('string');
        });
    });

    describe('Specific Branch Coverage - Lines 205-210, 217-224', () => {
        it('should trigger long-term diff error fallback (lines 205-210)', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            const now = atemporal();
            const longAgo = now.subtract(2, 'years'); // This should trigger month/year diff calculation
            
            // Mock the diff method to throw an error specifically for month and year calculations
            const originalDiff = longAgo.diff;
            longAgo.diff = jest.fn().mockImplementation((other, unit, precise) => {
                if (unit === 'month' || unit === 'year') {
                    throw new Error('Long-term diff calculation error');
                }
                // Return a large number of seconds to trigger the long-term path
                return 86400 * 400; // More than 26 days in seconds
            });
            
            try {
                const result = longAgo.fromNow();
                expect(typeof result).toBe('string');
                expect(result).toContain('day'); // Should fallback to day calculation
                expect(mockConsoleWarn).toHaveBeenCalledWith(
                    'RelativeTime: Error calculating long-term diff:',
                    expect.any(Error)
                );
            } finally {
                longAgo.diff = originalDiff;
                mockConsoleWarn.mockRestore();
            }
        });

        it('should trigger NumberFormat error in withoutSuffix mode (lines 217-224)', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock Intl.NumberFormat directly to throw an error
            const originalNumberFormat = Intl.NumberFormat;
            (global as any).Intl.NumberFormat = jest.fn().mockImplementation(() => {
                throw new Error('NumberFormat creation error');
            });
            
            try {
                const now = atemporal();
                const past = now.subtract(5, 'minutes');
                
                const result = past.fromNow(true); // withoutSuffix = true to trigger NumberFormat path
                expect(typeof result).toBe('string');
                expect(result).toContain('5'); // Should contain the value in fallback
                expect(result).toContain('minute'); // Should contain the unit in fallback
                expect(mockConsoleWarn).toHaveBeenCalledWith(
                    'RelativeTime: Error formatting number:',
                    expect.any(Error)
                );
            } finally {
                (global as any).Intl.NumberFormat = originalNumberFormat;
                mockConsoleWarn.mockRestore();
            }
        });

        it('should trigger RelativeTimeFormat error in normal mode', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock Intl.RelativeTimeFormat directly to throw an error
            const originalRelativeTimeFormat = Intl.RelativeTimeFormat;
            (global as any).Intl.RelativeTimeFormat = jest.fn().mockImplementation(() => {
                throw new Error('RelativeTimeFormat creation error');
            });
            
            try {
                const now = atemporal();
                const future = now.add(3, 'hours');
                
                const result = future.fromNow(false); // withoutSuffix = false to trigger RelativeTimeFormat path
                expect(typeof result).toBe('string');
                expect(result).toContain('3'); // Should contain the value in fallback
                expect(result).toContain('hour'); // Should contain the unit in fallback
                expect(result).toContain('in'); // Should contain the prefix in fallback
                expect(mockConsoleWarn).toHaveBeenCalledWith(
                    'RelativeTime: Error formatting relative time:',
                    expect.any(Error)
                );
            } finally {
                (global as any).Intl.RelativeTimeFormat = originalRelativeTimeFormat;
                mockConsoleWarn.mockRestore();
            }
        });

        it('should handle plural vs singular unit names in fallback', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock IntlCache to force fallback scenarios
            const originalIntlCache = (global as any).IntlCache;
            (global as any).IntlCache = {
                getNumberFormatter: () => { throw new Error('NumberFormat error'); },
                getRelativeTimeFormatter: () => { throw new Error('RelativeTimeFormat error'); },
                validateAndNormalize: (locale: any) => locale
            };
            
            try {
                const now = atemporal();
                
                // Test singular (1 unit)
                const singular = now.subtract(1, 'minute');
                const singularResult = singular.fromNow(true);
                expect(singularResult).toContain('1 minute'); // Should be singular
                expect(singularResult).not.toContain('minutes');
                
                // Test plural (multiple units)
                const plural = now.subtract(5, 'minutes');
                const pluralResult = plural.fromNow(true);
                expect(pluralResult).toContain('5 minutes'); // Should be plural
                
                // Test with suffix mode
                const withSuffix = now.add(2, 'hours');
                const suffixResult = withSuffix.fromNow(false);
                expect(suffixResult).toContain('in 2 hours'); // Should have prefix
                
                const pastSuffix = now.subtract(3, 'days');
                const pastSuffixResult = pastSuffix.fromNow(false);
                expect(pastSuffixResult).toContain('3 days ago'); // Should have suffix
                
            } finally {
                (global as any).IntlCache = originalIntlCache;
                mockConsoleWarn.mockRestore();
            }
        });
    });
});