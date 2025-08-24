/**
 * @file Comprehensive coverage tests for FallbackStrategy
 * Targets specific uncovered lines to push coverage above 90%
 */

import { Temporal } from '@js-temporal/polyfill';
import { FallbackStrategy } from '../../../../core/parsing/strategies/fallback-strategy';
import { ParseContext } from '../../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('FallbackStrategy - Coverage Enhancement', () => {
    let strategy: FallbackStrategy;
    let context: ParseContext;

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

    describe('Array Input Error Handling (Lines 201-203)', () => {
        it('should throw error when normalizing array input', () => {
            const arrayInput = [2023, 1, 1];
            
            expect(() => {
                strategy.normalize(arrayInput as any, context);
            }).toThrow('Array input is not supported for temporal values');
        });
    });

    describe('Plain Object Validation Errors (Lines 215, 222-223, 227-228)', () => {
        it('should handle plain objects without useful methods', () => {
            // Create a plain object that truly has no useful methods
            const plainObj = Object.create(null);
            plainObj.someProperty = 'value';
            // Override toString to return the default object string
            plainObj.toString = Object.prototype.toString;
            
            expect(() => {
                strategy.normalize(plainObj as any, context);
            }).toThrow('Plain object input without useful conversion methods is not supported for temporal values');
        });

        it('should handle objects with constructor undefined', () => {
            const objWithUndefinedConstructor = Object.create(null);
            objWithUndefinedConstructor.someProperty = 'value';
            
            expect(() => {
                strategy.normalize(objWithUndefinedConstructor as any, context);
            }).toThrow('Plain object input without useful conversion methods is not supported for temporal values');
        });

        it('should handle objects where method checking throws errors', () => {
            const objWithThrowingGetter = {
                get toDate() {
                    throw new Error('Getter error');
                },
                get valueOf() {
                    throw new Error('Getter error');
                },
                get toString() {
                    throw new Error('Getter error');
                }
            };
            
            expect(() => {
                strategy.normalize(objWithThrowingGetter as any, context);
            }).toThrow('Plain object input without useful conversion methods is not supported for temporal values');
        });
    });

    describe('Complex Object Conversion Fallbacks (Lines 235-244, 277-278, 297-300, 302-310)', () => {
        it('should handle objects with toDate method that throws', () => {
            const objWithThrowingToDate = {
                toDate() {
                    throw new Error('toDate error');
                }
            };
            
            const result = strategy.normalize(objWithThrowingToDate as any, context);
            // Should fall back to JSON.stringify since toDate throws
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        it('should handle objects with valueOf that returns non-string/non-number', () => {
            const objWithBadValueOf = {
                valueOf() {
                    return { nested: 'object' };
                }
            };
            
            const result = strategy.normalize(objWithBadValueOf as any, context);
            // Should fall back to JSON.stringify since valueOf returns non-primitive
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        it('should handle objects where valueOf throws', () => {
            const objWithThrowingValueOf = {
                get valueOf() {
                    throw new Error('valueOf getter error');
                }
            };
            
            const result = strategy.normalize(objWithThrowingValueOf as any, context);
            // Should fall back to string conversion since valueOf throws
            expect(result.appliedTransforms).toContain('object-string-conversion');
        });

        it('should handle objects where toString throws and use JSON.stringify', () => {
            const objWithThrowingToString = {
                toString() {
                    throw new Error('toString error');
                },
                someProperty: 'value'
            };
            
            const result = strategy.normalize(objWithThrowingToString as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        it('should handle objects where both toString and JSON.stringify throw', () => {
            const circularObj: any = { prop: 'value' };
            circularObj.circular = circularObj;
            
            // Override toString to throw
            circularObj.toString = () => {
                throw new Error('toString error');
            };
            
            // This should throw an error since both toString and JSON.stringify fail
            expect(() => {
                strategy.normalize(circularObj as any, context);
            }).toThrow('Complex object cannot be converted to temporal value');
        });

        it('should handle objects where String conversion fails', () => {
            const objWithBadString = {
                toString() {
                    throw new Error('toString error');
                },
                valueOf() {
                    throw new Error('valueOf error');
                }
            };
            
            // Mock String to throw
            const originalString = global.String;
            (global as any).String = jest.fn().mockImplementation(() => {
                throw new Error('String conversion error');
            });
            
            try {
                const result = strategy.normalize(objWithBadString as any, context);
                expect(result.appliedTransforms).toContain('object-json-stringify');
            } finally {
                global.String = originalString;
            }
        });

        it('should handle truly unparseable objects', () => {
            const unparseable = {
                toString() {
                    throw new Error('toString error');
                },
                valueOf() {
                    throw new Error('valueOf error');
                }
            };
            
            // Mock both String and JSON.stringify to throw
            const originalString = global.String;
            const originalStringify = JSON.stringify;
            
            (global as any).String = jest.fn().mockImplementation(() => {
                throw new Error('String conversion error');
            });
            JSON.stringify = jest.fn().mockImplementation(() => {
                throw new Error('JSON.stringify error');
            });
            
            try {
                expect(() => {
                    strategy.normalize(unparseable as any, context);
                }).toThrow('Complex object cannot be converted to temporal value');
            } finally {
                global.String = originalString;
                JSON.stringify = originalStringify;
            }
        });
    });

    describe('Normalization Error Handling (Lines 354-356)', () => {
        it('should handle normalization errors in parse method', () => {
            // Create an object that passes validation but fails normalization
            const badInput = {
                // Has a toDate method so it passes validation
                toDate() {
                    return new Date('2023-01-01');
                },
                toString() {
                    throw new Error('toString error');
                },
                valueOf() {
                    throw new Error('valueOf error');
                }
            };
            
            // Mock normalize to throw during normalization
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockImplementation(() => {
                throw new Error('Normalization test error');
            });
            
            try {
                const result = strategy.parse(badInput as any, context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Normalization failed');
                }
            } finally {
                strategy.normalize = originalNormalize;
            }
        });
    });

    describe('Performance Timing Fallbacks (Lines 369-370, 395-396)', () => {
        it('should handle performance.now() errors in parse method', () => {
            const originalPerformance = global.performance;
            
            try {
                global.performance = {
                    ...originalPerformance,
                    now: jest.fn().mockImplementation(() => {
                        throw new Error('Performance API error');
                    })
                };
                
                const result = strategy.parse('2023-01-01T00:00:00Z', context);
                expect(result.success).toBe(true);
                expect(typeof result.executionTime).toBe('number');
            } finally {
                global.performance = originalPerformance;
            }
        });

        it('should handle performance.now() errors in error case', () => {
            const originalPerformance = global.performance;
            
            try {
                global.performance = {
                    ...originalPerformance,
                    now: jest.fn().mockImplementation(() => {
                        throw new Error('Performance API error');
                    })
                };
                
                const result = strategy.parse('invalid-date-string', context);
                expect(result.success).toBe(false);
                expect(typeof result.executionTime).toBe('number');
            } finally {
                global.performance = originalPerformance;
            }
        });
    });

    describe('String Parsing Error Handling (Lines 487-488, 497-498)', () => {
        it('should handle Temporal.Instant.from() errors', () => {
            // Mock Temporal.Instant.from to throw
            const originalFrom = Temporal.Instant.from;
            Temporal.Instant.from = jest.fn().mockImplementation(() => {
                throw new Error('Instant.from error');
            });
            
            try {
                const result = strategy.parse('2023-01-01T00:00:00Z', context);
                expect(result.success).toBe(true); // Should fall back to Date parsing
            } finally {
                Temporal.Instant.from = originalFrom;
            }
        });

        it('should handle Date parsing errors', () => {
            // Mock Date constructor to return invalid date
            const originalDate = global.Date;
            global.Date = jest.fn().mockImplementation(() => {
                const invalidDate = new originalDate('invalid');
                return invalidDate;
            }) as any;
            Object.setPrototypeOf(global.Date, originalDate);
            
            try {
                const result = strategy.parse('invalid-date-string', context);
                expect(result.success).toBe(false);
            } finally {
                global.Date = originalDate;
            }
        });
    });

    describe('Number Parsing Error Handling (Lines 530-531, 538-545)', () => {
        it('should handle Temporal.Instant.fromEpochMilliseconds errors for large numbers', () => {
            const originalFromEpochMilliseconds = Temporal.Instant.fromEpochMilliseconds;
            Temporal.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                const result = strategy.parse(1640995200000, context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse number as millisecond timestamp');
                }
            } finally {
                Temporal.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });

        it('should handle Temporal.Instant.fromEpochMilliseconds errors for second timestamps', () => {
            const originalFromEpochMilliseconds = Temporal.Instant.fromEpochMilliseconds;
            Temporal.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                const result = strategy.parse(1640995200, context); // Seconds timestamp
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse number as second timestamp');
                }
            } finally {
                Temporal.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });

        it('should handle errors for small numbers (both milliseconds and seconds)', () => {
            const originalFromEpochMilliseconds = Temporal.Instant.fromEpochMilliseconds;
            Temporal.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('fromEpochMilliseconds error');
            });
            
            try {
                const result = strategy.parse(123456, context); // Small number
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse number as timestamp');
                }
            } finally {
                Temporal.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
            }
        });
    });

    describe('Invalid Date Handling (Lines 553-562)', () => {
        it('should handle invalid Date objects', () => {
            const invalidDate = new Date('invalid-date-string');
            
            const result = strategy.parse(invalidDate, context);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Invalid number');
            }
        });

        it('should handle Date objects with NaN time', () => {
            const nanDate = new Date(NaN);
            
            const result = strategy.parse(nanDate, context);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Invalid number');
            }
        });
    });

    describe('Additional Coverage Tests', () => {
        it('should handle validation errors for boolean input', () => {
            const result = strategy.validate(true as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Boolean input is not supported for temporal values');
        });

        it('should handle validation errors for symbol input', () => {
            const result = strategy.validate(Symbol('test') as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Symbol input cannot be converted to temporal value');
        });

        it('should handle validation errors for function input', () => {
            const testFunction = function() { return 'test'; };
            const result = strategy.validate(testFunction as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Function input cannot be converted to temporal value');
        });

        it('should handle validation errors for array input', () => {
            const result = strategy.validate([2023, 1, 1] as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Array input should be handled by array-like strategy');
        });

        it('should handle objects without useful methods in validation', () => {
            const plainObj = Object.create(null);
            plainObj.someProperty = 'value';
            plainObj.toString = Object.prototype.toString;
            
            const result = strategy.validate(plainObj as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Plain object input without useful conversion methods is not supported for temporal values');
        });

        it('should handle objects where method checking throws in validation', () => {
            const objWithThrowingGetter = {
                get toDate() {
                    throw new Error('Getter error');
                },
                get valueOf() {
                    throw new Error('Getter error');
                },
                get toString() {
                    throw new Error('Getter error');
                }
            };
            
            const result = strategy.validate(objWithThrowingGetter as any, context);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Plain object input without useful conversion methods is not supported for temporal values');
        });

        it('should handle BigInt precision warnings', () => {
            const result = strategy.validate(BigInt(123456789012345) as any, context);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('BigInt input will be converted to number (may lose precision)');
        });

        it('should handle BigInt normalization with precision loss', () => {
            const largeBigInt = BigInt('9007199254740992'); // Larger than MAX_SAFE_INTEGER
            const result = strategy.normalize(largeBigInt as any, context);
            expect(result.appliedTransforms).toContain('bigint-to-number');
            expect(result.appliedTransforms).toContain('precision-loss-warning');
        });
    });

    describe('Edge Cases for Complete Coverage', () => {
        it('should handle non-finite numbers', () => {
            const result1 = strategy.parse(Infinity, context);
            expect(result1.success).toBe(false);
            
            const result2 = strategy.parse(-Infinity, context);
            expect(result2.success).toBe(false);
            
            const result3 = strategy.parse(NaN, context);
            expect(result3.success).toBe(false);
        });

        it('should handle objects with toDate returning non-Date', () => {
            const objWithBadToDate = {
                toDate() {
                    return 'not-a-date';
                }
            };
            
            const result = strategy.normalize(objWithBadToDate as any, context);
            // Should fall back to JSON.stringify since toDate doesn't return a Date
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        it('should handle objects with custom toString that returns [object Object]', () => {
            const objWithGenericToString = {
                toString() {
                    return '[object Object]';
                },
                someProperty: 'value'
            };
            
            const result = strategy.normalize(objWithGenericToString as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        it('should handle parseFloat errors in string parsing', () => {
            const originalParseFloat = global.parseFloat;
            global.parseFloat = jest.fn().mockImplementation(() => {
                throw new Error('parseFloat error');
            });
            
            try {
                const result = strategy.parse('not-a-number-string', context);
                expect(result.success).toBe(false);
            } finally {
                global.parseFloat = originalParseFloat;
            }
        });

        it('should handle unknown normalized input types', () => {
            // Mock normalize to return an unsupported type
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockReturnValue({
                normalizedInput: Symbol('unsupported') as any,
                appliedTransforms: ['mock-transform'],
                metadata: {}
            });
            
            try {
                const result = strategy.parse('test', context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Cannot parse normalized input of type: symbol');
                }
            } finally {
                strategy.normalize = originalNormalize;
            }
        });

        it('should handle Date parsing with NaN result', () => {
            // Mock Date constructor to return NaN time
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

        it('should handle string parsing with all methods failing', () => {
            // Mock all Temporal methods to throw
            const originalZonedFrom = Temporal.ZonedDateTime.from;
            const originalInstantFrom = Temporal.Instant.from;
            const originalDate = global.Date;
            const originalParseFloat = global.parseFloat;
            
            Temporal.ZonedDateTime.from = jest.fn().mockImplementation(() => {
                throw new Error('ZonedDateTime.from error');
            });
            Temporal.Instant.from = jest.fn().mockImplementation(() => {
                throw new Error('Instant.from error');
            });
            global.Date = jest.fn().mockImplementation(() => {
                const date = new originalDate('invalid');
                return date;
            }) as any;
            Object.setPrototypeOf(global.Date, originalDate);
            global.parseFloat = jest.fn().mockImplementation(() => {
                throw new Error('parseFloat error');
            });
            
            try {
                const result = strategy.parse('unparseable-string', context);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error?.message).toContain('Unable to parse string');
                }
            } finally {
                Temporal.ZonedDateTime.from = originalZonedFrom;
                Temporal.Instant.from = originalInstantFrom;
                global.Date = originalDate;
                global.parseFloat = originalParseFloat;
            }
        });

        it('should handle objects with temporal-like properties', () => {
            const temporalLikeObj = {
                year: 2023,
                month: 1,
                day: 1
            };
            
            const result = strategy.normalize(temporalLikeObj as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        it('should handle objects with custom toString that is not Object.prototype.toString', () => {
            const objWithCustomToString = {
                toString() {
                    return '2023-01-01T00:00:00Z';
                }
            };
            
            const result = strategy.normalize(objWithCustomToString as any, context);
            expect(result.appliedTransforms).toContain('object-tostring');
        });

        it('should handle optimization hints for different input types', () => {
            // Test boolean input warnings
            const boolHints = strategy.getOptimizationHints(true as any, context);
            expect(boolHints.warnings).toContain('Boolean input is not supported - consider using a valid temporal format');
            
            // Test bigint input warnings
            const bigintHints = strategy.getOptimizationHints(BigInt(123) as any, context);
            expect(bigintHints.warnings).toContain('BigInt conversion may lose precision');
            
            // Test object input warnings
            const objHints = strategy.getOptimizationHints({} as any, context);
            expect(objHints.warnings).toContain('Object input requires complex conversion - consider using a more specific format');
        });

        it('should handle valueOf method that returns string', () => {
            const objWithStringValueOf = {
                valueOf() {
                    return '1640995200000';
                }
            };
            
            const result = strategy.normalize(objWithStringValueOf as any, context);
            expect(result.appliedTransforms).toContain('object-valueof');
        });

        it('should handle valueOf method that returns number', () => {
            const objWithNumberValueOf = {
                valueOf() {
                    return 1640995200000;
                }
            };
            
            const result = strategy.normalize(objWithNumberValueOf as any, context);
            expect(result.appliedTransforms).toContain('object-valueof');
        });
    });
});