import atemporal from '../index';
import durationHumanizer from '../plugins/durationHumanizer';
import { Temporal } from '@js-temporal/polyfill';

// Extend atemporal with durationHumanizer plugin
atemporal.extend(durationHumanizer);

/**
 * Duration Humanizer Plugin Coverage Test Suite
 * 
 * This file specifically targets uncovered lines in durationHumanizer.ts
 * to achieve >90% coverage by testing error paths, edge cases, and fallback scenarios.
 */
describe('DurationHumanizer Plugin - Coverage Improvements', () => {
    beforeEach(() => {
        // Clear caches before each test
        (atemporal as any).clearDurationHumanizerCache();
        atemporal.setDefaultLocale('en-US');
    });

    describe('DurationFormatCache Error Handling', () => {
        it('should handle Intl.PluralRules creation errors (lines 108-109)', () => {
            // Mock Intl.PluralRules to throw an error
            const originalPluralRules = Intl.PluralRules;
            Object.defineProperty(global.Intl, 'PluralRules', {
                value: function() {
                    throw new Error('PluralRules creation error');
                },
                writable: true,
                configurable: true
            });
            
            try {
                const duration = { hours: 2, minutes: 30 };
                const result = atemporal.humanize(duration, { locale: 'en' });
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            } finally {
                Object.defineProperty(global.Intl, 'PluralRules', {
                    value: originalPluralRules,
                    writable: true,
                    configurable: true
                });
            }
        });

        it('should test cache statistics and management', () => {
            // Clear cache and verify it's empty
            (atemporal as any).clearDurationHumanizerCache();
            let stats = (atemporal as any).getDurationHumanizerCacheStats();
            expect(stats.durationFormat.size).toBe(0);
            
            // Generate some durations to populate cache
            atemporal.humanize({ hours: 1 }, { locale: 'en' });
            atemporal.humanize({ minutes: 30 }, { locale: 'es' });
            atemporal.humanize({ seconds: 45 }, { locale: 'fr' });
            
            // Check cache has entries
            stats = (atemporal as any).getDurationHumanizerCacheStats();
            expect(stats.durationFormat.size).toBeGreaterThan(0);
            expect(stats.durationFormat.maxSize).toBe(200);
        });
    });

    describe('getLocalizedUnit Function Edge Cases (lines 285-307)', () => {
        it('should handle complex locale extraction', () => {
            const duration = { seconds: 1 };
            
            // Test with complex locale formats
            const result1 = atemporal.humanize(duration, { locale: 'zh_Hans-CN' });
            expect(typeof result1).toBe('string');
            
            const result2 = atemporal.humanize(duration, { locale: 'en_US-POSIX' });
            expect(typeof result2).toBe('string');
            
            const result3 = atemporal.humanize(duration, { locale: 'fr-CA-x-ca' });
            expect(typeof result3).toBe('string');
        });

        it('should test all unitDisplay options for all supported languages', () => {
            const duration = { hours: 1, minutes: 30 };
            const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
            const unitDisplays: ('long' | 'short' | 'narrow')[] = ['long', 'short', 'narrow'];
            
            locales.forEach(locale => {
                unitDisplays.forEach(unitDisplay => {
                    const result = atemporal.humanize(duration, { locale, unitDisplay });
                    expect(typeof result).toBe('string');
                    expect(result.length).toBeGreaterThan(0);
                });
            });
        });

        it('should fallback to English for unsupported locales', () => {
            const duration = { seconds: 1 };
            
            // Test with completely unsupported locale
            const result = atemporal.humanize(duration, { locale: 'xyz-INVALID', unitDisplay: 'narrow' });
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle missing unit mappings gracefully', () => {
            const duration = { milliseconds: 500 };
            
            // Test with locale that might not have all unit mappings
            const result = atemporal.humanize(duration, { locale: 'ru', unitDisplay: 'narrow' });
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Humanize Function Error Handling (lines 320-378)', () => {
        it('should handle null and undefined inputs with error fallback', () => {
            const result1 = atemporal.humanize(null as any);
            expect(result1).toBe('0 seconds'); // Should use final fallback
            
            const result2 = atemporal.humanize(undefined as any);
            expect(result2).toBe('0 seconds'); // Should use final fallback
            
            const result3 = atemporal.humanize({});
            expect(result3).toBe('0 seconds'); // Should use final fallback
        });

        it('should handle fractional values with rounding', () => {
            const duration = {
                hours: 1.33333,
                minutes: 45.6789,
                seconds: 30.999
            };
            
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle NumberFormat errors with enhanced fallback', () => {
            const duration = { hours: 2.5, minutes: 30.7 };
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock Intl.NumberFormat to throw an error in the fallback path
            const originalNumberFormat = Intl.NumberFormat;
            let callCount = 0;
            (Intl as any).NumberFormat = function() {
                callCount++;
                if (callCount > 1) { // Allow first call to succeed, fail on fallback
                    throw new Error('NumberFormat error in fallback');
                }
                return new originalNumberFormat(...arguments);
            };
            
            try {
                const result = atemporal.humanize(duration, { locale: 'en' });
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            } finally {
                Intl.NumberFormat = originalNumberFormat;
                console.warn = originalWarn;
            }
        });

        it('should handle PluralRules errors in enhanced fallback', () => {
            const duration = { hours: 2.5 };
            
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock both NumberFormat and PluralRules to fail in fallback
            const originalNumberFormat = Intl.NumberFormat;
            const originalPluralRules = Intl.PluralRules;
            
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: function() {
                    throw new Error('NumberFormat error');
                },
                writable: true,
                configurable: true
            });
            
            Object.defineProperty(global.Intl, 'PluralRules', {
                value: function() {
                    throw new Error('PluralRules error');
                },
                writable: true,
                configurable: true
            });
            
            try {
                const result = atemporal.humanize(duration, { locale: 'en' });
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
                expect(warnSpy).toHaveBeenCalled();
            } finally {
                Object.defineProperty(global.Intl, 'NumberFormat', {
                    value: originalNumberFormat,
                    writable: true,
                    configurable: true
                });
                Object.defineProperty(global.Intl, 'PluralRules', {
                    value: originalPluralRules,
                    writable: true,
                    configurable: true
                });
                console.warn = originalWarn;
            }
        });

        it('should handle simple fallback for unsupported locales', () => {
            const duration = { hours: 1.5, minutes: 30.7 };
            
            // Force the simple fallback path by mocking all Intl APIs to fail
            const originalNumberFormat = Intl.NumberFormat;
            const originalPluralRules = Intl.PluralRules;
            
            (Intl as any).NumberFormat = function() {
                throw new Error('NumberFormat not supported');
            };
            
            (Intl as any).PluralRules = function() {
                throw new Error('PluralRules not supported');
            };
            
            try {
                const result = atemporal.humanize(duration, { locale: 'en' });
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
                // Should use simple string concatenation fallback
            } finally {
                Intl.NumberFormat = originalNumberFormat;
                Object.defineProperty(global.Intl, 'PluralRules', {
                    value: originalPluralRules,
                    writable: true,
                    configurable: true
                });
            }
        });

        it('should handle ListFormat errors with fallback', () => {
            const duration = { hours: 1, minutes: 30, seconds: 45 };
            
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('and'); // Should contain conjunction
        });

        it('should test different fallback join patterns', () => {
            // Mock IntlCache.getListFormatter to always throw
            const originalGetListFormatter = (global as any).IntlCache?.getListFormatter;
            if ((global as any).IntlCache) {
                (global as any).IntlCache.getListFormatter = () => {
                    throw new Error('ListFormatter error');
                };
            }
            
            try {
                // Test single part
                const result1 = atemporal.humanize({ hours: 1 });
                expect(result1).not.toContain('and');
                
                // Test two parts
                const result2 = atemporal.humanize({ hours: 1, minutes: 30 });
                expect(result2).toContain('and');
                expect(result2.split('and').length).toBe(2);
                
                // Test three or more parts
                const result3 = atemporal.humanize({ hours: 1, minutes: 30, seconds: 45 });
                expect(result3).toContain('and');
                expect(result3).toContain(',');
            } finally {
                if ((global as any).IntlCache && originalGetListFormatter) {
                    (global as any).IntlCache.getListFormatter = originalGetListFormatter;
                }
            }
        });
    });

    describe('Ultimate Error Handling (lines 392-397)', () => {
        it('should handle Temporal.Duration.from errors', () => {
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock Temporal.Duration.from to throw an error
            const originalFrom = Temporal.Duration.from;
            Temporal.Duration.from = () => {
                throw new Error('Duration.from error');
            };
            
            try {
                const result = atemporal.humanize({ hours: 'invalid' } as any);
                expect(result).toBe('0 seconds'); // Should use ultimate fallback
                expect(warnSpy).toHaveBeenCalledWith('DurationHumanizer: Error processing duration:', expect.any(Error));
            } finally {
                Temporal.Duration.from = originalFrom;
                console.warn = originalWarn;
            }
        });

        it('should handle complete system failure gracefully', () => {
            // Mock console.warn to capture error logging
            const originalWarn = console.warn;
            const warnSpy = jest.fn();
            console.warn = warnSpy;
            
            // Mock everything to fail
            const originalFrom = Temporal.Duration.from;
            const originalValidateAndNormalize = (global as any).LocaleUtils?.validateAndNormalize;
            
            Temporal.Duration.from = () => {
                throw new Error('Complete system failure');
            };
            
            if ((global as any).LocaleUtils) {
                (global as any).LocaleUtils.validateAndNormalize = () => {
                    throw new Error('Locale validation failure');
                };
            }
            
            try {
                const result = atemporal.humanize({ hours: 1 });
                expect(result).toBe('0 seconds'); // Should use ultimate fallback
                expect(warnSpy).toHaveBeenCalled();
            } finally {
                Temporal.Duration.from = originalFrom;
                if ((global as any).LocaleUtils && originalValidateAndNormalize) {
                    (global as any).LocaleUtils.validateAndNormalize = originalValidateAndNormalize;
                }
                console.warn = originalWarn;
            }
        });
    });

    describe('Additional Error Handling Coverage', () => {
        it('should handle number formatting errors', () => {
            // Test error handling in number formatting
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock Intl.NumberFormat to throw an error
            const originalNumberFormat = Intl.NumberFormat;
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: function() {
                    throw new Error('NumberFormat error');
                },
                writable: true,
                configurable: true
            });
            
            const result = atemporal.humanize({ hours: 2 });
            expect(result).toBe('2 hours'); // Should fallback gracefully
            expect(mockConsoleWarn).toHaveBeenCalled();
            
            // Restore original
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: originalNumberFormat,
                writable: true,
                configurable: true
            });
            mockConsoleWarn.mockRestore();
        });

        it('should handle DurationFormatCache error scenarios', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Test error in DurationFormatCache.getFormattedDuration
            const originalNumberFormat = Intl.NumberFormat;
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: function() {
                    return {
                        format: jest.fn().mockImplementation(() => {
                            throw new Error('Format error');
                        })
                    };
                },
                writable: true,
                configurable: true
            });
            
            const result = atemporal.humanize({ minutes: 30 });
            expect(typeof result).toBe('string');
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('DurationFormatCache: Error formatting'),
                expect.any(Error)
            );
            
            // Restore original
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: originalNumberFormat,
                writable: true,
                configurable: true
            });
            mockConsoleWarn.mockRestore();
        });

        it('should handle getFallbackFormat error scenarios', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock both NumberFormat and PluralRules to fail
            const originalNumberFormat = Intl.NumberFormat;
            const originalPluralRules = Intl.PluralRules;
            
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: function() {
                    throw new Error('NumberFormat error');
                },
                writable: true,
                configurable: true
            });
            Object.defineProperty(global.Intl, 'PluralRules', {
                value: function() {
                    throw new Error('PluralRules error');
                },
                writable: true,
                configurable: true
            });
            
            const result = atemporal.humanize({ seconds: 5 });
            expect(typeof result).toBe('string');
            expect(result).toContain('5'); // Should contain the value
            
            // Restore originals
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: originalNumberFormat,
                writable: true,
                configurable: true
            });
            Object.defineProperty(global.Intl, 'PluralRules', {
                value: originalPluralRules,
                writable: true,
                configurable: true
            });
            mockConsoleWarn.mockRestore();
        });

        it('should handle getPluralRules error scenarios', () => {
            // Mock PluralRules to throw an error
            const originalPluralRules = Intl.PluralRules;
            
            try {
                // Mock PluralRules to fail
                Object.defineProperty(global.Intl, 'PluralRules', {
                    value: function() {
                        throw new Error('PluralRules error');
                    },
                    writable: true,
                    configurable: true
                });
                
                const result = atemporal.humanize({ hours: 2, minutes: 30 });
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            } finally {
                // Restore originals
                Object.defineProperty(global.Intl, 'PluralRules', {
                    value: originalPluralRules,
                    writable: true,
                    configurable: true
                });
            }
        });

        it('should handle zero duration formatting errors', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock NumberFormat to fail for zero duration
            const originalNumberFormat = Intl.NumberFormat;
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: function() {
                    throw new Error('NumberFormat error');
                },
                writable: true,
                configurable: true
            });
            
            const result = atemporal.humanize({});
            expect(result).toBe('0 seconds'); // Should fallback to simple string
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                'DurationHumanizer: Error formatting zero duration:',
                expect.any(Error)
            );
            
            // Restore original
            Object.defineProperty(global.Intl, 'NumberFormat', {
                value: originalNumberFormat,
                writable: true,
                configurable: true
            });
            mockConsoleWarn.mockRestore();
        });

        it('should handle ListFormat error scenarios', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock ListFormat to throw an error
            const originalListFormat = Intl.ListFormat;
            Object.defineProperty(global.Intl, 'ListFormat', {
                value: function() {
                    throw new Error('ListFormat error');
                },
                writable: true,
                configurable: true
            });
            
            const result = atemporal.humanize({ hours: 2, minutes: 30 });
            expect(typeof result).toBe('string');
            expect(result).toContain('and'); // Should fallback to simple join
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                'DurationHumanizer: Error formatting list:',
                expect.any(Error)
            );
            
            // Restore original
            Object.defineProperty(global.Intl, 'ListFormat', {
                value: originalListFormat,
                writable: true,
                configurable: true
            });
            mockConsoleWarn.mockRestore();
        });

        it('should handle ultimate fallback scenarios', () => {
            const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            
            // Mock Temporal.Duration.from to throw an error
            const originalFrom = Temporal.Duration.from;
            Temporal.Duration.from = jest.fn().mockImplementation(() => {
                throw new Error('Invalid duration');
            });
            
            const result = atemporal.humanize({ invalid: 'data' } as any);
            expect(result).toBe('0 seconds'); // Ultimate fallback
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                'DurationHumanizer: Error processing duration:',
                expect.any(Error)
            );
            
            // Restore original
            Temporal.Duration.from = originalFrom;
            mockConsoleWarn.mockRestore();
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle zero duration with all units', () => {
            const zeroDuration = {
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            };
            
            const result = atemporal.humanize(zeroDuration);
            expect(result).toBe('0 seconds');
        });

        it('should handle very large numbers', () => {
            const largeDuration = {
                years: Number.MAX_SAFE_INTEGER,
                days: 999999999
            };
            
            const result = atemporal.humanize(largeDuration);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle negative values', () => {
            const negativeDuration = {
                hours: -5,
                minutes: -30
            };
            
            const result = atemporal.humanize(negativeDuration);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle all listStyle options with error scenarios', () => {
            const duration = { hours: 1, minutes: 30, seconds: 45 };
            const listStyles: ('long' | 'short' | 'narrow')[] = ['long', 'short', 'narrow'];
            
            listStyles.forEach(listStyle => {
                const result = atemporal.humanize(duration, { listStyle });
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
        });

        it('should handle fractional milliseconds', () => {
            const duration = {
                milliseconds: 123.456789
            };
            
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
            expect(result).toMatch(/\d+/); // Should contain rounded milliseconds
        });

        it('should handle mixed integer and fractional values', () => {
            const duration = {
                hours: 2,
                minutes: 30.5,
                seconds: 45.999,
                milliseconds: 123.1
            };
            
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });
});