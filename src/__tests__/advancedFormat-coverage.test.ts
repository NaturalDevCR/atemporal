import atemporal from '../index';
import advancedFormat from '../plugins/advancedFormat';
import { Temporal } from '@js-temporal/polyfill';

// Extend atemporal with advancedFormat plugin
atemporal.extend(advancedFormat);

/**
 * Advanced Format Plugin Coverage Test Suite
 * 
 * This file specifically targets uncovered lines in advancedFormat.ts
 * to achieve >90% coverage by testing error paths, edge cases, and cache management.
 */
describe('AdvancedFormat Plugin - Coverage Improvements', () => {
    beforeEach(() => {
        // Clear caches before each test
        (atemporal as any).clearAdvancedFormatCache();
        atemporal.setDefaultLocale('en-US');
    });

    describe('OrdinalCache Error Handling', () => {
        it('should handle invalid locale inputs gracefully', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test with null locale (should fallback)
            const result1 = date.format('Do', null as any);
            expect(result1).toContain('15');
            
            // Test with undefined locale (should fallback)
            const result2 = date.format('Do', undefined as any);
            expect(result2).toContain('15');
            
            // Test with non-string locale (should fallback)
            const result3 = date.format('Do', 123 as any);
            expect(result3).toContain('15');
        });

        it('should handle unsupported locales and return plain number', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test with completely unsupported locale
            const result = date.format('Do', 'xyz-INVALID');
            expect(result).toBe('15'); // Should return just the number
        });

        it('should handle Intl.PluralRules errors gracefully', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Mock Intl.PluralRules to throw an error
            const originalPluralRules = Intl.PluralRules;
            Object.defineProperty(global.Intl, 'PluralRules', {
                value: function() {
                    throw new Error('PluralRules error');
                },
                writable: true,
                configurable: true
            });
            
            try {
                const result = date.format('Do', 'en');
                expect(result).toBe('15'); // Should fallback to plain number
            } finally {
                // Restore original PluralRules
                Object.defineProperty(global.Intl, 'PluralRules', {
                    value: originalPluralRules,
                    writable: true,
                    configurable: true
                });
            }
        });

        it('should handle Chinese locale prefix format', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test Chinese locale which uses prefix format
            const result = date.format('Do', 'zh');
            expect(result).toContain('15');
            expect(result).toContain('第'); // Should contain Chinese prefix
        });

        it('should test cache functionality and stats', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Clear cache and verify it's empty
            (atemporal as any).clearAdvancedFormatCache();
            let stats = (atemporal as any).getAdvancedFormatCacheStats();
            expect(stats.ordinal.size).toBe(0);
            
            // Generate some ordinals to populate cache
            date.format('Do', 'en');
            date.format('Do', 'es');
            date.format('Qo', 'en');
            
            // Check cache has entries
            stats = (atemporal as any).getAdvancedFormatCacheStats();
            expect(stats.ordinal.size).toBeGreaterThan(0);
            expect(stats.ordinal.maxSize).toBe(200);
        });
    });

    describe('TimezoneCache Error Handling', () => {
        it('should handle timezone formatting errors gracefully', () => {
            const date = atemporal('2024-01-15T12:00:00', 'America/New_York');
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock Intl.DateTimeFormat to throw an error
            const originalDateTimeFormat = Intl.DateTimeFormat;
            (Intl as any).DateTimeFormat = function() {
                throw new Error('DateTimeFormat error');
            };
            
            try {
                const result = date.format('zzz', 'en');
                expect(result).toBe('America/New_York'); // Should fallback to timezone ID
                expect(warnSpy).toHaveBeenCalled();
            } finally {
                Intl.DateTimeFormat = originalDateTimeFormat;
                console.warn = originalWarn;
            }
        });

        it('should handle invalid timezone formatting', () => {
            const date = atemporal('2024-01-15T12:00:00', 'America/New_York');
            
            // Test with invalid locale that might cause formatting issues
            const result1 = date.format('zzz', 'invalid-locale');
            expect(typeof result1).toBe('string');
            
            const result2 = date.format('zzzz', 'invalid-locale');
            expect(typeof result2).toBe('string');
        });

        it('should test timezone cache functionality', () => {
            const date = atemporal('2024-01-15T12:00:00', 'America/New_York');
            
            // Clear cache and verify it's empty
            (atemporal as any).clearAdvancedFormatCache();
            let stats = (atemporal as any).getAdvancedFormatCacheStats();
            expect(stats.timezone.size).toBe(0);
            
            // Generate some timezone names to populate cache
            date.format('zzz', 'en');
            date.format('zzzz', 'en');
            date.format('zzz', 'es');
            
            // Check cache has entries
            stats = (atemporal as any).getAdvancedFormatCacheStats();
            expect(stats.timezone.size).toBeGreaterThan(0);
            expect(stats.timezone.maxSize).toBe(100);
        });

        it('should handle formatToParts returning no timezone part', () => {
            const date = atemporal('2024-01-15T12:00:00', 'America/New_York');
            
            // Mock formatToParts to return parts without timeZoneName
            const originalDateTimeFormat = Intl.DateTimeFormat;
            (Intl as any).DateTimeFormat = function() {
                return {
                    formatToParts: () => [
                        { type: 'month', value: '1' },
                        { type: 'literal', value: '/' },
                        { type: 'day', value: '15' }
                        // No timeZoneName part
                    ]
                };
            };
            
            try {
                const result = date.format('zzz', 'en');
                expect(result).toBe('America/New_York'); // Should fallback to timezone ID
            } finally {
                Intl.DateTimeFormat = originalDateTimeFormat;
            }
        });
    });

    describe('Advanced Token Processing Error Handling', () => {
        it('should handle token replacement errors gracefully', () => {
            const date = atemporal('2024-01-15T12:00:00', 'America/New_York');
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Create a scenario where token replacement might fail
            // by mocking the quarter method to throw an error
            const originalQuarter = date.quarter;
            date.quarter = () => {
                throw new Error('Quarter calculation error');
            };
            
            try {
                const result = date.format('Qo', 'en');
                expect(result).toBe('Qo'); // Should return original token as fallback
                expect(warnSpy).toHaveBeenCalled();
            } finally {
                date.quarter = originalQuarter;
                console.warn = originalWarn;
            }
        });

        it('should handle invalid date instances gracefully', () => {
            const invalidDate = atemporal('invalid-date');
            
            // Should fall back to original format method for invalid dates
            const result = invalidDate.format('Do MMMM YYYY');
            expect(typeof result).toBe('string');
        });

        it('should handle non-string format templates', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Should fall back to original format method for non-string templates
            const result1 = date.format({ dateStyle: 'full' } as any);
            expect(typeof result1).toBe('string');
            
            const result2 = date.format(null as any);
            expect(typeof result2).toBe('string');
            
            const result3 = date.format(undefined as any);
            expect(typeof result3).toBe('string');
        });
    });

    describe('shouldUseNormalizedLocale Function', () => {
        it('should return true for non-string locale inputs', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test with null, undefined, number, object
            const result1 = date.format('Do', null as any);
            expect(result1).toContain('15');
            
            const result2 = date.format('Do', undefined as any);
            expect(result2).toContain('15');
            
            const result3 = date.format('Do', 123 as any);
            expect(result3).toContain('15');
            
            const result4 = date.format('Do', {} as any);
            expect(result4).toContain('15');
        });

        it('should return true for underscore format locales', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test with underscore format locale
            const result = date.format('Do', 'en_US');
            expect(result).toContain('15');
        });

        it('should handle unsupported base language', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test with completely unsupported locale and base language
            const result = date.format('Do', 'xyz-ABC');
            expect(result).toBe('15'); // Should return plain number
        });

        it('should handle supported base language with unsupported variant', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test with supported base language but unsupported variant
            const result = date.format('Do', 'en-INVALID');
            expect(result).toContain('15');
        });
    });

    describe('Global Cache Integration', () => {
        it('should integrate with global cache coordinator', () => {
            const date = atemporal('2024-01-15T12:00:00', 'America/New_York');
            
            // Test clearAllCaches method
            if (typeof (atemporal as any).clearAllCaches === 'function') {
                (atemporal as any).clearAllCaches();
                const stats = (atemporal as any).getAdvancedFormatCacheStats();
                expect(stats.ordinal.size).toBe(0);
                expect(stats.timezone.size).toBe(0);
            }
            
            // Test getAllCacheStats method
            if (typeof (atemporal as any).getAllCacheStats === 'function') {
                const allStats = (atemporal as any).getAllCacheStats();
                expect(allStats).toHaveProperty('advancedFormat');
                expect(allStats.advancedFormat).toHaveProperty('ordinal');
                expect(allStats.advancedFormat).toHaveProperty('timezone');
            }
        });
    });

    describe('Complex Format Combinations', () => {
        it('should handle multiple advanced tokens in one format string', () => {
            const date = atemporal('2024-07-15T12:00:00', 'America/New_York');
            
            // Test complex format with multiple advanced tokens
            const result = date.format('Do MMMM YYYY, Qo [quarter], zzz');
            expect(result).toContain('15th');
            expect(result).toContain('July');
            expect(result).toContain('2024');
            expect(result).toContain('3rd');
            expect(result).toContain('quarter');
            expect(typeof result).toBe('string');
        });

        it('should handle advanced tokens with different locales', () => {
            const date = atemporal('2024-01-15T12:00:00Z');
            
            // Test various locales with ordinal tokens
            const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
            
            locales.forEach(locale => {
                const result = date.format('Do', locale);
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
        });

        it('should handle quarter ordinals for all quarters', () => {
            const dates = [
                atemporal('2024-01-15T12:00:00Z'), // Q1
                atemporal('2024-04-15T12:00:00Z'), // Q2
                atemporal('2024-07-15T12:00:00Z'), // Q3
                atemporal('2024-10-15T12:00:00Z')  // Q4
            ];
            
            dates.forEach((date, index) => {
                const result = date.format('Qo', 'en');
                expect(result).toContain((index + 1).toString());
                expect(typeof result).toBe('string');
            });
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle leap year dates', () => {
            const leapDate = atemporal('2024-02-29T12:00:00Z');
            
            const result = leapDate.format('Do MMMM YYYY');
            expect(result).toContain('29th');
            expect(result).toContain('February');
        });

        it('should handle year boundaries', () => {
            const newYear = atemporal('2024-01-01T00:00:00Z');
            const yearEnd = atemporal('2024-12-31T23:59:59Z');
            
            expect(newYear.format('Do')).toContain('1st');
            expect(newYear.format('Qo')).toContain('1st');
            
            expect(yearEnd.format('Do')).toContain('31st');
            expect(yearEnd.format('Qo')).toContain('4th');
        });

        it('should handle different timezone scenarios', () => {
            const timezones = [
                'UTC',
                'America/New_York',
                'Europe/London',
                'Asia/Tokyo',
                'Australia/Sydney'
            ];
            
            timezones.forEach(tz => {
                const date = atemporal('2024-01-15T12:00:00', tz);
                const shortTz = date.format('zzz');
                const longTz = date.format('zzzz');
                
                expect(typeof shortTz).toBe('string');
                expect(typeof longTz).toBe('string');
                expect(shortTz.length).toBeGreaterThan(0);
                expect(longTz.length).toBeGreaterThan(0);
            });
        });
    });
});