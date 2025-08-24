/**
 * @file Comprehensive tests for legacy-formatter module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
    createTokenReplacements,
    legacyFormat,
    getTokenRegex,
    clearLegacyFormattingCache
} from '../../../core/formatting/legacy-formatter';
import { RegexCache } from '../../../RegexCache';
import { TemporalUtils } from '../../../TemporalUtils';
import type { FormatTokenMap } from '../../../types';

// Mock dependencies
jest.mock('../../../RegexCache');
jest.mock('../../../TemporalUtils');

const MockedRegexCache = RegexCache as jest.Mocked<typeof RegexCache>;
const MockedTemporalUtils = TemporalUtils as jest.Mocked<typeof TemporalUtils>;

// Mock instance for testing
const createMockInstance = (overrides: any = {}) => ({
    year: 2024,
    month: 3,
    day: 15,
    hour: 14,
    minute: 30,
    second: 45,
    millisecond: 123,
    raw: {
        dayOfWeek: 5, // Friday
        offset: '+05:00',
        timeZoneId: 'Asia/Karachi',
        toLocaleString: jest.fn((locale: string, options: any) => {
            if (options?.month === 'long') return 'March';
            if (options?.month === 'short') return 'Mar';
            if (options?.weekday === 'long') return 'Friday';
            if (options?.weekday === 'short') return 'Fri';
            if (options?.weekday === 'narrow') return 'F';
            return 'default';
        })
    },
    ...overrides
});

describe('legacy-formatter', () => {
    let mockInstance: any;
    let mockRegex: RegExp;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock regex - must match the actual regex from RegexCache
        mockRegex = /\[([^\]]+)]|YYYY|MMMM|dddd|MMM|ddd|YY|MM|DD|HH|hh|mm|ss|SSS|ZZ|dd|(?<!\w)[MDAHhmsZaz](?!\w)/g;
        MockedRegexCache.getPrecompiled.mockReturnValue(mockRegex);
        
        // Setup default locale
        MockedTemporalUtils.getDefaultLocale.mockReturnValue('en-US');
        
        // Create mock instance
        mockInstance = createMockInstance();
    });

    afterEach(() => {
        // Clear any caches between tests
        clearLegacyFormattingCache();
    });

    describe('createTokenReplacements', () => {
        it('should create token replacements for a given instance', () => {
            const replacements = createTokenReplacements(mockInstance);
            
            expect(replacements).toBeDefined();
            expect(typeof replacements).toBe('object');
            expect(Object.keys(replacements).length).toBeGreaterThan(0);
        });

        it('should use provided locale', () => {
            const replacements = createTokenReplacements(mockInstance, 'fr-FR');
            
            expect(replacements).toBeDefined();
            expect(MockedTemporalUtils.getDefaultLocale).not.toHaveBeenCalled();
        });

        it('should use default locale when none provided', () => {
            createTokenReplacements(mockInstance);
            
            expect(MockedTemporalUtils.getDefaultLocale).toHaveBeenCalledTimes(1);
        });

        it('should cache replacements per instance and locale', () => {
            const replacements1 = createTokenReplacements(mockInstance, 'en-US');
            const replacements2 = createTokenReplacements(mockInstance, 'en-US');
            const replacements3 = createTokenReplacements(mockInstance, 'fr-FR');
            
            // Same instance and locale should return same object
            expect(replacements1).toBe(replacements2);
            
            // Different locale should return different object
            expect(replacements1).not.toBe(replacements3);
        });

        it('should create different replacements for different instances', () => {
            const instance2 = createMockInstance({ year: 2025 });
            
            const replacements1 = createTokenReplacements(mockInstance, 'en-US');
            const replacements2 = createTokenReplacements(instance2, 'en-US');
            
            expect(replacements1).not.toBe(replacements2);
        });

        describe('year tokens', () => {
            it('should format YYYY token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.YYYY()).toBe('2024');
            });

            it('should format YY token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.YY()).toBe('24');
            });

            it('should handle different years', () => {
                const instance2023 = createMockInstance({ year: 2023 });
                const replacements = createTokenReplacements(instance2023);
                
                expect(replacements.YYYY()).toBe('2023');
                expect(replacements.YY()).toBe('23');
            });
        });

        describe('month tokens', () => {
            it('should format MMMM token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.MMMM()).toBe('March');
                expect(mockInstance.raw.toLocaleString).toHaveBeenCalledWith('en-US', { month: 'long' });
            });

            it('should format MMM token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.MMM()).toBe('Mar');
                expect(mockInstance.raw.toLocaleString).toHaveBeenCalledWith('en-US', { month: 'short' });
            });

            it('should format MM token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.MM()).toBe('03');
            });

            it('should format M token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.M()).toBe('3');
            });

            it('should handle single-digit months', () => {
                const instanceJan = createMockInstance({ month: 1 });
                const replacements = createTokenReplacements(instanceJan);
                
                expect(replacements.MM()).toBe('01');
                expect(replacements.M()).toBe('1');
            });

            it('should handle double-digit months', () => {
                const instanceDec = createMockInstance({ month: 12 });
                const replacements = createTokenReplacements(instanceDec);
                
                expect(replacements.MM()).toBe('12');
                expect(replacements.M()).toBe('12');
            });
        });

        describe('day tokens', () => {
            it('should format DD token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.DD()).toBe('15');
            });

            it('should format D token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.D()).toBe('15');
            });

            it('should handle single-digit days', () => {
                const instanceDay5 = createMockInstance({ day: 5 });
                const replacements = createTokenReplacements(instanceDay5);
                
                expect(replacements.DD()).toBe('05');
                expect(replacements.D()).toBe('5');
            });
        });

        describe('weekday tokens', () => {
            it('should format dddd token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.dddd()).toBe('Friday');
                expect(mockInstance.raw.toLocaleString).toHaveBeenCalledWith('en-US', { weekday: 'long' });
            });

            it('should format ddd token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.ddd()).toBe('Fri');
                expect(mockInstance.raw.toLocaleString).toHaveBeenCalledWith('en-US', { weekday: 'short' });
            });

            it('should format dd token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.dd()).toBe('F');
                expect(mockInstance.raw.toLocaleString).toHaveBeenCalledWith('en-US', { weekday: 'narrow' });
            });

            it('should format d token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.d()).toBe('5'); // Friday = 5, Sunday = 0
            });

            it('should handle Sunday correctly', () => {
                const instanceSunday = createMockInstance({
                    raw: {
                        ...mockInstance.raw,
                        dayOfWeek: 7 // Sunday in ISO (7), should become 0
                    }
                });
                const replacements = createTokenReplacements(instanceSunday);
                expect(replacements.d()).toBe('0');
            });
        });

        describe('hour tokens', () => {
            it('should format HH token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.HH()).toBe('14');
            });

            it('should format H token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.H()).toBe('14');
            });

            it('should format hh token correctly for PM', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.hh()).toBe('02'); // 14 % 12 = 2, padded
            });

            it('should format h token correctly for PM', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.h()).toBe('2'); // 14 % 12 = 2
            });

            it('should handle midnight correctly', () => {
                const instanceMidnight = createMockInstance({ hour: 0 });
                const replacements = createTokenReplacements(instanceMidnight);
                
                expect(replacements.HH()).toBe('00');
                expect(replacements.H()).toBe('0');
                expect(replacements.hh()).toBe('12'); // 0 % 12 === 0, so show 12
                expect(replacements.h()).toBe('12');
            });

            it('should handle noon correctly', () => {
                const instanceNoon = createMockInstance({ hour: 12 });
                const replacements = createTokenReplacements(instanceNoon);
                
                expect(replacements.HH()).toBe('12');
                expect(replacements.H()).toBe('12');
                expect(replacements.hh()).toBe('12'); // 12 % 12 === 0, so show 12
                expect(replacements.h()).toBe('12');
            });

            it('should handle single-digit hours', () => {
                const instanceMorning = createMockInstance({ hour: 9 });
                const replacements = createTokenReplacements(instanceMorning);
                
                expect(replacements.HH()).toBe('09');
                expect(replacements.H()).toBe('9');
                expect(replacements.hh()).toBe('09');
                expect(replacements.h()).toBe('9');
            });
        });

        describe('minute tokens', () => {
            it('should format mm token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.mm()).toBe('30');
            });

            it('should format m token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.m()).toBe('30');
            });

            it('should handle single-digit minutes', () => {
                const instanceMin5 = createMockInstance({ minute: 5 });
                const replacements = createTokenReplacements(instanceMin5);
                
                expect(replacements.mm()).toBe('05');
                expect(replacements.m()).toBe('5');
            });
        });

        describe('second tokens', () => {
            it('should format ss token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.ss()).toBe('45');
            });

            it('should format s token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.s()).toBe('45');
            });

            it('should handle single-digit seconds', () => {
                const instanceSec7 = createMockInstance({ second: 7 });
                const replacements = createTokenReplacements(instanceSec7);
                
                expect(replacements.ss()).toBe('07');
                expect(replacements.s()).toBe('7');
            });
        });

        describe('millisecond tokens', () => {
            it('should format SSS token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.SSS()).toBe('123');
            });

            it('should handle single-digit milliseconds', () => {
                const instanceMs5 = createMockInstance({ millisecond: 5 });
                const replacements = createTokenReplacements(instanceMs5);
                expect(replacements.SSS()).toBe('005');
            });

            it('should handle double-digit milliseconds', () => {
                const instanceMs50 = createMockInstance({ millisecond: 50 });
                const replacements = createTokenReplacements(instanceMs50);
                expect(replacements.SSS()).toBe('050');
            });
        });

        describe('AM/PM tokens', () => {
            it('should format A token correctly for PM', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.A()).toBe('PM');
            });

            it('should format a token correctly for PM', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.a()).toBe('pm');
            });

            it('should format A token correctly for AM', () => {
                const instanceAM = createMockInstance({ hour: 9 });
                const replacements = createTokenReplacements(instanceAM);
                expect(replacements.A()).toBe('AM');
            });

            it('should format a token correctly for AM', () => {
                const instanceAM = createMockInstance({ hour: 9 });
                const replacements = createTokenReplacements(instanceAM);
                expect(replacements.a()).toBe('am');
            });

            it('should handle midnight as AM', () => {
                const instanceMidnight = createMockInstance({ hour: 0 });
                const replacements = createTokenReplacements(instanceMidnight);
                expect(replacements.A()).toBe('AM');
                expect(replacements.a()).toBe('am');
            });

            it('should handle noon as PM', () => {
                const instanceNoon = createMockInstance({ hour: 12 });
                const replacements = createTokenReplacements(instanceNoon);
                expect(replacements.A()).toBe('PM');
                expect(replacements.a()).toBe('pm');
            });
        });

        describe('timezone tokens', () => {
            it('should format Z token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.Z()).toBe('+05:00');
            });

            it('should format ZZ token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.ZZ()).toBe('+0500');
            });

            it('should format z token correctly', () => {
                const replacements = createTokenReplacements(mockInstance);
                expect(replacements.z()).toBe('Asia/Karachi');
            });

            it('should handle negative offsets', () => {
                const instanceNegOffset = createMockInstance({
                    raw: {
                        ...mockInstance.raw,
                        offset: '-05:00'
                    }
                });
                const replacements = createTokenReplacements(instanceNegOffset);
                
                expect(replacements.Z()).toBe('-05:00');
                expect(replacements.ZZ()).toBe('-0500');
            });
        });
    });

    describe('legacyFormat', () => {
        it('should format a simple date string', () => {
            const result = legacyFormat(mockInstance, 'YYYY-MM-DD');
            expect(result).toBe('2024-03-15');
        });

        it('should format a complex date string', () => {
            const result = legacyFormat(mockInstance, 'dddd, MMMM D, YYYY [at] h:mm A');
            expect(result).toBe('Friday, March 15, 2024 at 2:30 PM');
        });

        it('should handle literal text in brackets', () => {
            const result = legacyFormat(mockInstance, '[Today is] YYYY-MM-DD');
            expect(result).toBe('Today is 2024-03-15');
        });

        it('should handle multiple literal sections', () => {
            const result = legacyFormat(mockInstance, '[Date:] YYYY-MM-DD [Time:] HH:mm:ss');
            expect(result).toBe('Date: 2024-03-15 Time: 14:30:45');
        });

        it('should handle unknown tokens by leaving them unchanged', () => {
            const result = legacyFormat(mockInstance, 'YYYY-MM-DD XXX');
            expect(result).toBe('2024-03-15 XXX');
        });

        it('should use provided locale', () => {
            legacyFormat(mockInstance, 'MMMM', 'fr-FR');
            expect(mockInstance.raw.toLocaleString).toHaveBeenCalledWith('fr-FR', { month: 'long' });
        });

        it('should handle empty format string', () => {
            const result = legacyFormat(mockInstance, '');
            expect(result).toBe('');
        });

        it('should handle format string with only literals', () => {
            const result = legacyFormat(mockInstance, '[Hello World]');
            expect(result).toBe('Hello World');
        });

        it('should handle format string with no tokens', () => {
            const result = legacyFormat(mockInstance, 'Hello World');
            expect(result).toBe('Hello World');
        });

        it('should handle all time formats', () => {
            const result = legacyFormat(mockInstance, 'HH:mm:ss.SSS');
            expect(result).toBe('14:30:45.123');
        });

        it('should handle 12-hour format', () => {
            const result = legacyFormat(mockInstance, 'h:mm A');
            expect(result).toBe('2:30 PM');
        });

        it('should handle timezone formats', () => {
            const result = legacyFormat(mockInstance, 'YYYY-MM-DD Z [in] z');
            expect(result).toBe('2024-03-15 +05:00 in Asia/Karachi');
        });
    });

    describe('getTokenRegex', () => {
        it('should return the token regex', () => {
            const regex = getTokenRegex();
            expect(regex).toBe(mockRegex);
            expect(MockedRegexCache.getPrecompiled).toHaveBeenCalledWith('tokenRegex');
        });

        it('should return the same regex on multiple calls', () => {
            const regex1 = getTokenRegex();
            const regex2 = getTokenRegex();
            expect(regex1).toBe(regex2);
        });
    });

    describe('clearLegacyFormattingCache', () => {
        it('should not throw when called', () => {
            expect(() => {
                clearLegacyFormattingCache();
            }).not.toThrow();
        });

        it('should be callable multiple times', () => {
            expect(() => {
                clearLegacyFormattingCache();
                clearLegacyFormattingCache();
                clearLegacyFormattingCache();
            }).not.toThrow();
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle instance with missing properties gracefully', () => {
            const incompleteInstance = {
                year: 2024,
                month: 3,
                day: 15,
                // Missing other properties
                raw: {
                    toLocaleString: jest.fn().mockReturnValue('fallback')
                }
            };
            
            expect(() => {
                createTokenReplacements(incompleteInstance);
            }).not.toThrow();
        });

        it('should handle null/undefined instance properties', () => {
            const nullInstance = {
                year: null,
                month: undefined,
                day: 15,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
                raw: {
                    dayOfWeek: 1,
                    offset: '+00:00',
                    timeZoneId: 'UTC',
                    toLocaleString: jest.fn().mockReturnValue('fallback')
                }
            };
            
            expect(() => {
                const replacements = createTokenReplacements(nullInstance);
                // These should handle null/undefined gracefully
                replacements.YYYY();
                replacements.MM();
            }).not.toThrow();
        });

        it('should handle regex replacement errors gracefully', () => {
            // Mock String.prototype.replace to throw an error
            const originalReplace = String.prototype.replace;
            (String.prototype.replace as any) = jest.fn().mockImplementation(() => {
                throw new Error('Regex error');
            });
            
            try {
                expect(() => {
                    legacyFormat(mockInstance, 'YYYY-MM-DD');
                }).toThrow('Regex error');
            } finally {
                // Restore original replace method
                String.prototype.replace = originalReplace;
            }
        });

        it('should handle locale string errors gracefully', () => {
            const errorInstance = createMockInstance({
                raw: {
                    ...mockInstance.raw,
                    toLocaleString: jest.fn().mockImplementation(() => {
                        throw new Error('Locale error');
                    })
                }
            });
            
            expect(() => {
                const replacements = createTokenReplacements(errorInstance);
                replacements.MMMM();
            }).toThrow('Locale error');
        });

        it('should handle extreme date values', () => {
            const extremeInstance = createMockInstance({
                year: 9999,
                month: 12,
                day: 31,
                hour: 23,
                minute: 59,
                second: 59,
                millisecond: 999
            });
            
            const result = legacyFormat(extremeInstance, 'YYYY-MM-DD HH:mm:ss.SSS');
            expect(result).toBe('9999-12-31 23:59:59.999');
        });

        it('should handle minimum date values', () => {
            const minInstance = createMockInstance({
                year: 1,
                month: 1,
                day: 1,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            });
            
            const result = legacyFormat(minInstance, 'YYYY-MM-DD HH:mm:ss.SSS');
            expect(result).toBe('1-01-01 00:00:00.000');
        });
    });

    describe('performance and caching', () => {
        it('should reuse cached replacements for same instance and locale', () => {
            const spy = jest.spyOn(mockInstance.raw, 'toLocaleString');
            
            // First call should create cache
            const replacements1 = createTokenReplacements(mockInstance, 'en-US');
            const callCount1 = spy.mock.calls.length;
            
            // Second call should use cache
            const replacements2 = createTokenReplacements(mockInstance, 'en-US');
            const callCount2 = spy.mock.calls.length;
            
            expect(replacements1).toBe(replacements2);
            expect(callCount2).toBe(callCount1); // No additional calls
        });

        it('should handle concurrent access to cache', () => {
            const promises = Array.from({ length: 10 }, (_, i) => 
                Promise.resolve(createTokenReplacements(mockInstance, `locale-${i}`))
            );
            
            return Promise.all(promises).then(results => {
                expect(results).toHaveLength(10);
                results.forEach(replacements => {
                    expect(replacements).toBeDefined();
                    expect(typeof replacements).toBe('object');
                });
            });
        });
    });
});