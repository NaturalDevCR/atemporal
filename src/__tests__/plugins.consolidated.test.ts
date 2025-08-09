import atemporal from '../index';
import durationHumanizer from '../plugins/durationHumanizer';
import relativeTimePlugin from '../plugins/relativeTime';
import weekDayPlugin from '../plugins/weekDay';
import customParseFormat from '../plugins/customParseFormat';

// Extend atemporal with all plugins for comprehensive testing
atemporal.extend(durationHumanizer);
atemporal.extend(relativeTimePlugin);
atemporal.extend(weekDayPlugin);
atemporal.extend(customParseFormat);

/**
 * Consolidated Plugin Test Suite
 * 
 * This file consolidates tests from:
 * - durationHumanizer.test.ts
 * - relativeTime.tests.ts
 * - weekDay.test.ts
 * - plugins.test.ts
 * 
 * Provides comprehensive coverage for all plugin functionality with unified patterns
 */
describe('Plugins: Consolidated Test Suite', () => {
    // Common test constants
    const MOCK_NOW_ISO = '2023-10-27T10:00:00Z';
    const WEDNESDAY_ISO = '2024-08-14T12:00:00Z';

    beforeEach(() => {
        // Set up consistent test environment
        jest.useFakeTimers().setSystemTime(new Date(MOCK_NOW_ISO));
        atemporal.setDefaultLocale('en-US');
        atemporal.setWeekStartsOn(1); // Reset to Monday
        
        // Clear caches for clean state
        if ((atemporal as any).clearDurationHumanizerCache) {
            (atemporal as any).clearDurationHumanizerCache();
        }
    });

    afterEach(() => {
        jest.useRealTimers();
        atemporal.setWeekStartsOn(1); // Reset to default
    });

    describe('Duration Humanizer Plugin', () => {
        describe('Core Functionality', () => {
            it('should humanize simple durations with proper pluralization', () => {
                expect(atemporal.humanize({ hours: 1, minutes: 30 })).toBe('1 hour and 30 minutes');
                expect(atemporal.humanize({ years: 2, days: 5 })).toBe('2 years and 5 days');
                expect(atemporal.humanize({ days: 1 })).toBe('1 day');
                expect(atemporal.humanize({ seconds: 1 })).toBe('1 second');
                expect(atemporal.humanize({ minutes: 0 })).toBe('0 seconds');
            });

            it('should handle complex durations with multiple units', () => {
                const complexDuration = { 
                    years: 1, 
                    months: 2, 
                    days: 3, 
                    hours: 4 
                };
                expect(atemporal.humanize(complexDuration, { locale: 'en-US' }))
                    .toBe('1 year, 2 months, 3 days, and 4 hours');
            });

            it('should handle all duration units comprehensively', () => {
                const allUnits = { 
                    years: 1, 
                    months: 2, 
                    weeks: 3, 
                    days: 4, 
                    hours: 5, 
                    minutes: 6, 
                    seconds: 7, 
                    milliseconds: 8 
                };
                const result = atemporal.humanize(allUnits);
                
                expect(result).toContain('1 year');
                expect(result).toContain('2 months');
                expect(result).toContain('3 weeks');
                expect(result).toContain('4 days');
                expect(result).toContain('5 hours');
                expect(result).toContain('6 minutes');
                expect(result).toContain('7 seconds');
                expect(result).toContain('8 milliseconds');
            });
        });

        describe('Enhanced Caching System', () => {
            it('should cache duration formatting results effectively', () => {
                const duration = { hours: 2, minutes: 30 };
                
                // First call generates and caches
                const result1 = atemporal.humanize(duration);
                expect(result1).toBe('2 hours and 30 minutes');
                
                // Second call uses cache
                const result2 = atemporal.humanize(duration);
                expect(result2).toBe('2 hours and 30 minutes');
                
                // Verify cache population
                const stats = (atemporal as any).getDurationHumanizerCacheStats();
                expect(stats.durationFormat.size).toBeGreaterThan(0);
            });

            it('should cache results separately for different locales', () => {
                const duration = { hours: 1 };
                
                const resultEn = atemporal.humanize(duration, { locale: 'en' });
                const resultEs = atemporal.humanize(duration, { locale: 'es' });
                
                expect(resultEn).toBe('1 hour');
                expect(resultEs).toContain('hora');
                
                const stats = (atemporal as any).getDurationHumanizerCacheStats();
                expect(stats.durationFormat.size).toBeGreaterThan(1);
            });

            it('should respect LRU cache size limits', () => {
                // Generate many different formats to test eviction
                for (let i = 1; i <= 250; i++) {
                    atemporal.humanize({ hours: i });
                }
                
                const stats = (atemporal as any).getDurationHumanizerCacheStats();
                expect(stats.durationFormat.size).toBeLessThanOrEqual(stats.durationFormat.maxSize);
            });

            it('should clear cache when requested', () => {
                atemporal.humanize({ hours: 1 });
                
                let stats = (atemporal as any).getDurationHumanizerCacheStats();
                expect(stats.durationFormat.size).toBeGreaterThan(0);
                
                (atemporal as any).clearDurationHumanizerCache();
                
                stats = (atemporal as any).getDurationHumanizerCacheStats();
                expect(stats.durationFormat.size).toBe(0);
            });
        });

        describe('Multi-Language Support', () => {
            const testCases = [
                { locale: 'es', duration: { hours: 2, minutes: 1 }, expected: ['hora', 'minuto'] },
                { locale: 'fr', duration: { hours: 1, minutes: 30 }, expected: ['heure', 'minute'] },
                { locale: 'de', duration: { hours: 2, minutes: 15 }, expected: ['Stunde', 'Minute'] },
                { locale: 'it', duration: { hours: 3, minutes: 45 }, expected: ['ore', 'minuti'] },
                { locale: 'pt', duration: { hours: 1, minutes: 20 }, expected: ['hora', 'minuto'] },
                { locale: 'ru', duration: { hours: 2, minutes: 30 }, expected: ['час', 'минут'] },
                { locale: 'ja', duration: { hours: 1, minutes: 15 }, expected: ['時間', '分'] },
                { locale: 'ko', duration: { hours: 2, minutes: 45 }, expected: ['시간', '분'] },
                { locale: 'zh', duration: { hours: 3, minutes: 30 }, expected: ['小时', '分钟'] }
            ];

            testCases.forEach(({ locale, duration, expected }) => {
                it(`should handle ${locale} localization`, () => {
                    const result = atemporal.humanize(duration, { locale });
                    expected.forEach(term => {
                        expect(result).toContain(term);
                    });
                });
            });

            it('should normalize underscore locale formats', () => {
                const duration = { hours: 1 };
                const result1 = atemporal.humanize(duration, { locale: 'en_US' });
                const result2 = atemporal.humanize(duration, { locale: 'en-US' });
                expect(result1).toBe(result2);
            });

            it('should fallback gracefully for unsupported locales', () => {
                const duration = { hours: 1 };
                
                // Fallback to base language
                const result1 = atemporal.humanize(duration, { locale: 'en-INVALID' });
                expect(result1).toBe('1 hour');
                
                // Fallback to English for completely unsupported
                const result2 = atemporal.humanize(duration, { locale: 'xyz-ABC' });
                expect(result2).toBe('1 hour');
            });
        });

        describe('Error Handling', () => {
            it('should handle invalid durations gracefully', () => {
                expect(() => atemporal.humanize(null as any)).not.toThrow();
                expect(() => atemporal.humanize(undefined as any)).not.toThrow();
                expect(() => atemporal.humanize({} as any)).not.toThrow();
                expect(() => atemporal.humanize({ invalid: 'unit' } as any)).not.toThrow();
            });

            it('should handle invalid locale gracefully', () => {
                const duration = { hours: 1 };
                expect(() => atemporal.humanize(duration, { locale: null as any })).not.toThrow();
                expect(() => atemporal.humanize(duration, { locale: 123 as any })).not.toThrow();
            });
        });
    });

    describe('Relative Time Plugin', () => {
        describe('fromNow() Method', () => {
            it('should handle past times correctly', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.subtract(5, 'second').fromNow()).toBe('5 seconds ago');
                expect(now.subtract(1, 'minute').fromNow()).toBe('1 minute ago');
                expect(now.subtract(10, 'minute').fromNow()).toBe('10 minutes ago');
                expect(now.subtract(1, 'hour').fromNow()).toBe('1 hour ago');
                expect(now.subtract(3, 'hour').fromNow()).toBe('3 hours ago');
                expect(now.subtract(1, 'day').fromNow()).toBe('yesterday');
                expect(now.subtract(5, 'day').fromNow()).toBe('5 days ago');
                expect(now.subtract(1, 'month').fromNow()).toBe('last month');
                expect(now.subtract(4, 'month').fromNow()).toBe('4 months ago');
                expect(now.subtract(1, 'year').fromNow()).toBe('last year');
                expect(now.subtract(2, 'year').fromNow()).toBe('2 years ago');
            });

            it('should handle future times correctly', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.add(5, 'second').fromNow()).toBe('in 5 seconds');
                expect(now.add(1, 'minute').fromNow()).toBe('in 1 minute');
                expect(now.add(1, 'hour').fromNow()).toBe('in 1 hour');
                expect(now.add(1, 'day').fromNow()).toBe('tomorrow');
                expect(now.add(4, 'month').fromNow()).toBe('in 4 months');
                expect(now.add(2, 'year').fromNow()).toBe('in 2 years');
            });

            it('should handle withoutSuffix option for past times', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.subtract(15, 'minute').fromNow(true)).toBe('15 minutes');
                expect(now.subtract(2, 'day').fromNow(true)).toBe('2 days');
                expect(now.subtract(1, 'year').fromNow(true)).toBe('1 year');
            });

            it('should handle withoutSuffix option for future times', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.add(15, 'minute').fromNow(true)).toBe('15 minutes');
                expect(now.add(2, 'day').fromNow(true)).toBe('2 days');
                expect(now.add(1, 'year').fromNow(true)).toBe('1 year');
            });

            it('should return "Invalid Date" for invalid instances', () => {
                const invalidDate = atemporal('not a real date');
                expect(invalidDate.fromNow()).toBe('Invalid Date');
                expect(invalidDate.fromNow(true)).toBe('Invalid Date');
            });
        });

        describe('toNow() Method', () => {
            it('should handle past times correctly (inverse of fromNow)', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.subtract(5, 'second').toNow()).toBe('in 5 seconds');
                expect(now.subtract(1, 'minute').toNow()).toBe('in 1 minute');
                expect(now.subtract(3, 'hour').toNow()).toBe('in 3 hours');
                expect(now.subtract(1, 'day').toNow()).toBe('tomorrow');
                expect(now.subtract(2, 'year').toNow()).toBe('in 2 years');
            });

            it('should handle future times correctly (inverse of fromNow)', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.add(5, 'second').toNow()).toBe('5 seconds ago');
                expect(now.add(1, 'minute').toNow()).toBe('1 minute ago');
                expect(now.add(1, 'hour').toNow()).toBe('1 hour ago');
                expect(now.add(1, 'day').toNow()).toBe('yesterday');
                expect(now.add(2, 'year').toNow()).toBe('2 years ago');
            });

            it('should handle withoutSuffix option', () => {
                const now = atemporal(MOCK_NOW_ISO);
                
                expect(now.subtract(15, 'minute').toNow(true)).toBe('15 minutes');
                expect(now.add(15, 'minute').toNow(true)).toBe('15 minutes');
            });

            it('should return "Invalid Date" for invalid instances', () => {
                const invalidDate = atemporal('not a real date');
                expect(invalidDate.toNow()).toBe('Invalid Date');
                expect(invalidDate.toNow(true)).toBe('Invalid Date');
            });
        });

        describe('Integration with Current Time', () => {
            it('should work with real-time scenarios', () => {
                jest.useRealTimers();
                
                const twoHoursAgo = atemporal().subtract(2, 'hour');
                expect(twoHoursAgo.fromNow()).toBe('2 hours ago');
                
                const inThreeDays = atemporal().add(3, 'day');
                expect(inThreeDays.fromNow(true)).toBe('3 days');
                
                jest.useFakeTimers().setSystemTime(new Date(MOCK_NOW_ISO));
            });
        });
    });

    describe('Week Day Plugin', () => {
        describe('Configuration: setWeekStartsOn()', () => {
            it('should allow setting week start to Sunday (0)', () => {
                atemporal.setWeekStartsOn(0);
                const date = atemporal(WEDNESDAY_ISO); // Wednesday
                // With week starting on Sunday, Wednesday is the 3rd day (0-indexed)
                expect(date.weekday()).toBe(3);
            });

            it('should allow setting week start to Saturday (6)', () => {
                atemporal.setWeekStartsOn(6);
                const date = atemporal(WEDNESDAY_ISO); // Wednesday
                // With week starting on Saturday, Wednesday is the 4th day (0-indexed)
                expect(date.weekday()).toBe(4);
            });

            it('should ignore invalid day numbers', () => {
                atemporal.setWeekStartsOn(1); // Start with Monday
                atemporal.setWeekStartsOn(7 as any); // Invalid
                const date = atemporal(WEDNESDAY_ISO);
                // Should still be based on Monday (day 2)
                expect(date.weekday()).toBe(2);

                atemporal.setWeekStartsOn(-1 as any); // Invalid
                expect(date.weekday()).toBe(2);
            });

            it('should handle all valid week start days', () => {
                const wednesday = atemporal(WEDNESDAY_ISO);
                
                for (let startDay = 0; startDay <= 6; startDay++) {
                    atemporal.setWeekStartsOn(startDay as 0 | 1 | 2 | 3 | 4 | 5 | 6);
                    const weekday = wednesday.weekday();
                    expect(weekday).toBeGreaterThanOrEqual(0);
                    expect(weekday).toBeLessThanOrEqual(6);
                }
            });
        });

        describe('weekday() Method', () => {
            it('should return correct day with default setting (Monday=0)', () => {
                atemporal.setWeekStartsOn(1); // Monday is the start
                
                expect(atemporal('2024-08-12').weekday()).toBe(0); // Monday
                expect(atemporal('2024-08-14').weekday()).toBe(2); // Wednesday
                expect(atemporal('2024-08-18').weekday()).toBe(6); // Sunday
            });

            it('should return correct day when week starts on Sunday (Sunday=0)', () => {
                atemporal.setWeekStartsOn(0); // Sunday is the start
                
                expect(atemporal('2024-08-11').weekday()).toBe(0); // Sunday
                expect(atemporal('2024-08-12').weekday()).toBe(1); // Monday
                expect(atemporal('2024-08-14').weekday()).toBe(3); // Wednesday
            });

            it('should handle edge cases and boundary conditions', () => {
                atemporal.setWeekStartsOn(1); // Monday start
                
                // Test year boundaries
                expect(atemporal('2023-12-31').weekday()).toBe(6); // Sunday
                expect(atemporal('2024-01-01').weekday()).toBe(0); // Monday
                
                // Test month boundaries
                expect(atemporal('2024-01-31').weekday()).toBe(2); // Wednesday
                expect(atemporal('2024-02-01').weekday()).toBe(3); // Thursday
            });
        });

        describe('startOf("week") Method', () => {
            it('should find the previous Monday with default settings', () => {
                const date = atemporal(WEDNESDAY_ISO); // 2024-08-14
                const startOfWeek = date.startOf('week');
                
                expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-08-12'); // Previous Monday
                expect(startOfWeek.hour).toBe(0);
                expect(startOfWeek.minute).toBe(0);
                expect(startOfWeek.second).toBe(0);
                expect(startOfWeek.millisecond).toBe(0);
            });

            it('should find the previous Sunday when week starts on Sunday', () => {
                atemporal.setWeekStartsOn(0); // Sunday start
                const date = atemporal(WEDNESDAY_ISO); // 2024-08-14
                const startOfWeek = date.startOf('week');
                
                expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-08-11'); // Previous Sunday
            });

            it('should return the same day if it is the start of the week', () => {
                atemporal.setWeekStartsOn(0);
                const sunday = atemporal('2024-08-11T12:00:00Z');
                const startOfWeek = sunday.startOf('week');
                
                expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-08-11');
                expect(startOfWeek.hour).toBe(0); // Should reset time
            });
        });

        describe('endOf("week") Method', () => {
            it('should find the next Sunday with default settings', () => {
                const date = atemporal(WEDNESDAY_ISO); // 2024-08-14
                const endOfWeek = date.endOf('week');
                
                expect(endOfWeek.format('YYYY-MM-DD')).toBe('2024-08-18'); // Next Sunday
                expect(endOfWeek.format('HH:mm:ss.SSS')).toBe('23:59:59.999');
            });

            it('should find the next Saturday when week starts on Sunday', () => {
                atemporal.setWeekStartsOn(0);
                const date = atemporal(WEDNESDAY_ISO); // 2024-08-14
                const endOfWeek = date.endOf('week');
                
                expect(endOfWeek.format('YYYY-MM-DD')).toBe('2024-08-17'); // Next Saturday
            });

            it('should handle end of week when already at end', () => {
                atemporal.setWeekStartsOn(1); // Monday start, so Sunday is end
                const sunday = atemporal('2024-08-18T12:00:00Z');
                const endOfWeek = sunday.endOf('week');
                
                expect(endOfWeek.format('YYYY-MM-DD')).toBe('2024-08-18');
                expect(endOfWeek.format('HH:mm:ss.SSS')).toBe('23:59:59.999');
            });
        });

        describe('Plugin Delegation and Integration', () => {
            it('should not affect startOf for other units', () => {
                atemporal.setWeekStartsOn(0); // Change week setting
                const date = atemporal('2024-08-14T12:30:45Z');
                
                expect(date.startOf('month').format('YYYY-MM-DD')).toBe('2024-08-01');
                expect(date.startOf('year').format('YYYY-MM-DD')).toBe('2024-01-01');
                expect(date.startOf('day').format('HH:mm:ss')).toBe('00:00:00');
            });

            it('should not affect endOf for other units', () => {
                atemporal.setWeekStartsOn(0); // Change week setting
                const date = atemporal('2024-02-15T12:00:00Z'); // Leap year
                
                expect(date.endOf('month').format('YYYY-MM-DD')).toBe('2024-02-29');
                expect(date.endOf('year').format('YYYY-MM-DD')).toBe('2024-12-31');
            });
        });

        describe('Invalid Instance Handling', () => {
            const invalidDate = atemporal('invalid');

            it('should return NaN from weekday() for invalid instance', () => {
                expect(invalidDate.weekday()).toBeNaN();
            });

            it('should return same invalid instance from startOf("week")', () => {
                expect(invalidDate.startOf('week')).toBe(invalidDate);
            });

            it('should return same invalid instance from endOf("week")', () => {
                expect(invalidDate.endOf('week')).toBe(invalidDate);
            });
        });
    });

    describe('Custom Parse Format Plugin', () => {
        describe('fromFormat() Method', () => {
            it('should parse dates with custom formats', () => {
                const date = atemporal.fromFormat('15/03/2025 10:30', 'DD/MM/YYYY HH:mm');
                
                expect(date.isValid()).toBe(true);
                expect(date.year).toBe(2025);
                expect(date.month).toBe(3);
                expect(date.day).toBe(15);
                expect(date.hour).toBe(10);
                expect(date.minute).toBe(30);
            });

            it('should return invalid instance for mismatched format', () => {
                const date = atemporal.fromFormat('2025-03-15', 'DD/MM/YYYY');
                expect(date.isValid()).toBe(false);
            });

            it('should handle various date formats', () => {
                const testCases = [
                    { input: '2024-12-25', format: 'YYYY-MM-DD', expected: { year: 2024, month: 12, day: 25 } },
                    { input: '25/12/2024', format: 'DD/MM/YYYY', expected: { year: 2024, month: 12, day: 25 } },
                    { input: '12-25-2024', format: 'MM-DD-YYYY', expected: { year: 2024, month: 12, day: 25 } },
                    { input: '2024/12/25 14:30', format: 'YYYY/MM/DD HH:mm', expected: { year: 2024, month: 12, day: 25, hour: 14, minute: 30 } }
                ];

                testCases.forEach(({ input, format, expected }) => {
                    const date = atemporal.fromFormat(input, format);
                    expect(date.isValid()).toBe(true);
                    expect(date.year).toBe(expected.year);
                    expect(date.month).toBe(expected.month);
                    expect(date.day).toBe(expected.day);
                    if (expected.hour !== undefined) expect(date.hour).toBe(expected.hour);
                    if (expected.minute !== undefined) expect(date.minute).toBe(expected.minute);
                });
            });
        });
    });

    describe('Plugin Integration and Cross-Plugin Functionality', () => {
        it('should work with multiple plugins simultaneously', () => {
            // Use custom parse format to create a date
            const date = atemporal.fromFormat('15/03/2024 10:30', 'DD/MM/YYYY HH:mm');
            expect(date.isValid()).toBe(true);
            
            // Use relative time plugin
            const relativeTime = date.fromNow();
            expect(typeof relativeTime).toBe('string');
            
            // Use week day plugin
            const weekday = date.weekday();
            expect(typeof weekday).toBe('number');
            
            // Use duration humanizer
            const duration = { hours: 2, minutes: 30 };
            const humanized = atemporal.humanize(duration);
            expect(humanized).toBe('2 hours and 30 minutes');
        });

        it('should maintain plugin isolation and not interfere with each other', () => {
            // Set week start day
            atemporal.setWeekStartsOn(0);
            
            // Use duration humanizer with different locale
            const duration = { hours: 1 };
            const humanizedEs = atemporal.humanize(duration, { locale: 'es' });
            expect(humanizedEs).toContain('hora');
            
            // Week day plugin should still work with Sunday start
            const date = atemporal(WEDNESDAY_ISO);
            expect(date.weekday()).toBe(3); // Wednesday with Sunday start
            
            // Relative time should still work
            const relativeTime = date.fromNow();
            expect(typeof relativeTime).toBe('string');
        });

        it('should handle plugin method chaining', () => {
            const date = atemporal('2024-08-14T12:00:00Z')
                .startOf('week')
                .add(2, 'day');
            
            expect(date.isValid()).toBe(true);
            expect(date.weekday()).toBe(2); // Should be Wednesday
            
            const relativeTime = date.fromNow();
            expect(typeof relativeTime).toBe('string');
        });
    });

    describe('Performance and Caching Across Plugins', () => {
        it('should maintain good performance with heavy plugin usage', () => {
            const startTime = performance.now();
            
            // Heavy usage of all plugins
            for (let i = 0; i < 100; i++) {
                const date = atemporal(`2024-01-${(i % 28) + 1}T12:00:00Z`);
                
                // Use all plugin methods
                date.fromNow();
                date.weekday();
                atemporal.humanize({ hours: i % 24, minutes: i % 60 });
                
                if (i % 10 === 0) {
                    atemporal.fromFormat(`${i + 1}/01/2024`, 'DD/MM/YYYY');
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time (adjust threshold as needed)
            expect(duration).toBeLessThan(1000); // 1 second
        });

        it('should show cache effectiveness across plugins', () => {
            // Generate cache entries
            for (let i = 0; i < 50; i++) {
                atemporal.humanize({ hours: i % 5, minutes: i % 10 });
            }
            
            const stats = (atemporal as any).getDurationHumanizerCacheStats();
            expect(stats.durationFormat.size).toBeGreaterThan(0);
            expect(stats.durationFormat.size).toBeLessThanOrEqual(stats.durationFormat.maxSize);
        });
    });
});