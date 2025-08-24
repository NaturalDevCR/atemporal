/**
 * @file Ultra-targeted tests for exact uncovered lines in FallbackStrategy
 * Designed to hit specific line numbers for 90%+ coverage
 */

import { Temporal } from '@js-temporal/polyfill';
import { FallbackStrategy } from '../../../../core/parsing/strategies/fallback-strategy';
import { ParseContext } from '../../../../core/parsing/parsing-types';

describe('FallbackStrategy - Ultra-Targeted Coverage', () => {
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

    describe('Exact Line Coverage Tests', () => {
        /**
         * Test lines 201-203: Array input error
         */
        it('should throw error for array input (lines 201-203)', () => {
            expect(() => {
                strategy.normalize([1, 2, 3] as any, context);
            }).toThrow('Array input is not supported for temporal values');
        });

        /**
         * Test line 215: Plain object constructor check
         */
        it('should handle plain object with undefined constructor (line 215)', () => {
            const objWithUndefinedConstructor = Object.create(null);
            objWithUndefinedConstructor.toString = () => 'custom-value';
            
            const result = strategy.normalize(objWithUndefinedConstructor as any, context);
            expect(result.appliedTransforms).toContain('object-tostring');
        });

        /**
         * Test lines 218-224: Method checking with temporal-like properties
         */
        it('should handle object with temporal-like properties (lines 218-224)', () => {
            const temporalLikeObj = {
                year: 2023,
                month: 1,
                day: 1
            };
            
            const result = strategy.normalize(temporalLikeObj as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        /**
         * Test lines 227-228: Plain object without useful methods error
         */
        it('should throw error for plain object without useful methods (lines 227-228)', () => {
            const plainObj = Object.create(null); // No prototype, no toString
            
            expect(() => {
                strategy.normalize(plainObj as any, context);
            }).toThrow('Plain object input without useful conversion methods is not supported for temporal values');
        });

        /**
         * Test lines 235-244: toDate method returning non-Date
         */
        it('should handle toDate method returning non-Date (lines 235-244)', () => {
            const objWithBadToDate = {
                toDate() {
                    return 'not-a-date';
                }
            };
            
            const result = strategy.normalize(objWithBadToDate as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        /**
         * Test lines 277-278: JSON.stringify fails after toString throws
         */
        it('should handle JSON.stringify failure after toString throws (lines 277-278)', () => {
            const circularObj: any = {
                toString() {
                    throw new Error('toString failed');
                }
            };
            circularObj.self = circularObj; // Create circular reference
            
            expect(() => {
                strategy.normalize(circularObj as any, context);
            }).toThrow('Complex object cannot be converted to temporal value');
        });

        /**
         * Test lines 292-295: JSON.stringify fails with circular reference
         */
        it('should handle JSON.stringify failure with circular reference (lines 292-295)', () => {
            const circularObj: any = {};
            circularObj.self = circularObj;
            
            const result = strategy.normalize(circularObj as any, context);
            expect(result.appliedTransforms).toContain('object-string-conversion');
        });

        /**
         * Test lines 297-300: Custom toString that is parseable
         */
        it('should handle custom toString that is parseable (lines 297-300)', () => {
            const objWithCustomToString = {
                toString() {
                    return 'custom-parseable-string';
                }
            };
            
            const result = strategy.normalize(objWithCustomToString as any, context);
            expect(result.appliedTransforms).toContain('object-tostring');
        });

        /**
         * Test lines 316-318: Fallback string conversion
         */
        it('should use fallback string conversion (lines 316-318)', () => {
            const symbolInput = Symbol('test-symbol');
            
            const result = strategy.normalize(symbolInput as any, context);
            expect(result.appliedTransforms).toContain('fallback-string-conversion');
        });

        /**
         * Test lines 354-356: Normalization error in parse
         */
        it('should handle normalization error in parse (lines 354-356)', () => {
            // Mock normalize to throw
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockImplementation(() => {
                throw new Error('Normalization failed');
            });
            
            try {
                const result = strategy.parse('test', context);
                expect(result.success).toBe(false);
                expect(result.error?.message).toContain('Normalization failed');
            } finally {
                strategy.normalize = originalNormalize;
            }
        });

        /**
         * Test lines 369-370: Unsupported normalized input type
         */
        it('should handle unsupported normalized input type (lines 369-370)', () => {
            // Mock normalize to return unsupported type
            const originalNormalize = strategy.normalize;
            strategy.normalize = jest.fn().mockReturnValue({
                normalizedInput: BigInt(123) as any,
                appliedTransforms: [],
                metadata: {}
            });
            
            try {
                const result = strategy.parse('test', context);
                expect(result.success).toBe(false);
                expect(result.error?.message).toContain('Cannot parse normalized input of type');
            } finally {
                strategy.normalize = originalNormalize;
            }
        });

        /**
         * Test lines 482-485: Date parsing with invalid date
         */
        it('should handle Date parsing with invalid date (lines 482-485)', () => {
            const result = strategy.parse('invalid-date-string', context);
            expect(result.success).toBe(false);
        });

        /**
         * Test lines 487-488: parseFloat returns non-finite
         */
        it('should handle parseFloat returning non-finite (lines 487-488)', () => {
            const result = strategy.parse('not-a-number-string', context);
            expect(result.success).toBe(false);
        });

        /**
         * Test lines 553-562: Invalid Date object in parseAsDate
         */
        it('should handle invalid Date object in parseAsDate (lines 553-562)', () => {
            const invalidDate = new Date('invalid');
            const result = strategy.parse(invalidDate, context);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('Invalid number: NaN');
        });

        /**
         * Test lines 190-191: Boolean input error
         */
        it('should throw error for boolean input (lines 190-191)', () => {
            expect(() => {
                strategy.normalize(true as any, context);
            }).toThrow('Boolean input is not supported for temporal values');
        });

        /**
         * Test lines 193-197: BigInt conversion with precision loss
         */
        it('should handle BigInt conversion with precision loss (lines 193-197)', () => {
            const largeBigInt = BigInt('9007199254740993'); // MAX_SAFE_INTEGER + 2
            
            const result = strategy.normalize(largeBigInt as any, context);
            expect(result.appliedTransforms).toContain('bigint-to-number');
            expect(result.appliedTransforms).toContain('precision-loss-warning');
        });

        /**
         * Test BigInt conversion without precision loss
         */
        it('should handle BigInt conversion without precision loss', () => {
            const safeBigInt = BigInt(123456);
            
            const result = strategy.normalize(safeBigInt as any, context);
            expect(result.appliedTransforms).toContain('bigint-to-number');
            expect(result.appliedTransforms).not.toContain('precision-loss-warning');
        });

        /**
         * Test object with valueOf method that throws during checking
         */
        it('should handle valueOf method that throws during checking', () => {
            const objWithThrowingValueOfCheck = {
                get valueOf() {
                    throw new Error('valueOf getter failed');
                }
            };
            
            const result = strategy.normalize(objWithThrowingValueOfCheck as any, context);
            expect(result.appliedTransforms).toContain('object-string-conversion');
        });

        /**
         * Test object with toString method that throws during checking
         */
        it('should handle toString method that throws during checking', () => {
            const objWithThrowingToStringCheck = {
                someProperty: 'value'
            };
            
            // Delete toString to simulate checking failure
            delete (objWithThrowingToStringCheck as any).toString;
            
            const result = strategy.normalize(objWithThrowingToStringCheck as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });

        /**
         * Test object with valueOf returning number
         */
        it('should handle object with valueOf returning number', () => {
            const objWithNumberValueOf = {
                valueOf() {
                    return 1640995200000;
                }
            };
            
            const result = strategy.normalize(objWithNumberValueOf as any, context);
            expect(result.appliedTransforms).toContain('object-valueof');
        });

        /**
         * Test object with valueOf returning string
         */
        it('should handle object with valueOf returning string', () => {
            const objWithStringValueOf = {
                valueOf() {
                    return '2023-01-01T00:00:00Z';
                }
            };
            
            const result = strategy.normalize(objWithStringValueOf as any, context);
            expect(result.appliedTransforms).toContain('object-valueof');
        });

        /**
         * Test object with toDate returning valid Date
         */
        it('should handle object with toDate returning valid Date', () => {
            const objWithValidToDate = {
                toDate() {
                    return new Date('2023-01-01T00:00:00Z');
                }
            };
            
            const result = strategy.normalize(objWithValidToDate as any, context);
            expect(result.appliedTransforms).toContain('object-todate');
        });

        /**
         * Test object with toDate that throws
         */
        it('should handle object with toDate that throws', () => {
            const objWithThrowingToDate = {
                toDate() {
                    throw new Error('toDate failed');
                }
            };
            
            const result = strategy.normalize(objWithThrowingToDate as any, context);
            expect(result.appliedTransforms).toContain('object-json-stringify');
        });
    });
});