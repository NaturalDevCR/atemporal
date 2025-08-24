/**
 * @file Additional comprehensive coverage tests for FallbackStrategy
 * Targets remaining uncovered lines to push coverage above 90%
 */

import type { Temporal } from '@js-temporal/polyfill';
import { getCachedTemporalAPI } from '../../../../core/temporal-detection';
import { FallbackStrategy } from '../../../../core/parsing/strategies/fallback-strategy';
import { ParseContext } from '../../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('FallbackStrategy - Additional Coverage Tests', () => {
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

    describe('Normalization Edge Cases - Lines 272-279, 292-295, 297-300, 302-310', () => {
        /**
         * Test the fallback string conversion path (lines 297-300)
         */
        it('should handle fallback string conversion for non-string/non-number inputs', () => {
            // Create a symbol that will trigger fallback string conversion
            const symbolInput = Symbol('test-symbol');
            
            const result = strategy.normalize(symbolInput as any, context);
            expect(result.appliedTransforms).toContain('fallback-string-conversion');
            expect(typeof result.normalizedInput).toBe('string');
        });

        /**
         * Test the String() conversion path when object has no useful methods (lines 272-279)
         */
        it('should handle String() conversion when stringValue equals [object Object]', () => {
            const objWithGenericString = {
                // No useful methods, will fall through to String() conversion
                someProperty: 'value'
            };
            
            // Mock String to return '[object Object]'
            const originalString = global.String;
            (global as any).String = jest.fn().mockReturnValue('[object Object]');
            
            try {
                const result = strategy.normalize(objWithGenericString as any, context);
                expect(result.appliedTransforms).toContain('object-json-stringify');
            } finally {
                global.String = originalString;
            }
        });

        /**
         * Test the String() conversion path when stringValue is custom (lines 292-295)
         */
        it('should handle String() conversion when stringValue is not [object Object]', () => {
            const objWithCustomString = {
                someProperty: 'value'
            };
            
            // Mock String to return custom string
            const originalString = global.String;
            (global as any).String = jest.fn().mockReturnValue('custom-string-value');
            
            try {
                const result = strategy.normalize(objWithCustomString as any, context);
                expect(result.appliedTransforms).toContain('object-string-conversion');
                expect(result.normalizedInput).toBe('custom-string-value');
            } finally {
                global.String = originalString;
            }
        });

        /**
         * Test the custom toString path (lines 302-310)
         */
        it('should handle objects with custom toString that returns parseable string', () => {
            const objWithCustomToString = {
                toString() {
                    return '2023-01-01T00:00:00Z'; // Custom parseable string
                }
            };
            
            const result = strategy.normalize(objWithCustomToString as any, context);
            expect(result.appliedTransforms).toContain('object-tostring');
            expect(result.normalizedInput).toBe('2023-01-01T00:00:00Z');
        });

        /**
         * Test JSON.stringify fallback when String() fails (lines 297-300)
         */
        it('should handle JSON.stringify fallback when String() conversion fails', () => {
            const objForStringifyFallback = {
                someProperty: 'value'
            };
            
            // Mock String to throw error
            const originalString = global.String;
            (global as any).String = jest.fn().mockImplementation(() => {
                throw new Error('String conversion error');
            });
            
            try {
                const result = strategy.normalize(objForStringifyFallback as any, context);
                expect(result.appliedTransforms).toContain('object-json-stringify');
            } finally {
                global.String = originalString;
            }
        });
    });

    describe('Parse Method Edge Cases - Lines 354-356, 369-370, 395-396', () => {
        /**
         * Test parsing with unsupported normalized input type (line 354-356)
         */
        it('should handle unsupported normalized input types', () => {
            // Mock normalize to return an unsupported type
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockReturnValue({
                normalizedInput: BigInt(123), // Unsupported type
                appliedTransforms: ['test-transform'],
                metadata: {}
            });
            
            try {
                const result = strategy.parse('test-input' as any, context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Cannot parse normalized input of type: bigint');
                }
            } finally {
                strategy.normalize = originalNormalize;
            }
        });

        /**
         * Test performance.now() error handling in success case (lines 369-370)
         */
        it('should handle performance.now() errors in successful parse', () => {
            const originalPerformance = global.performance;
            let callCount = 0;
            
            try {
                global.performance = {
                    ...originalPerformance,
                    now: jest.fn().mockImplementation(() => {
                        callCount++;
                        if (callCount === 2) { // Second call (end time)
                            throw new Error('Performance API error');
                        }
                        return Date.now();
                    })
                };
                
                const result = strategy.parse('2023-01-01T00:00:00Z', context);
                expect(result.success).toBe(true);
                expect(typeof result.executionTime).toBe('number');
            } finally {
                global.performance = originalPerformance;
            }
        });

        /**
         * Test performance.now() error handling in error case (lines 395-396)
         */
        it('should handle performance.now() errors in failed parse', () => {
            const originalPerformance = global.performance;
            let callCount = 0;
            
            try {
                global.performance = {
                    ...originalPerformance,
                    now: jest.fn().mockImplementation(() => {
                        callCount++;
                        if (callCount === 2) { // Second call (end time)
                            throw new Error('Performance API error');
                        }
                        return Date.now();
                    })
                };
                
                const result = strategy.parse('completely-invalid-input', context);
                expect(result.success).toBe(false);
                expect(typeof result.executionTime).toBe('number');
            } finally {
                global.performance = originalPerformance;
            }
        });
    });

    describe('String Parsing Edge Cases - Lines 487-488, 497-498', () => {
        /**
         * Test Date parsing with invalid date that doesn't throw but returns NaN (lines 487-488)
         */
        it('should handle Date parsing that returns NaN time', () => {
            // Mock Date constructor to return a date with NaN time
            const originalDate = global.Date;
            global.Date = jest.fn().mockImplementation((str) => {
                const date = new originalDate(str);
                // Force NaN time
                Object.defineProperty(date, 'getTime', {
                    value: () => NaN
                });
                return date;
            }) as any;
            Object.setPrototypeOf(global.Date, originalDate);
            
            try {
                const result = strategy.parse('invalid-date-string', context);
                expect(result.success).toBe(false);
            } finally {
                global.Date = originalDate;
            }
        });

        /**
         * Test parseFloat returning non-finite number (lines 497-498)
         */
        it('should handle parseFloat returning non-finite number', () => {
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
    });

    describe('Number Parsing Edge Cases - Lines 530-531, 538-545, 553-562', () => {
        /**
         * Test millisecond timestamp parsing error (lines 530-531)
         */
        it('should handle millisecond timestamp parsing errors', () => {
            const originalFromEpochMilliseconds = TemporalAPI.Instant.fromEpochMilliseconds;
            TemporalAPI.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                const result = strategy.parse(1640995200000, context); // Large number (milliseconds)
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse number as millisecond timestamp');
                }
            } finally {
                TemporalAPI.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });

        /**
         * Test second timestamp parsing error (lines 538-545)
         */
        it('should handle second timestamp parsing errors', () => {
            const originalFromEpochMilliseconds = TemporalAPI.Instant.fromEpochMilliseconds;
            TemporalAPI.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                const result = strategy.parse(1640995200, context); // Medium number (seconds)
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse number as second timestamp');
                }
            } finally {
                TemporalAPI.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });

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

    describe('Validation Edge Cases - Lines 215, 222-223, 227-228, 235-244', () => {
        /**
         * Test plain object validation with constructor undefined (lines 215)
         */
        it('should handle plain objects with constructor undefined', () => {
            const objWithUndefinedConstructor = Object.create(null);
            objWithUndefinedConstructor.someProperty = 'value';
            
            const result = strategy.validate(objWithUndefinedConstructor as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Plain object input without useful conversion methods is not supported for temporal values');
        });

        /**
         * Test objects with temporal-like properties (lines 222-223)
         */
        it('should handle objects with temporal-like properties', () => {
            const objWithYearProperty = {
                year: 2023,
                month: 1,
                day: 1
            };
            
            const result = strategy.validate(objWithYearProperty as any, context);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Plain object input will be converted using available methods');
        });

        /**
         * Test objects where method checking throws (lines 227-228)
         */
        it('should handle objects where method checking throws in validation', () => {
            const objWithThrowingGetters = {
                get toDate() {
                    throw new Error('toDate getter error');
                },
                get valueOf() {
                    throw new Error('valueOf getter error');
                },
                get toString() {
                    throw new Error('toString getter error');
                }
            };
            
            const result = strategy.validate(objWithThrowingGetters as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Plain object input without useful conversion methods is not supported for temporal values');
        });

        /**
         * Test objects with only toString method (lines 235-244)
         */
        it('should handle objects with only toString method', () => {
            const objWithOnlyToString = {
                toString() {
                    return 'custom-string';
                }
            };
            
            const result = strategy.validate(objWithOnlyToString as any, context);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Plain object input will be converted using available methods');
        });
    });

    describe('Normalization Complex Object Cases - Lines 259-260, 242-243', () => {
        /**
         * Test toDate method that doesn't return Date instance (lines 242-243)
         */
        it('should handle toDate method that does not return Date instance', () => {
            const objWithBadToDate = {
                toDate() {
                    return 'not-a-date'; // Returns string instead of Date
                }
            };
            
            const result = strategy.normalize(objWithBadToDate as any, context);
            // Should fall back to other methods since toDate didn't return Date
            expect(result.appliedTransforms).not.toContain('object-todate');
        });

        /**
         * Test valueOf method checking that throws (lines 259-260)
         */
        it('should handle valueOf method checking that throws', () => {
            const objWithThrowingValueOfCheck = {
                get valueOf() {
                    throw new Error('valueOf getter error');
                }
            };
            
            const result = strategy.normalize(objWithThrowingValueOfCheck as any, context);
            // Should continue to other methods when valueOf checking throws
            expect(result.appliedTransforms).not.toContain('object-valueof');
        });
    });

    describe('Additional Branch Coverage Tests', () => {
        /**
         * Test objects with valueOf returning valid string/number
         */
        it('should handle objects with valueOf returning valid string', () => {
            const objWithStringValueOf = {
                valueOf() {
                    return '2023-01-01T00:00:00Z';
                }
            };
            
            const result = strategy.normalize(objWithStringValueOf as any, context);
            expect(result.appliedTransforms).toContain('object-valueof');
            expect(result.normalizedInput).toBe('2023-01-01T00:00:00Z');
        });

        /**
         * Test objects with valueOf returning valid number
         */
        it('should handle objects with valueOf returning valid number', () => {
            const objWithNumberValueOf = {
                valueOf() {
                    return 1640995200000;
                }
            };
            
            const result = strategy.normalize(objWithNumberValueOf as any, context);
            expect(result.appliedTransforms).toContain('object-valueof');
            expect(result.normalizedInput).toBe(1640995200000);
        });

        /**
         * Test objects with toDate returning valid Date
         */
        it('should handle objects with toDate returning valid Date', () => {
            const objWithToDate = {
                toDate() {
                    return new Date('2023-01-01T00:00:00Z');
                }
            };
            
            const result = strategy.normalize(objWithToDate as any, context);
            expect(result.appliedTransforms).toContain('object-todate');
            expect(result.normalizedInput).toBeInstanceOf(Date);
        });

        /**
         * Test Date object parsing in parse method
         */
        it('should handle Date object parsing in parse method', () => {
            const validDate = new Date('2023-01-01T00:00:00Z');
            
            const result = strategy.parse(validDate, context);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeInstanceOf(TemporalAPI.ZonedDateTime);
            }
        });

        /**
         * Test invalid Date object parsing
         */
        it('should handle invalid Date object parsing', () => {
            const invalidDate = new Date('invalid-date');
            
            const result = strategy.parse(invalidDate, context);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Invalid number');
            }
        });
    });
});