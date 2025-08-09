import atemporal from '../index';
import durationHumanizer from '../plugins/durationHumanizer';
import relativeTimePlugin from '../plugins/relativeTime';
import weekDayPlugin from '../plugins/weekDay';
import customParseFormat from '../plugins/customParseFormat';
import advancedFormat from '../plugins/advancedFormat';
import { TemporalUtils } from '../TemporalUtils';

// Extend atemporal with all plugins
atemporal.extend(durationHumanizer);
atemporal.extend(relativeTimePlugin);
atemporal.extend(weekDayPlugin);
atemporal.extend(customParseFormat);
atemporal.extend(advancedFormat);

/**
 * Coverage Improvement Test Suite
 * 
 * This file contains tests specifically designed to improve code coverage
 * by testing edge cases, error paths, and uncovered branches.
 */
describe('Coverage Improvements', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-10-27T10:00:00Z'));
        atemporal.setDefaultLocale('en-US');
        atemporal.setWeekStartsOn(1);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Duration Humanizer Edge Cases', () => {
        it('should handle unsupported locales with fallback', () => {
            const duration = { hours: 2, minutes: 30 };
            
            // Test with completely unsupported locale
            const result1 = atemporal.humanize(duration, { locale: 'xyz-INVALID' });
            expect(result1).toBe('2 hours and 30 minutes');
            
            // Test with partially supported locale
            const result2 = atemporal.humanize(duration, { locale: 'en-INVALID' });
            expect(result2).toBe('2 hours and 30 minutes');
        });

        it('should handle Intl.NumberFormat errors gracefully', () => {
            const duration = { hours: 1.5, minutes: 30.7 };
            
            // Test with edge case locale that might cause formatting issues
            const result = atemporal.humanize(duration, { locale: 'en' });
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            // Note: fractional values might be rounded or treated as invalid
        });

        it('should handle empty and null duration objects', () => {
            expect(atemporal.humanize({})).toBe('0 seconds');
            expect(atemporal.humanize(null as any)).toBe('0 seconds');
            expect(atemporal.humanize(undefined as any)).toBe('0 seconds');
        });

        it('should handle fractional values correctly', () => {
            const duration = { hours: 1.33, minutes: 45.67, seconds: 30.99 };
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            // Note: fractional values might be rounded or truncated
        });

        it('should handle all duration units with zero values', () => {
            const duration = {
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            };
            expect(atemporal.humanize(duration)).toBe('0 seconds');
        });

        it('should handle negative duration values', () => {
            const duration = { hours: -2, minutes: -30 };
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
        });

        it('should handle very large duration values', () => {
            const duration = { years: 999999, days: 999999 };
            const result = atemporal.humanize(duration);
            expect(typeof result).toBe('string');
            expect(result).toContain('year');
            expect(result).toContain('day');
        });

        it('should handle different unitDisplay options', () => {
            const duration = { hours: 2, minutes: 30 };
            
            const longResult = atemporal.humanize(duration, { unitDisplay: 'long' });
            const shortResult = atemporal.humanize(duration, { unitDisplay: 'short' });
            const narrowResult = atemporal.humanize(duration, { unitDisplay: 'narrow' });
            
            expect(typeof longResult).toBe('string');
            expect(typeof shortResult).toBe('string');
            expect(typeof narrowResult).toBe('string');
        });

        it('should handle listStyle options', () => {
            const duration = { hours: 1, minutes: 30, seconds: 45 };
            
            const longStyle = atemporal.humanize(duration, { listStyle: 'long' });
            const shortStyle = atemporal.humanize(duration, { listStyle: 'short' });
            const narrowStyle = atemporal.humanize(duration, { listStyle: 'narrow' });
            
            expect(typeof longStyle).toBe('string');
            expect(typeof shortStyle).toBe('string');
            expect(typeof narrowStyle).toBe('string');
        });
    });

    describe('Relative Time Edge Cases', () => {
        it('should handle very large time differences', () => {
            const now = atemporal('2023-10-27T10:00:00Z');
            const veryPast = now.subtract(1000, 'year');
            const veryFuture = now.add(1000, 'year');
            
            expect(typeof veryPast.fromNow()).toBe('string');
            expect(typeof veryFuture.fromNow()).toBe('string');
            expect(typeof veryPast.toNow()).toBe('string');
            expect(typeof veryFuture.toNow()).toBe('string');
        });

        it('should handle edge cases around time boundaries', () => {
            const now = atemporal('2023-10-27T10:00:00Z');
            
            // Test exactly 1 second, minute, hour, day, etc.
            const oneSecondAgo = now.subtract(1, 'second');
            const oneMinuteAgo = now.subtract(1, 'minute');
            const oneHourAgo = now.subtract(1, 'hour');
            const oneDayAgo = now.subtract(1, 'day');
            const oneMonthAgo = now.subtract(1, 'month');
            const oneYearAgo = now.subtract(1, 'year');
            
            expect(oneSecondAgo.fromNow()).toBe('1 second ago');
            expect(oneMinuteAgo.fromNow()).toBe('1 minute ago');
            expect(oneHourAgo.fromNow()).toBe('1 hour ago');
            expect(oneDayAgo.fromNow()).toBe('yesterday');
            expect(oneMonthAgo.fromNow()).toBe('last month');
            expect(oneYearAgo.fromNow()).toBe('last year');
        });

        it('should handle millisecond precision', () => {
            const now = atemporal('2023-10-27T10:00:00.000Z');
            const almostNow = atemporal('2023-10-27T10:00:00.500Z');
            
            expect(typeof now.fromNow()).toBe('string');
            expect(typeof almostNow.fromNow()).toBe('string');
        });

        it('should handle timezone differences in relative time', () => {
            const utcTime = atemporal('2023-10-27T10:00:00Z');
            const estTime = atemporal('2023-10-27T06:00:00-04:00');
            
            expect(typeof utcTime.fromNow()).toBe('string');
            expect(typeof estTime.fromNow()).toBe('string');
        });
    });

    describe('Week Day Plugin Edge Cases', () => {
        it('should handle all possible week start days', () => {
            const wednesday = atemporal('2024-08-14T12:00:00Z');
            
            for (let startDay = 0; startDay <= 6; startDay++) {
                atemporal.setWeekStartsOn(startDay as 0 | 1 | 2 | 3 | 4 | 5 | 6);
                
                const weekday = wednesday.weekday();
                const startOfWeek = wednesday.startOf('week');
                const endOfWeek = wednesday.endOf('week');
                
                expect(typeof weekday).toBe('number');
                expect(weekday).toBeGreaterThanOrEqual(0);
                expect(weekday).toBeLessThanOrEqual(6);
                expect(startOfWeek.isValid()).toBe(true);
                expect(endOfWeek.isValid()).toBe(true);
            }
        });

        it('should handle invalid week start day values', () => {
            atemporal.setWeekStartsOn(1); // Set to valid value first
            const wednesday = atemporal('2024-08-14T12:00:00Z');
            const initialWeekday = wednesday.weekday();
            
            // Try invalid values
            atemporal.setWeekStartsOn(-1 as any);
            expect(wednesday.weekday()).toBe(initialWeekday); // Should remain unchanged
            
            atemporal.setWeekStartsOn(7 as any);
            expect(wednesday.weekday()).toBe(initialWeekday); // Should remain unchanged
            
            atemporal.setWeekStartsOn(NaN as any);
            expect(wednesday.weekday()).toBe(initialWeekday); // Should remain unchanged
        });

        it('should handle leap year boundaries', () => {
            atemporal.setWeekStartsOn(1);
            
            // Test around leap year boundary
            const leapYearEnd = atemporal('2024-02-29T12:00:00Z');
            const nextDay = atemporal('2024-03-01T12:00:00Z');
            
            expect(typeof leapYearEnd.weekday()).toBe('number');
            expect(typeof nextDay.weekday()).toBe('number');
            expect(leapYearEnd.startOf('week').isValid()).toBe(true);
            expect(nextDay.endOf('week').isValid()).toBe(true);
        });

        it('should handle year boundaries', () => {
            atemporal.setWeekStartsOn(1);
            
            const yearEnd = atemporal('2023-12-31T12:00:00Z');
            const yearStart = atemporal('2024-01-01T12:00:00Z');
            
            expect(typeof yearEnd.weekday()).toBe('number');
            expect(typeof yearStart.weekday()).toBe('number');
            expect(yearEnd.startOf('week').isValid()).toBe(true);
            expect(yearStart.endOf('week').isValid()).toBe(true);
        });
    });

    describe('TemporalUtils Edge Cases', () => {
        it('should handle LRUCache resize interval edge cases', () => {
            const { LRUCache } = TemporalUtils as any;
            if (LRUCache) {
                const cache = new LRUCache(10);
                
                // Test with very small interval
                cache.setResizeInterval(1);
                expect(cache.getMetrics().resizeInterval).toBe(1);
                
                // Test with very large interval
                cache.setResizeInterval(999999);
                expect(cache.getMetrics().resizeInterval).toBe(999999);
                
                // Test with zero interval
                cache.setResizeInterval(0);
                expect(cache.getMetrics().resizeInterval).toBe(0);
            }
        });

        it('should handle cache optimization edge cases', () => {
            const { CacheOptimizer } = TemporalUtils as any;
            if (CacheOptimizer) {
                // Test with extreme hit ratios
                const perfectHitMetrics = {
                    hits: 1000,
                    misses: 0,
                    hitRatio: 1.0,
                    size: 100
                };
                
                const noHitMetrics = {
                    hits: 0,
                    misses: 1000,
                    hitRatio: 0.0,
                    size: 100
                };
                
                const perfectResult = CacheOptimizer.calculateOptimalSize(perfectHitMetrics, 200);
                const noHitResult = CacheOptimizer.calculateOptimalSize(noHitMetrics, 200);
                
                expect(typeof perfectResult).toBe('number');
                expect(typeof noHitResult).toBe('number');
                expect(perfectResult).toBeGreaterThan(0);
                expect(noHitResult).toBeGreaterThan(0);
            }
        });

        it('should handle locale validation edge cases', () => {
            const { LocaleUtils } = TemporalUtils as any;
            if (LocaleUtils) {
                // Test with various invalid inputs
                expect(LocaleUtils.validateAndNormalize(null)).toBe('en');
                expect(LocaleUtils.validateAndNormalize(undefined)).toBe('en');
                expect(LocaleUtils.validateAndNormalize(123)).toBe('en');
                expect(LocaleUtils.validateAndNormalize({})).toBe('en');
                expect(LocaleUtils.validateAndNormalize('')).toBe('en');
                
                // Test with underscore format
                expect(LocaleUtils.validateAndNormalize('en_US')).toBe('en-US');
                expect(LocaleUtils.validateAndNormalize('es_ES')).toBe('es-ES');
                
                // Test base language extraction
                expect(LocaleUtils.getBaseLanguage('en-US')).toBe('en');
                expect(LocaleUtils.getBaseLanguage('es_ES')).toBe('es');
                expect(LocaleUtils.getBaseLanguage('fr')).toBe('fr');
                
                // Test locale support checking
                expect(LocaleUtils.isSupported('en')).toBe(true);
                expect(LocaleUtils.isSupported('xyz-INVALID')).toBe(false);
            }
        });

        it('should handle global cache coordinator edge cases', () => {
            const { GlobalCacheCoordinator } = TemporalUtils as any;
            if (GlobalCacheCoordinator) {
                // Test cache registration
                const mockCache = {
                    clear: jest.fn(),
                    getStats: jest.fn(() => ({ size: 0 }))
                };
                
                GlobalCacheCoordinator.registerCache('test-cache', mockCache);
                
                // Test clearing all caches
                GlobalCacheCoordinator.clearAll();
                expect(mockCache.clear).toHaveBeenCalled();
                
                // Test getting all stats
                const allStats = GlobalCacheCoordinator.getAllStats();
                expect(typeof allStats).toBe('object');
                expect(allStats).toHaveProperty('intl');
                expect(allStats).toHaveProperty('diff');
                expect(allStats).toHaveProperty('plugins');
                expect(allStats).toHaveProperty('total');
                
                // Test optimization
                expect(() => GlobalCacheCoordinator.optimizeAll()).not.toThrow();
                
                // Test cache size setting
                expect(() => GlobalCacheCoordinator.setMaxCacheSizes({ intl: 50, diff: 25 })).not.toThrow();
                
                // Test dynamic sizing
                expect(() => GlobalCacheCoordinator.setDynamicSizing(false)).not.toThrow();
                expect(() => GlobalCacheCoordinator.setDynamicSizing(true)).not.toThrow();
            }
        });
    });

    describe('Custom Parse Format Edge Cases', () => {
        it('should handle invalid format strings', () => {
            expect(atemporal.fromFormat('2024-01-01', '').isValid()).toBe(false);
            expect(atemporal.fromFormat('2024-01-01', null as any).isValid()).toBe(false);
            expect(atemporal.fromFormat('2024-01-01', undefined as any).isValid()).toBe(false);
        });

        it('should handle edge case date formats', () => {
            // Test with various separators
            expect(atemporal.fromFormat('2024.01.01', 'YYYY.MM.DD').isValid()).toBe(true);
            expect(atemporal.fromFormat('2024 01 01', 'YYYY MM DD').isValid()).toBe(true);
            expect(atemporal.fromFormat('01012024', 'MMDDYYYY').isValid()).toBe(true);
            
            // Test with time components
            expect(atemporal.fromFormat('2024-01-01T14:30:45', 'YYYY-MM-DDTHH:mm:ss').isValid()).toBe(true);
            expect(atemporal.fromFormat('14:30:45', 'HH:mm:ss').isValid()).toBe(true);
        });

        it('should handle partial date formats', () => {
            const yearOnly = atemporal.fromFormat('2024', 'YYYY');
            const monthYear = atemporal.fromFormat('01/2024', 'MM/YYYY');
            
            expect(yearOnly.isValid()).toBe(true);
            expect(monthYear.isValid()).toBe(true);
        });
    });

    describe('Advanced Format Edge Cases', () => {
        it('should handle all advanced format tokens', () => {
            const date = atemporal('2024-08-14T15:30:45.123Z');
            
            // Test various format tokens that might not be covered
            const formats = [
                'Q', 'Qo', 'QQ', 'QQQ', 'QQQQ', // Quarter
                'w', 'wo', 'ww', // Week of year
                'W', 'Wo', 'WW', // Week of year (ISO)
                'k', 'kk', // Hour (1-24)
                'X', 'x', // Unix timestamp
                'E', 'EE', 'EEE', 'EEEE', // Day of week
                'gggg', 'GGGG', // Week year
                'A', 'a' // AM/PM
            ];
            
            formats.forEach(format => {
                const result = date.format(format);
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
        });

        it('should handle format with invalid date', () => {
            const invalidDate = atemporal('invalid');
            expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
            expect(invalidDate.format('Q')).toBe('Invalid Date');
            expect(invalidDate.format('X')).toBe('Invalid Date');
        });

        it('should handle complex format combinations', () => {
            const date = atemporal('2024-08-14T15:30:45.123Z');
            
            const complexFormats = [
                'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]',
                '[Today is] dddd, MMMM Do, YYYY',
                'Q[Q] YYYY [Week] w',
                'X [seconds since epoch]',
                'GGGG-[W]WW-E'
            ];
            
            complexFormats.forEach(format => {
                const result = date.format(format);
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle plugin extension errors gracefully', () => {
            // Test extending with invalid plugin - these should throw errors
            expect(() => {
                atemporal.extend(null as any);
            }).toThrow();
            
            expect(() => {
                atemporal.extend(undefined as any);
            }).toThrow();
            
            expect(() => {
                atemporal.extend({} as any);
            }).toThrow();
        });

        it('should handle memory pressure scenarios', () => {
            // Generate many cache entries to test memory management
            for (let i = 0; i < 1000; i++) {
                const date = atemporal(`2024-01-${(i % 28) + 1}T12:00:00Z`);
                date.format('YYYY-MM-DD');
                date.fromNow();
                atemporal.humanize({ hours: i % 24 });
            }
            
            // Verify caches are still functional
            const testDate = atemporal('2024-01-15T12:00:00Z');
            expect(testDate.format('YYYY-MM-DD')).toBe('2024-01-15');
            expect(typeof testDate.fromNow()).toBe('string');
            expect(typeof atemporal.humanize({ hours: 2 })).toBe('string');
        });

        it('should handle concurrent operations', () => {
            // Simulate concurrent operations
            const promises = [];
            
            for (let i = 0; i < 100; i++) {
                promises.push(Promise.resolve().then(() => {
                    const date = atemporal(`2024-01-${(i % 28) + 1}T12:00:00Z`);
                    return {
                        format: date.format('YYYY-MM-DD'),
                        relative: date.fromNow(),
                        humanized: atemporal.humanize({ hours: i % 24 })
                    };
                }));
            }
            
            return Promise.all(promises).then(results => {
                expect(results).toHaveLength(100);
                results.forEach(result => {
                    expect(typeof result.format).toBe('string');
                    expect(typeof result.relative).toBe('string');
                    expect(typeof result.humanized).toBe('string');
                });
            });
        });
    });
});