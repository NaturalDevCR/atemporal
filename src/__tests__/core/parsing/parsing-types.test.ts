/**
 * @file Comprehensive test suite for parsing types and utilities
 * Tests all type definitions, constants, and utility functions
 */

import { Temporal } from '@js-temporal/polyfill';
import {
    PARSE_STRATEGIES,
    PARSE_PRIORITIES,
    PARSE_THRESHOLDS,
    PARSE_PATTERNS,
    createParseContext,
    createParseResult,
    createParseError,
    isParseSuccess,
    isParseError,
    normalizeParseInput,
    validateParseOptions,
    getStrategyInfo,
    sortStrategiesByPriority,
    matchesPattern,
    inferStrategyType,
    type ParseStrategyType,
    type ParseStatus,
    type ParseContext,
    type ParseResult,
    type ParseOptions,
    type ParseMetrics,
    type ParseStrategy
} from '../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../types/enhanced-types';

describe('Parsing Types and Utilities', () => {
    describe('Constants', () => {
        describe('PARSE_STRATEGIES', () => {
            it('should have all required strategy types', () => {
                const expectedTypes: ParseStrategyType[] = [
                    'temporal-wrapper', 'temporal-zoned', 'temporal-instant',
                    'temporal-plain-datetime', 'temporal-plain-date', 'date',
                    'firebase-timestamp', 'number', 'string', 'temporal-like',
                    'array-like', 'fallback'
                ];
                
                expectedTypes.forEach(type => {
                    expect(PARSE_STRATEGIES).toHaveProperty(type);
                    expect(typeof PARSE_STRATEGIES[type].priority).toBe('number');
                    expect(typeof PARSE_STRATEGIES[type].description).toBe('string');
                });
            });

            it('should have logical priority ordering', () => {
                expect(PARSE_STRATEGIES['temporal-wrapper'].priority).toBeGreaterThan(
                    PARSE_STRATEGIES['temporal-zoned'].priority
                );
                expect(PARSE_STRATEGIES['temporal-zoned'].priority).toBeGreaterThan(
                    PARSE_STRATEGIES['date'].priority
                );
                expect(PARSE_STRATEGIES['date'].priority).toBeGreaterThan(
                    PARSE_STRATEGIES['string'].priority
                );
                expect(PARSE_STRATEGIES['string'].priority).toBeGreaterThan(
                    PARSE_STRATEGIES['fallback'].priority
                );
            });

            it('should have meaningful descriptions', () => {
                Object.values(PARSE_STRATEGIES).forEach(strategy => {
                    expect(strategy.description.length).toBeGreaterThan(0);
                    expect(strategy.description).not.toContain('undefined');
                });
            });
        });

        describe('PARSE_PRIORITIES', () => {
            it('should have correct priority levels', () => {
                expect(PARSE_PRIORITIES.CRITICAL).toBe(100);
                expect(PARSE_PRIORITIES.HIGH).toBe(80);
                expect(PARSE_PRIORITIES.MEDIUM).toBe(60);
                expect(PARSE_PRIORITIES.LOW).toBe(40);
                expect(PARSE_PRIORITIES.FALLBACK).toBe(1);
            });

            it('should have decreasing priority order', () => {
                expect(PARSE_PRIORITIES.CRITICAL).toBeGreaterThan(PARSE_PRIORITIES.HIGH);
                expect(PARSE_PRIORITIES.HIGH).toBeGreaterThan(PARSE_PRIORITIES.MEDIUM);
                expect(PARSE_PRIORITIES.MEDIUM).toBeGreaterThan(PARSE_PRIORITIES.LOW);
                expect(PARSE_PRIORITIES.LOW).toBeGreaterThan(PARSE_PRIORITIES.FALLBACK);
            });
        });

        describe('PARSE_THRESHOLDS', () => {
            it('should have performance thresholds', () => {
                expect(PARSE_THRESHOLDS.FAST_PATH_MAX_TIME).toBe(1);
                expect(PARSE_THRESHOLDS.ACCEPTABLE_PARSE_TIME).toBe(5);
                expect(PARSE_THRESHOLDS.SLOW_PARSE_TIME).toBe(20);
                expect(PARSE_THRESHOLDS.CACHE_HIT_TARGET).toBe(0.8);
                expect(PARSE_THRESHOLDS.SUCCESS_RATE_TARGET).toBe(0.95);
                expect(PARSE_THRESHOLDS.FAST_PATH_TARGET).toBe(0.6);
            });

            it('should have logical threshold ordering', () => {
                expect(PARSE_THRESHOLDS.FAST_PATH_MAX_TIME).toBeLessThan(
                    PARSE_THRESHOLDS.ACCEPTABLE_PARSE_TIME
                );
                expect(PARSE_THRESHOLDS.ACCEPTABLE_PARSE_TIME).toBeLessThan(
                    PARSE_THRESHOLDS.SLOW_PARSE_TIME
                );
            });
        });

        describe('PARSE_PATTERNS', () => {
            it('should have valid regex patterns', () => {
                expect(PARSE_PATTERNS.ISO_DATE).toBeInstanceOf(RegExp);
                expect(PARSE_PATTERNS.ISO_DATETIME).toBeInstanceOf(RegExp);
                expect(PARSE_PATTERNS.ISO_DATETIME_TZ).toBeInstanceOf(RegExp);
                expect(PARSE_PATTERNS.TIMESTAMP_MS).toBeInstanceOf(RegExp);
                expect(PARSE_PATTERNS.TIMESTAMP_S).toBeInstanceOf(RegExp);
                expect(PARSE_PATTERNS.RELATIVE_TIME).toBeInstanceOf(RegExp);
                expect(PARSE_PATTERNS.HUMAN_READABLE).toBeInstanceOf(RegExp);
            });

            it('should match expected patterns', () => {
                expect(PARSE_PATTERNS.ISO_DATE.test('2023-01-01')).toBe(true);
                expect(PARSE_PATTERNS.ISO_DATE.test('2023-1-1')).toBe(false);
                
                expect(PARSE_PATTERNS.ISO_DATETIME.test('2023-01-01T12:00:00')).toBe(true);
                expect(PARSE_PATTERNS.ISO_DATETIME.test('2023-01-01T12:00:00.123Z')).toBe(true);
                
                expect(PARSE_PATTERNS.ISO_DATETIME_TZ.test('2023-01-01T12:00:00+05:00')).toBe(true);
                expect(PARSE_PATTERNS.ISO_DATETIME_TZ.test('2023-01-01T12:00:00-08:00')).toBe(true);
                
                expect(PARSE_PATTERNS.TIMESTAMP_MS.test('1640995200000')).toBe(true);
                expect(PARSE_PATTERNS.TIMESTAMP_S.test('1640995200')).toBe(true);
                
                expect(PARSE_PATTERNS.HUMAN_READABLE.test('today')).toBe(true);
                expect(PARSE_PATTERNS.HUMAN_READABLE.test('tomorrow')).toBe(true);
                expect(PARSE_PATTERNS.HUMAN_READABLE.test('yesterday')).toBe(true);
                expect(PARSE_PATTERNS.HUMAN_READABLE.test('now')).toBe(true);
            });
        });
    });

    describe('Utility Functions', () => {
        describe('createParseContext', () => {
            it('should create valid parse context with defaults', () => {
                const input = '2023-01-01';
                const context = createParseContext(input);
                
                expect(context.input).toBe(input);
                expect(context.options).toEqual({});
                expect(context.inferredType).toBe('fallback');
                expect(context.confidence).toBe(0);
                expect(typeof context.startTime).toBe('number');
                expect(context.metadata).toEqual({});
            });

            it('should create context with custom parameters', () => {
                const input = new Date();
                const options = { timeZone: 'UTC' };
                const inferredType: ParseStrategyType = 'date';
                const confidence = 0.9;
                
                const context = createParseContext(input, options, inferredType, confidence);
                
                expect(context.input).toBe(input);
                expect(context.options).toBe(options);
                expect(context.inferredType).toBe(inferredType);
                expect(context.confidence).toBe(confidence);
            });
        });

        describe('createParseResult', () => {
            it('should create successful parse result', () => {
                const data = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
                const strategy: ParseStrategyType = 'string';
                const executionTime = 5.5;
                
                const result = createParseResult(data, strategy, executionTime, false, 1);
                
                expect(result.success).toBe(true);
                expect(result.data).toBe(data);
                expect(result.status).toBe('success');
                expect(result.strategy).toBe(strategy);
                expect(result.executionTime).toBe(executionTime);
                expect(result.fromCache).toBe(false);
                expect(result.confidence).toBe(1);
                expect(result.metadata).toEqual({});
            });

            it('should create cached parse result', () => {
                const data = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
                const strategy: ParseStrategyType = 'string';
                const executionTime = 0.1;
                
                const result = createParseResult(data, strategy, executionTime, true, 0.8);
                
                expect(result.success).toBe(true);
                expect(result.status).toBe('cached');
                expect(result.fromCache).toBe(true);
                expect(result.confidence).toBe(0.8);
            });
        });

        describe('createParseError', () => {
            it('should create error parse result', () => {
                const error = new TemporalParseError('Test error', 'invalid-input');
                const strategy: ParseStrategyType = 'string';
                const executionTime = 2.3;
                
                const result = createParseError(error, strategy, executionTime);
                
                expect(result.success).toBe(false);
                expect(result.error).toBe(error);
                expect(result.status).toBe('error');
                expect(result.strategy).toBe(strategy);
                expect(result.executionTime).toBe(executionTime);
                expect(result.fromCache).toBe(false);
                expect(result.confidence).toBe(0);
                expect(result.metadata).toEqual({});
            });
        });

        describe('Type Guards', () => {
            describe('isParseSuccess', () => {
                it('should identify successful parse results', () => {
                    const data = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
                    const successResult = createParseResult(data, 'string', 1.0, false, 1);
                    
                    expect(isParseSuccess(successResult)).toBe(true);
                    
                    if (isParseSuccess(successResult)) {
                        expect(successResult.data).toBe(data);
                    }
                });

                it('should reject error results', () => {
                    const error = new TemporalParseError('Test error', 'invalid');
                    const errorResult = createParseError(error, 'string', 1.0);
                    
                    expect(isParseSuccess(errorResult)).toBe(false);
                });
            });

            describe('isParseError', () => {
                it('should identify error parse results', () => {
                    const error = new TemporalParseError('Test error', 'invalid');
                    const errorResult = createParseError(error, 'string', 1.0);
                    
                    expect(isParseError(errorResult)).toBe(true);
                    
                    if (isParseError(errorResult)) {
                        expect(errorResult.error).toBe(error);
                    }
                });

                it('should reject successful results', () => {
                    const data = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
                    const successResult = createParseResult(data, 'string', 1.0, false, 1);
                    
                    expect(isParseError(successResult)).toBe(false);
                });
            });
        });

        describe('normalizeParseInput', () => {
            it('should handle null and undefined', () => {
                expect(normalizeParseInput(null)).toBe(null);
                expect(normalizeParseInput(undefined)).toBe(undefined);
            });

            it('should normalize string inputs', () => {
                expect(normalizeParseInput('  2023-01-01  ')).toBe('2023-01-01');
                expect(normalizeParseInput('\t\n2023-01-01\t\n')).toBe('2023-01-01');
            });

            it('should handle "now" string', () => {
                const result = normalizeParseInput('now');
                expect(result).toBeInstanceOf(Date);
                
                const result2 = normalizeParseInput('NOW');
                expect(result2).toBeInstanceOf(Date);
                
                const result3 = normalizeParseInput('  Now  ');
                expect(result3).toBeInstanceOf(Date);
            });

            it('should normalize numeric timestamps', () => {
                // Numbers are passed through unchanged - let number strategy handle conversion
                expect(normalizeParseInput(1640995200)).toBe(1640995200);
                
                // Already in milliseconds
                expect(normalizeParseInput(1640995200000)).toBe(1640995200000);
                
                // Very small numbers (likely not timestamps)
                expect(normalizeParseInput(123)).toBe(123);
            });

            it('should pass through other types unchanged', () => {
                const date = new Date();
                const obj = { year: 2023 };
                
                expect(normalizeParseInput(date)).toBe(date);
                expect(normalizeParseInput(obj)).toBe(obj);
            });
        });

        describe('validateParseOptions', () => {
            it('should set default values', () => {
                const options = validateParseOptions({});
                
                expect(options.enableFastPath).toBe(true);
                expect(options.enableCaching).toBe(true);
                expect(options.enableOptimization).toBe(true);
                expect(options.maxRetries).toBe(3);
                expect(options.fallbackStrategy).toBe('fallback');
            });

            it('should preserve existing values', () => {
                const inputOptions: ParseOptions = {
                    enableFastPath: false,
                    enableCaching: false,
                    maxRetries: 5,
                    timeZone: 'America/New_York'
                };
                
                const options = validateParseOptions(inputOptions);
                
                expect(options.enableFastPath).toBe(false);
                expect(options.enableCaching).toBe(false);
                expect(options.maxRetries).toBe(5);
                expect(options.timeZone).toBe('America/New_York');
            });

            it('should clamp maxRetries to valid range', () => {
                expect(validateParseOptions({ maxRetries: -5 }).maxRetries).toBe(0);
                expect(validateParseOptions({ maxRetries: 15 }).maxRetries).toBe(10);
                expect(validateParseOptions({ maxRetries: 5 }).maxRetries).toBe(5);
            });
        });

        describe('getStrategyInfo', () => {
            it('should return info for valid strategy types', () => {
                const info = getStrategyInfo('string');
                
                expect(typeof info.priority).toBe('number');
                expect(typeof info.description).toBe('string');
                expect(info.priority).toBe(PARSE_STRATEGIES.string.priority);
                expect(info.description).toBe(PARSE_STRATEGIES.string.description);
            });

            it('should return default info for invalid strategy types', () => {
                const info = getStrategyInfo('invalid' as ParseStrategyType);
                
                expect(info.priority).toBe(0);
                expect(info.description).toBe('Unknown strategy');
            });
        });

        describe('sortStrategiesByPriority', () => {
            it('should sort strategies by priority (highest first)', () => {
                const strategies: ParseStrategyType[] = ['fallback', 'temporal-wrapper', 'string', 'date'];
                const sorted = sortStrategiesByPriority(strategies);
                
                expect(sorted[0]).toBe('temporal-wrapper'); // Highest priority
                expect(sorted[sorted.length - 1]).toBe('fallback'); // Lowest priority
                
                // Verify order is correct
                for (let i = 0; i < sorted.length - 1; i++) {
                    const currentPriority = getStrategyInfo(sorted[i]).priority;
                    const nextPriority = getStrategyInfo(sorted[i + 1]).priority;
                    expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
                }
            });

            it('should handle empty array', () => {
                const sorted = sortStrategiesByPriority([]);
                expect(sorted).toEqual([]);
            });
        });

        describe('matchesPattern', () => {
            it('should match valid patterns', () => {
                expect(matchesPattern('2023-01-01', PARSE_PATTERNS.ISO_DATE)).toBe(true);
                expect(matchesPattern('2023-01-01T12:00:00', PARSE_PATTERNS.ISO_DATETIME)).toBe(true);
                expect(matchesPattern('1640995200000', PARSE_PATTERNS.TIMESTAMP_MS)).toBe(true);
            });

            it('should reject invalid patterns', () => {
                expect(matchesPattern('invalid-date', PARSE_PATTERNS.ISO_DATE)).toBe(false);
                expect(matchesPattern('2023-1-1', PARSE_PATTERNS.ISO_DATE)).toBe(false);
                expect(matchesPattern('123', PARSE_PATTERNS.TIMESTAMP_MS)).toBe(false);
            });
        });

        describe('inferStrategyType', () => {
            it('should infer temporal-wrapper for TemporalWrapper objects', () => {
                const wrapper = { _isTemporalWrapper: true, value: new Date() };
                const result = inferStrategyType(wrapper);
                
                expect(result.type).toBe('temporal-wrapper');
                expect(result.confidence).toBe(1);
            });

            it('should infer temporal types correctly', () => {
                const zonedDateTime = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
                const instant = Temporal.Instant.from('2023-01-01T00:00:00Z');
                const plainDateTime = Temporal.PlainDateTime.from('2023-01-01T00:00:00');
                const plainDate = Temporal.PlainDate.from('2023-01-01');
                
                expect(inferStrategyType(zonedDateTime)).toEqual({ type: 'temporal-zoned', confidence: 1 });
                expect(inferStrategyType(instant)).toEqual({ type: 'temporal-instant', confidence: 1 });
                expect(inferStrategyType(plainDateTime)).toEqual({ type: 'temporal-plain-datetime', confidence: 1 });
                expect(inferStrategyType(plainDate)).toEqual({ type: 'temporal-plain-date', confidence: 1 });
            });

            it('should infer date type', () => {
                const date = new Date();
                const result = inferStrategyType(date);
                
                expect(result.type).toBe('date');
                expect(result.confidence).toBe(0.9);
            });

            it('should infer firebase-timestamp type', () => {
                const timestamp = { seconds: 1640995200, nanoseconds: 0 };
                const result = inferStrategyType(timestamp);
                
                expect(result.type).toBe('firebase-timestamp');
                expect(result.confidence).toBe(0.9);
            });

            it('should infer number type', () => {
                const result = inferStrategyType(1640995200000);
                
                expect(result.type).toBe('number');
                expect(result.confidence).toBe(0.8);
            });

            it('should infer string type with varying confidence', () => {
                expect(inferStrategyType('2023-01-01T12:00:00+05:00')).toEqual({ type: 'string', confidence: 0.9 });
                expect(inferStrategyType('2023-01-01T12:00:00')).toEqual({ type: 'string', confidence: 0.8 });
                expect(inferStrategyType('2023-01-01')).toEqual({ type: 'string', confidence: 0.7 });
                expect(inferStrategyType('1640995200000')).toEqual({ type: 'string', confidence: 0.6 });
                expect(inferStrategyType('some random string')).toEqual({ type: 'string', confidence: 0.5 });
            });

            it('should infer temporal-like for objects with temporal properties', () => {
                const obj = { year: 2023, month: 1, day: 1 };
                const result = inferStrategyType(obj);
                
                expect(result.type).toBe('temporal-like');
                expect(result.confidence).toBe(0.7);
            });

            it('should infer array-like for objects with length property', () => {
                const arrayLike = { length: 3, 0: 2023, 1: 1, 2: 1 };
                const result = inferStrategyType(arrayLike);
                
                expect(result.type).toBe('array-like');
                expect(result.confidence).toBe(0.6);
            });

            it('should fallback for null, undefined, and unrecognized types', () => {
                expect(inferStrategyType(null)).toEqual({ type: 'fallback', confidence: 0 });
                expect(inferStrategyType(undefined)).toEqual({ type: 'fallback', confidence: 0 });
                expect(inferStrategyType(Symbol('test') as any)).toEqual({ type: 'fallback', confidence: 0.1 });
            });
        });
    });

    describe('Type Definitions', () => {
        it('should create valid ParseContext objects', () => {
            const context: ParseContext = {
                input: '2023-01-01',
                options: { timeZone: 'UTC' },
                inferredType: 'string',
                confidence: 0.8,
                startTime: performance.now(),
                metadata: { source: 'test' }
            };
            
            expect(typeof context.input).toBe('string');
            expect(typeof context.options).toBe('object');
            expect(typeof context.inferredType).toBe('string');
            expect(typeof context.confidence).toBe('number');
            expect(typeof context.startTime).toBe('number');
            expect(typeof context.metadata).toBe('object');
        });

        it('should create valid ParseResult objects', () => {
            const result: ParseResult = {
                success: true,
                data: Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]'),
                status: 'success',
                strategy: 'string',
                executionTime: 5.5,
                fromCache: false,
                confidence: 0.9,
                metadata: {}
            };
            
            expect(typeof result.success).toBe('boolean');
            expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
            expect(typeof result.status).toBe('string');
            expect(typeof result.strategy).toBe('string');
            expect(typeof result.executionTime).toBe('number');
            expect(typeof result.fromCache).toBe('boolean');
            expect(typeof result.confidence).toBe('number');
            expect(typeof result.metadata).toBe('object');
        });

        it('should create valid ParseOptions objects', () => {
            const options: ParseOptions = {
                timeZone: 'UTC',
                locale: 'en-US',
                enableFastPath: true,
                enableCaching: true,
                enableOptimization: true,
                maxRetries: 3,
                fallbackStrategy: 'fallback',
                debugMode: false,
                performanceTracking: true
            };
            
            expect(typeof options.timeZone).toBe('string');
            expect(typeof options.locale).toBe('string');
            expect(typeof options.enableFastPath).toBe('boolean');
            expect(typeof options.enableCaching).toBe('boolean');
            expect(typeof options.enableOptimization).toBe('boolean');
            expect(typeof options.maxRetries).toBe('number');
            expect(typeof options.fallbackStrategy).toBe('string');
            expect(typeof options.debugMode).toBe('boolean');
            expect(typeof options.performanceTracking).toBe('boolean');
        });
    });
});