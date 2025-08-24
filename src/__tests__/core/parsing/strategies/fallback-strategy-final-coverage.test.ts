/**
 * @file Final comprehensive coverage tests for FallbackStrategy
 * Targets remaining uncovered lines to push coverage above 90%
 */

import type { Temporal } from '@js-temporal/polyfill';
import { getCachedTemporalAPI } from '../../../../core/temporal-detection';
import { FallbackStrategy } from '../../../../core/parsing/strategies/fallback-strategy';
import { ParseContext } from '../../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('FallbackStrategy - Final Coverage Push', () => {
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
            metadata: {},
            inferredType: 'fallback',
            confidence: 0.1,
            startTime: Date.now()
        };
    });

    describe('Array Input Normalization - Lines 201-203', () => {
        /**
         * Test array input normalization error (lines 201-203)
         */
        it('should throw error when normalizing array input', () => {
            const arrayInput = [2023, 1, 1];
            
            expect(() => {
                strategy.normalize(arrayInput as any, context);
            }).toThrow('Array input is not supported for temporal values');
        });
    });

    describe('Plain Object Constructor Checks - Lines 215, 222-223, 227-228', () => {
        /**
         * Test array input validation (covers array validation path)
         */
        it('should handle array input validation', () => {
            const arrayInput = [2023, 1, 1];
            
            const result = strategy.validate(arrayInput as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Array input should be handled by array-like strategy');
        });

        /**
         * Test object with year property (lines 222-223)
         */
        it('should handle object with year property in validation', () => {
            const objWithYear = {
                year: 2023
            };
            
            const result = strategy.validate(objWithYear as any, context);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Plain object input will be converted using available methods');
        });

        /**
         * Test toString method checking that throws (lines 227-228)
         */
        it('should handle toString method checking that throws in validation', () => {
            const objWithThrowingToString = {
                get toString() {
                    throw new Error('toString getter error');
                },
                get toDate() {
                    throw new Error('toDate getter error');
                },
                get valueOf() {
                    throw new Error('valueOf getter error');
                }
            };
            
            const result = strategy.validate(objWithThrowingToString as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Plain object input without useful conversion methods is not supported for temporal values');
        });
    });

    describe('Object Conversion Edge Cases - Lines 242-243, 272-279, 307-309', () => {
        /**
         * Test toDate method that doesn't return Date (lines 242-243)
         */
        it('should handle toDate method that returns non-Date value', () => {
            const objWithBadToDate = {
                toDate() {
                    return 'not-a-date';
                }
            };
            
            const result = strategy.normalize(objWithBadToDate as any, context);
            // Should not apply toDate transform since it didn't return Date
            expect(result.appliedTransforms).not.toContain('object-todate');
        });

        /**
         * Test String conversion with generic object string (lines 272-279)
         */
        it('should handle String conversion returning [object Object]', () => {
            const objForStringConversion = {
                someProperty: 'value'
            };
            
            // Mock String to return '[object Object]'
            const originalString = global.String;
            (global as any).String = jest.fn().mockReturnValue('[object Object]');
            
            try {
                const result = strategy.normalize(objForStringConversion as any, context);
                expect(result.appliedTransforms).toContain('object-json-stringify');
            } finally {
                global.String = originalString;
            }
        });

        /**
         * Test JSON.stringify failure with circular reference (lines 307-309)
         */
        it('should handle JSON.stringify failure in toString catch block', () => {
            const objWithThrowingToString = {
                toString() {
                    throw new Error('toString error');
                },
                someProperty: 'value'
            };
            
            // Mock JSON.stringify to throw
            const originalStringify = JSON.stringify;
            JSON.stringify = jest.fn().mockImplementation(() => {
                throw new Error('JSON.stringify error');
            });
            
            try {
                expect(() => {
                    strategy.normalize(objWithThrowingToString as any, context);
                }).toThrow('Complex object cannot be converted to temporal value');
            } finally {
                JSON.stringify = originalStringify;
            }
        });
    });

    describe('Parse Method Edge Cases - Lines 339-340, 346-347, 354-356, 369-370', () => {
        /**
         * Test validation failure in parse method (lines 339-340)
         */
        it('should handle validation failure in parse method', () => {
            const result = strategy.parse(null as any, context);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Input validation failed');
            }
        });

        /**
         * Test normalization failure in parse method (lines 346-347)
         */
        it('should handle normalization failure in parse method', () => {
            // Mock normalize to throw
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockImplementation(() => {
                throw new Error('Normalization error');
            });
            
            try {
                const result = strategy.parse('test-input' as any, context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Normalization failed');
                }
            } finally {
                strategy.normalize = originalNormalize;
            }
        });

        /**
         * Test unsupported normalized input type (lines 354-356)
         */
        it('should handle unsupported normalized input type in parse', () => {
            // Mock normalize to return unsupported type
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockReturnValue({
                normalizedInput: Symbol('unsupported'),
                appliedTransforms: [],
                metadata: {}
            });
            
            try {
                const result = strategy.parse('test' as any, context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Cannot parse normalized input of type: symbol');
                }
            } finally {
                strategy.normalize = originalNormalize;
            }
        });

        /**
         * Test performance.now() error in success path (lines 369-370)
         */
        it('should handle performance.now() error in successful parse execution time', () => {
            const originalPerformance = global.performance;
            let callCount = 0;
            
            try {
                global.performance = {
                    ...originalPerformance,
                    now: jest.fn().mockImplementation(() => {
                        callCount++;
                        if (callCount === 2) { // Second call for end time
                            throw new Error('Performance error');
                        }
                        return 1000;
                    })
                };
                
                const result = strategy.parse('2023-01-01T00:00:00Z', context);
                expect(result.success).toBe(true);
                expect(typeof result.executionTime).toBe('number');
            } finally {
                global.performance = originalPerformance;
            }
        });
    });

    describe('String Parsing Edge Cases - Lines 482-485, 487-488, 494-495, 497-498', () => {
        /**
         * Test Date parsing with NaN time (lines 487-488)
         */
        it('should handle Date parsing with NaN time in parseAsString', () => {
            // Create a string that will create invalid Date
            const result = strategy.parse('invalid-date-string-that-creates-nan', context);
            expect(result.success).toBe(false);
        });

        /**
         * Test parseFloat returning non-finite number (lines 497-498)
         */
        it('should handle parseFloat returning non-finite number in parseAsString', () => {
            // Mock parseFloat to return Infinity
            const originalParseFloat = global.parseFloat;
            global.parseFloat = jest.fn().mockReturnValue(Infinity);
            
            try {
                const result = strategy.parse('infinity-string', context);
                expect(result.success).toBe(false);
            } finally {
                global.parseFloat = originalParseFloat;
            }
        });

        /**
         * Test Temporal.Instant.fromEpochMilliseconds error (lines 482-485)
         */
        it('should handle Temporal.Instant.fromEpochMilliseconds error in parseAsString', () => {
            const originalFromEpochMilliseconds = TemporalAPI.Instant.fromEpochMilliseconds;
            TemporalAPI.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                // This will go through Date parsing path and then try fromEpochMilliseconds
                const result = strategy.parse('1640995200000', context);
                expect(result.success).toBe(false);
            } finally {
                TemporalAPI.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });

        /**
         * Test toZonedDateTimeISO error (lines 494-495)
         */
        it('should handle toZonedDateTimeISO error in parseAsString', () => {
            const originalFromEpochMilliseconds = TemporalAPI.Instant.fromEpochMilliseconds;
            const mockInstant = {
                toZonedDateTimeISO: jest.fn().mockImplementation(() => {
                    throw new Error('toZonedDateTimeISO error');
                })
            };
            TemporalAPI.Instant.fromEpochMilliseconds = jest.fn().mockReturnValue(mockInstant as any);
            
            try {
                const result = strategy.parse('1640995200000', context);
                expect(result.success).toBe(false);
            } finally {
                TemporalAPI.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });
    });

    describe('Number Parsing Edge Cases - Lines 553-562', () => {
        /**
         * Test small number parsing with both milliseconds and seconds failing (lines 553-562)
         */
        it('should handle small number parsing with both attempts failing', () => {
            const originalFromEpochMilliseconds = TemporalAPI.Instant.fromEpochMilliseconds;
            TemporalAPI.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                const result = strategy.parse(123456, context); // Small number
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse number as timestamp');
                }
            } finally {
                TemporalAPI.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });
    });

    describe('Branch Coverage Improvements', () => {
        /**
         * Test BigInt input normalization
         */
        it('should handle BigInt input normalization with precision loss', () => {
            const bigIntInput = BigInt('9007199254740992'); // Number.MAX_SAFE_INTEGER + 1
            
            const result = strategy.normalize(bigIntInput as any, context);
            expect(result.appliedTransforms).toContain('bigint-to-number');
            expect(result.appliedTransforms).toContain('precision-loss-warning');
        });

        /**
         * Test BigInt input normalization without precision loss
         */
        it('should handle BigInt input normalization without precision loss', () => {
            const bigIntInput = BigInt('123456');
            
            const result = strategy.normalize(bigIntInput as any, context);
            expect(result.appliedTransforms).toContain('bigint-to-number');
            expect(result.appliedTransforms).not.toContain('precision-loss-warning');
        });

        /**
         * Test optimization hints for different input types
         */
        it('should provide optimization hints for object input', () => {
            const hints = strategy.getOptimizationHints({} as any, context);
            expect(hints.warnings).toContain('Object input requires complex conversion - consider using a more specific format');
        });

        it('should provide optimization hints for boolean input', () => {
            const hints = strategy.getOptimizationHints(true as any, context);
            expect(hints.warnings).toContain('Boolean input is not supported - consider using a valid temporal format');
        });

        it('should provide optimization hints for bigint input', () => {
            const hints = strategy.getOptimizationHints(BigInt(123) as any, context);
            expect(hints.warnings).toContain('BigInt conversion may lose precision');
        });
    });
});