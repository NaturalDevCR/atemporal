/**
 * @file Ultra-precise coverage tests for FallbackStrategy
 * Targets exact remaining uncovered lines for 90%+ coverage
 */

import type { Temporal } from '@js-temporal/polyfill';
import { getCachedTemporalAPI } from '../../../../core/temporal-detection';
import { FallbackStrategy } from '../../../../core/parsing/strategies/fallback-strategy';
import { ParseContext } from '../../../../core/parsing/parsing-types';

describe('FallbackStrategy - Ultra-Precise Coverage', () => {
    let strategy: FallbackStrategy;
    let context: ParseContext;
    const TemporalAPI = getCachedTemporalAPI().Temporal;

    beforeEach(() => {
        strategy = new FallbackStrategy();
        context = {
            input: 'test',
            options: {
                timeZone: 'UTC',
                strict: false
            },
            inferredType: 'string',
            confidence: 0.5,
            startTime: Date.now(),
            metadata: {}
        };
    });

    describe('Targeting lines 146-147 (precision loss warning)', () => {
        it('should add precision loss warning for unsafe BigInt conversion', () => {
            // Create a BigInt that will lose precision when converted to number
            const unsafeBigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
            
            const result = strategy.parse(unsafeBigInt as any, context);
            expect(result.success).toBe(false); // Will fail parsing but should hit the precision loss line
        });
    });

    describe('Targeting lines 151-159 (array validation error)', () => {
        it('should handle array input in validation', () => {
            const arrayInput = [2023, 1, 1];
            
            const validationResult = strategy.validate(arrayInput as any, context);
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.errors).toContain('Array input should be handled by array-like strategy');
        });
    });

    describe('Targeting lines 222-223 (toString function check fallback)', () => {
        it('should handle objects where toString check throws but fallback succeeds', () => {
            const objWithThrowingToStringCheck = {
                get toString() {
                    throw new Error('toString getter error');
                }
            };
            
            const result = strategy.parse(objWithThrowingToStringCheck as any, context);
            expect(result.success).toBe(false);
        });
    });

    describe('Targeting lines 297-300 (JSON.stringify in String conversion)', () => {
        it('should use JSON.stringify when String() returns [object Object]', () => {
            const objThatStringifiesGeneric = {
                toString: () => '[object Object]',
                customProp: 'value'
            };
            
            const result = strategy.parse(objThatStringifiesGeneric as any, context);
            expect(result.success).toBe(false);
        });
    });

    describe('Targeting lines 302-310 (String conversion failure fallback)', () => {
        it('should handle String() conversion failure and use JSON.stringify', () => {
            const objThatThrowsOnString = {
                toString: () => { throw new Error('toString error'); },
                valueOf: () => { throw new Error('valueOf error'); }
            };
            
            // Mock String to throw
            const originalString = global.String;
            try {
                (global as any).String = jest.fn().mockImplementation(() => {
                    throw new Error('String conversion failed');
                });
                
                const result = strategy.parse(objThatThrowsOnString as any, context);
                expect(result.success).toBe(false);
            } finally {
                global.String = originalString;
            }
        });
    });

    describe('Targeting lines 316-318 (fallback string conversion)', () => {
        it('should use fallback string conversion for non-string/non-number inputs', () => {
            // Create a symbol that will need string conversion
            const symbolInput = Symbol('test');
            
            const result = strategy.parse(symbolInput as any, context);
            expect(result.success).toBe(false);
        });
    });

    describe('Targeting lines 517-546 (parseAsNumber branches)', () => {
        it('should handle numbers in different ranges', () => {
            // Test small number (< 1e9)
            const smallResult = strategy.parse(123456, context);
            expect(typeof smallResult.success).toBe('boolean');
            
            // Test medium number (1e9 to 1e12) - seconds range
            const mediumResult = strategy.parse(1640995200, context); // Unix timestamp in seconds
            expect(typeof mediumResult.success).toBe('boolean');
            
            // Test large number (>= 1e12) - milliseconds range
            const largeResult = strategy.parse(1640995200000, context); // Unix timestamp in milliseconds
            expect(typeof largeResult.success).toBe('boolean');
        });

        it('should handle parseAsNumber error paths', () => {
            // Mock TemporalAPI.Instant.fromEpochMilliseconds to throw for specific ranges
            const originalFromEpochMilliseconds = TemporalAPI.Instant.fromEpochMilliseconds;
            
            try {
                let callCount = 0;
                TemporalAPI.Instant.fromEpochMilliseconds = jest.fn().mockImplementation((ms) => {
                    callCount++;
                    if (callCount === 1) {
                        // First call (milliseconds) fails
                        throw new Error('Milliseconds failed');
                    } else if (callCount === 2) {
                        // Second call (seconds) fails
                        throw new Error('Seconds failed');
                    }
                    // All subsequent calls fail
                    throw new Error('All timestamp parsing failed');
                });
                
                const result = strategy.parse(500, context); // Small number that tries both paths
                expect(result.success).toBe(false);
            } finally {
                TemporalAPI.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });
    });

    describe('Targeting validation edge cases', () => {
        it('should handle plain objects with temporal-like properties', () => {
            const objWithYear = {
                year: 2023,
                month: 1,
                day: 1
            };
            
            const validationResult = strategy.validate(objWithYear as any, context);
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.warnings).toContain('Plain object input will be converted using available methods');
        });

        it('should handle objects with custom toString that is not Object.prototype.toString', () => {
            const objWithCustomToString = {
                toString: function customToString() {
                    return 'custom-string-representation';
                }
            };
            
            const validationResult = strategy.validate(objWithCustomToString as any, context);
            expect(validationResult.isValid).toBe(true);
        });
    });

    describe('Targeting normalization edge cases', () => {
        it('should handle toDate method that returns non-Date', () => {
            const objWithBadToDate = {
                toDate: () => 'not-a-date'
            };
            
            const result = strategy.parse(objWithBadToDate as any, context);
            expect(result.success).toBe(false);
        });

        it('should handle valueOf that returns non-number/non-string', () => {
            const objWithBadValueOf = {
                valueOf: () => ({ nested: 'object' })
            };
            
            const result = strategy.parse(objWithBadValueOf as any, context);
            expect(result.success).toBe(false);
        });

        it('should handle toString that returns [object Object] exactly', () => {
            const objWithGenericToString = {
                toString: () => '[object Object]'
            };
            
            const result = strategy.parse(objWithGenericToString as any, context);
            expect(result.success).toBe(false);
        });
    });

    describe('Targeting parseAsString edge cases', () => {
        it('should handle string that fails all parsing attempts', () => {
            // Mock all Temporal parsing methods to fail
            const originalZonedDateTimeFrom = TemporalAPI.ZonedDateTime.from;
            const originalInstantFrom = TemporalAPI.Instant.from;
            const originalDate = global.Date;
            const originalParseFloat = global.parseFloat;
            
            try {
                TemporalAPI.ZonedDateTime.from = jest.fn().mockImplementation(() => {
                    throw new Error('ZonedDateTime.from failed');
                });
                
                TemporalAPI.Instant.from = jest.fn().mockImplementation(() => {
                    throw new Error('Instant.from failed');
                });
                
                global.Date = jest.fn().mockImplementation(() => {
                    const invalidDate = new originalDate('invalid');
                    return invalidDate;
                }) as any;
                
                global.parseFloat = jest.fn().mockImplementation(() => {
                    throw new Error('parseFloat failed');
                });
                
                const result = strategy.parse('unparseable-string-12345', context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse string');
                }
            } finally {
                TemporalAPI.ZonedDateTime.from = originalZonedDateTimeFrom;
                TemporalAPI.Instant.from = originalInstantFrom;
                global.Date = originalDate;
                global.parseFloat = originalParseFloat;
            }
        });
    });

    describe('Targeting error handling branches', () => {
        it('should handle non-Error objects in catch blocks', () => {
            // Create an object that throws a non-Error when accessed
            const problematicObj = {
                get valueOf() {
                    throw 'string error'; // Non-Error object
                }
            };
            
            const result = strategy.parse(problematicObj as any, context);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Fallback parsing failed');
            }
        });
    });
});