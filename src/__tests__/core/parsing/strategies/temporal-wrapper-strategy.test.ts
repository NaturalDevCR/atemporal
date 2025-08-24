/**
 * @file Tests for TemporalWrapperStrategy
 */

import { Temporal } from '@js-temporal/polyfill';
import { TemporalWrapperStrategy } from '../../../../core/parsing/strategies/temporal-wrapper-strategy';
import { TemporalWrapper } from '../../../../TemporalWrapper';
import type { ParseContext, ParseStrategyType } from '../../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('TemporalWrapperStrategy', () => {
    let strategy: TemporalWrapperStrategy;
    let context: ParseContext;
    let validWrapper: TemporalWrapper;
    let validDateTime: Temporal.ZonedDateTime;

    beforeEach(() => {
        strategy = new TemporalWrapperStrategy();
        
        // Create a valid ZonedDateTime for testing
        validDateTime = Temporal.ZonedDateTime.from('2023-01-01T00:00:00Z[UTC]');
        
        // Create a valid TemporalWrapper for testing
        validWrapper = TemporalWrapper.from(validDateTime);
        
        context = {
            input: validWrapper as any,
            options: {
                timeZone: 'UTC',
                strict: false
            },
            inferredType: 'temporal-wrapper' as ParseStrategyType,
            confidence: 0.98,
            metadata: {},
            startTime: performance.now()
        };
    });

    describe('basic properties', () => {
        it('should have correct type', () => {
            expect(strategy.type).toBe('temporal-wrapper');
        });

        it('should have high priority', () => {
            expect(strategy.priority).toBe(90);
        });

        it('should have meaningful description', () => {
            expect(strategy.description).toBe('Parse TemporalWrapper objects (already parsed temporal data)');
            expect(typeof strategy.description).toBe('string');
            expect(strategy.description.length).toBeGreaterThan(0);
        });
    });

    describe('canHandle', () => {
        it('should handle valid TemporalWrapper objects', () => {
            expect(strategy.canHandle(validWrapper as any, context)).toBe(true);
        });

        it('should not handle non-TemporalWrapper objects', () => {
            const invalidInputs = [
                '2023-01-01',
                1640995200000,
                new Date(),
                [2023, 1, 1],
                {},
                null,
                undefined,
                true,
                false,
                validDateTime // Raw ZonedDateTime, not wrapped
            ];
            
            invalidInputs.forEach(input => {
                expect(strategy.canHandle(input, context)).toBe(false);
            });
        });

        it('should handle TemporalWrapper with different datetime types', () => {
            // Create wrapper with different datetime types
            const plainDateTime = Temporal.PlainDateTime.from('2023-01-01T00:00:00');
            const zonedDateTime = Temporal.ZonedDateTime.from('2023-01-01T00:00:00Z[UTC]');
            
            const wrapperWithPlain = TemporalWrapper.from(plainDateTime);
            const wrapperWithZoned = TemporalWrapper.from(zonedDateTime);
            
            expect(strategy.canHandle(wrapperWithPlain as any, context)).toBe(true);
            expect(strategy.canHandle(wrapperWithZoned as any, context)).toBe(true);
        });
    });

    describe('getConfidence', () => {
        it('should return 0 for non-TemporalWrapper objects', () => {
            const invalidInputs = [
                '2023-01-01',
                1640995200000,
                new Date(),
                {},
                null,
                undefined
            ];
            
            invalidInputs.forEach(input => {
                expect(strategy.getConfidence(input, context)).toBe(0);
            });
        });

        it('should return high confidence for valid TemporalWrapper objects', () => {
            expect(strategy.getConfidence(validWrapper as any, context)).toBe(0.98);
        });

        it('should return low confidence for invalid TemporalWrapper objects', () => {
            // Create invalid wrapper (mock object)
            const invalidWrapper = {
                datetime: null
            } as unknown as TemporalWrapper;
            
            // Mock isTemporalWrapper to return true for this test
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            expect(strategy.getConfidence(invalidWrapper as any, context)).toBe(0.1);
            
            // Restore original method
            (strategy as any).canHandle = originalCanHandle;
        });

        it('should return low confidence for wrapper with missing epochNanoseconds', () => {
            // Create wrapper with invalid datetime
            const invalidDateTime = {
                timeZoneId: 'UTC',
                calendarId: 'iso8601'
                // Missing epochNanoseconds
            } as unknown as Temporal.ZonedDateTime;
            
            const invalidWrapper = {
                datetime: invalidDateTime
            } as unknown as TemporalWrapper;
            
            // Mock isTemporalWrapper to return true
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            expect(strategy.getConfidence(invalidWrapper as any, context)).toBe(0.1);
            
            (strategy as any).canHandle = originalCanHandle;
        });

        it('should handle errors gracefully when accessing datetime properties', () => {
            // Create wrapper that throws when accessing datetime
            const throwingWrapper = {
                get datetime() {
                    throw new Error('Access error');
                }
            } as unknown as TemporalWrapper;
            
            // Mock isTemporalWrapper to return true
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            expect(strategy.getConfidence(throwingWrapper as any, context)).toBe(0.1);
            
            (strategy as any).canHandle = originalCanHandle;
        });
    });

    describe('validate', () => {
        it('should validate valid TemporalWrapper objects', () => {
            const result = strategy.validate(validWrapper as any, context);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.suggestedStrategy).toBe('temporal-wrapper');
            expect(result.confidence).toBe(0.98);
        });

        it('should reject non-TemporalWrapper objects', () => {
            const result = strategy.validate('2023-01-01', context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Input is not a TemporalWrapper object');
            expect(result.suggestedStrategy).toBe('fallback');
            expect(result.confidence).toBe(0);
        });

        it('should reject TemporalWrapper with missing datetime', () => {
            const invalidWrapper = {
                datetime: null
            } as unknown as TemporalWrapper;
            
            // Mock canHandle to return true
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            const result = strategy.validate(invalidWrapper as any, context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('TemporalWrapper missing datetime property');
            
            (strategy as any).canHandle = originalCanHandle;
        });

        it('should reject TemporalWrapper with invalid datetime object', () => {
            const invalidWrapper = {
                datetime: {
                    // Missing epochNanoseconds
                    timeZoneId: 'UTC'
                }
            } as unknown as TemporalWrapper;
            
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            const result = strategy.validate(invalidWrapper as any, context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('TemporalWrapper datetime object missing epochNanoseconds');
            
            (strategy as any).canHandle = originalCanHandle;
        });

        it('should warn about missing timeZoneId', () => {
            const wrapperWithoutTimezone = {
                datetime: {
                    epochNanoseconds: validDateTime.epochNanoseconds,
                    calendarId: 'iso8601'
                    // Missing timeZoneId
                }
            } as unknown as TemporalWrapper;
            
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            const result = strategy.validate(wrapperWithoutTimezone as any, context);
            
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('TemporalWrapper datetime object missing timeZoneId');
            
            (strategy as any).canHandle = originalCanHandle;
        });

        it('should warn about missing calendarId', () => {
            const wrapperWithoutCalendar = {
                datetime: {
                    epochNanoseconds: validDateTime.epochNanoseconds,
                    timeZoneId: 'UTC'
                    // Missing calendarId
                }
            } as unknown as TemporalWrapper;
            
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            const result = strategy.validate(wrapperWithoutCalendar as any, context);
            
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('TemporalWrapper datetime object missing calendarId');
            
            (strategy as any).canHandle = originalCanHandle;
        });

        it('should handle validation errors gracefully', () => {
            const throwingWrapper = {
                get datetime() {
                    throw new Error('Validation error');
                }
            } as unknown as TemporalWrapper;
            
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            const result = strategy.validate(throwingWrapper as any, context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid temporal object: Validation error');
            
            (strategy as any).canHandle = originalCanHandle;
        });
    });

    describe('normalize', () => {
        it('should normalize valid TemporalWrapper without transformations', () => {
            const result = strategy.normalize(validWrapper as any, context);
            
            expect(result.normalizedInput).toBe(validWrapper);
            expect(result.appliedTransforms).toHaveLength(0);
            expect(result.metadata.originalSource).toBe('TemporalWrapper');
            expect(result.metadata.hasMetadata).toBe(false);
            expect(result.metadata.transformCount).toBe(0);
        });

        it('should track timezone conversion needs', () => {
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.normalize(validWrapper as any, timezoneContext);
            
            expect(result.appliedTransforms).toContain('timezone-conversion-needed');
            expect(result.metadata.targetTimezone).toBe('America/New_York');
            expect(result.metadata.sourceTimezone).toBe('UTC');
            expect(result.metadata.transformCount).toBe(1);
        });

        it('should track calendar conversion needs', () => {
            const calendarContext = {
                ...context,
                options: { ...context.options, calendar: 'hebrew' }
            };
            
            const result = strategy.normalize(validWrapper as any, calendarContext);
            
            expect(result.appliedTransforms).toContain('calendar-conversion-needed');
            expect(result.metadata.targetCalendar).toBe('hebrew');
            expect(result.metadata.sourceCalendar).toBe('iso8601');
            expect(result.metadata.transformCount).toBe(1);
        });

        it('should track both timezone and calendar conversion needs', () => {
            const conversionContext = {
                ...context,
                options: {
                    ...context.options,
                    timeZone: 'Europe/London',
                    calendar: 'buddhist'
                }
            };
            
            const result = strategy.normalize(validWrapper as any, conversionContext);
            
            expect(result.appliedTransforms).toContain('timezone-conversion-needed');
            expect(result.appliedTransforms).toContain('calendar-conversion-needed');
            expect(result.metadata.transformCount).toBe(2);
        });

        it('should not track conversion when timezone matches', () => {
            const sameTimezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'UTC' }
            };
            
            const result = strategy.normalize(validWrapper as any, sameTimezoneContext);
            
            expect(result.appliedTransforms).not.toContain('timezone-conversion-needed');
            expect(result.metadata.transformCount).toBe(0);
        });

        it('should not track conversion when calendar matches', () => {
            const sameCalendarContext = {
                ...context,
                options: { ...context.options, calendar: 'iso8601' }
            };
            
            const result = strategy.normalize(validWrapper as any, sameCalendarContext);
            
            expect(result.appliedTransforms).not.toContain('calendar-conversion-needed');
            expect(result.metadata.transformCount).toBe(0);
        });

        it('should handle wrapper without timeZoneId gracefully', () => {
            const wrapperWithoutTimezone = {
                datetime: {
                    epochNanoseconds: validDateTime.epochNanoseconds,
                    calendarId: 'iso8601'
                    // Missing timeZoneId
                }
            } as unknown as TemporalWrapper;
            
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.normalize(wrapperWithoutTimezone as any, timezoneContext);
            
            expect(result.appliedTransforms).not.toContain('timezone-conversion-needed');
        });

        it('should handle wrapper without calendarId gracefully', () => {
            const wrapperWithoutCalendar = {
                datetime: {
                    epochNanoseconds: validDateTime.epochNanoseconds,
                    timeZoneId: 'UTC'
                    // Missing calendarId
                }
            } as unknown as TemporalWrapper;
            
            const calendarContext = {
                ...context,
                options: { ...context.options, calendar: 'hebrew' }
            };
            
            const result = strategy.normalize(wrapperWithoutCalendar as any, calendarContext);
            
            expect(result.appliedTransforms).not.toContain('calendar-conversion-needed');
        });
    });

    describe('parse', () => {
        it('should parse valid TemporalWrapper objects', () => {
            const result = strategy.parse(validWrapper as any, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(1);
                expect(result.data.day).toBe(1);
                expect(result.data.timeZoneId).toBe('UTC');
                expect(result.strategy).toBe('temporal-wrapper');
                expect(result.confidence).toBe(0.98);
            }
        });

        it('should parse with timezone conversion', () => {
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.parse(validWrapper as any, timezoneContext);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.timeZoneId).toBe('America/New_York');
                expect(result.data.year).toBe(2022); // Different year due to timezone
            }
        });

        it('should parse with calendar conversion', () => {
            const calendarContext = {
                ...context,
                options: { ...context.options, calendar: 'hebrew' }
            };
            
            const result = strategy.parse(validWrapper as any, calendarContext);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.calendarId).toBe('hebrew');
            }
        });

        it('should parse with both timezone and calendar conversion', () => {
            const conversionContext = {
                ...context,
                options: {
                    ...context.options,
                    timeZone: 'Asia/Tokyo',
                    calendar: 'japanese'
                }
            };
            
            const result = strategy.parse(validWrapper as any, conversionContext);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.timeZoneId).toBe('Asia/Tokyo');
                expect(result.data.calendarId).toBe('japanese');
            }
        });

        it('should handle invalid TemporalWrapper objects', () => {
            const invalidWrapper = {
                datetime: null
            } as unknown as TemporalWrapper;
            
            const result = strategy.parse(invalidWrapper as any, context);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
                expect(result.error?.code).toBe('TEMPORAL_WRAPPER_PARSE_ERROR');
                expect(result.error?.message).toContain('Invalid TemporalWrapper object');
                expect(result.strategy).toBe('temporal-wrapper');
            }
        });

        it('should handle parsing errors gracefully', () => {
            const throwingWrapper = {
                get datetime() {
                    throw new Error('Parse error');
                }
            } as unknown as TemporalWrapper;
            
            const result = strategy.parse(throwingWrapper as any, context);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
                expect(result.error?.message).toContain('Parse error');
            }
        });

        it('should measure execution time', () => {
            const result = strategy.parse(validWrapper as any, context);
            
            expect(result.executionTime).toBeGreaterThan(0);
            expect(typeof result.executionTime).toBe('number');
        });

        it('should handle performance timing errors gracefully', () => {
            const originalPerformance = global.performance;
            
            try {
                global.performance = {
                ...originalPerformance,
                now: jest.fn().mockImplementation(() => {
                    throw new Error('Performance API error');
                }) as any
            } as any;
                
                const result = strategy.parse(validWrapper as any, context);
                
                // Should still succeed despite timing error
                expect(result.success).toBe(true);
            } finally {
                global.performance = originalPerformance;
            }
        });

        it('should handle timezone conversion errors', () => {
            const invalidTimezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'Invalid/Timezone' }
            };
            
            const result = strategy.parse(validWrapper as any, invalidTimezoneContext);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
            }
        });

        it('should handle calendar conversion errors', () => {
            const invalidCalendarContext = {
                ...context,
                options: { ...context.options, calendar: 'invalid-calendar' }
            };
            
            const result = strategy.parse(validWrapper as any, invalidCalendarContext);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
            }
        });
    });

    describe('checkFastPath', () => {
        it('should not use fast path for non-TemporalWrapper objects', () => {
            const result = strategy.checkFastPath('2023-01-01', context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.strategy).toBe('temporal-wrapper');
            expect(result.confidence).toBe(0);
        });

        it('should use fast path for valid TemporalWrapper without conversions', () => {
            const result = strategy.checkFastPath(validWrapper as any, context);
            
            expect(result.canUseFastPath).toBe(true);
            expect((result as any).data).toBe(validDateTime);
            expect(result.strategy).toBe('temporal-wrapper');
            expect(result.confidence).toBe(0.98);
        });

        it('should not use fast path when timezone conversion is needed', () => {
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.checkFastPath(validWrapper as any, timezoneContext);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.strategy).toBe('temporal-wrapper');
            expect(result.confidence).toBe(0.98);
        });

        it('should not use fast path when calendar conversion is needed', () => {
            const calendarContext = {
                ...context,
                options: { ...context.options, calendar: 'hebrew' }
            };
            
            const result = strategy.checkFastPath(validWrapper as any, calendarContext);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.strategy).toBe('temporal-wrapper');
            expect(result.confidence).toBe(0.98);
        });

        it('should use fast path for PlainDateTime objects (converted to ZonedDateTime)', () => {
            const plainDateTime = Temporal.PlainDateTime.from('2023-01-01T00:00:00');
            const wrapperWithPlain = TemporalWrapper.from(plainDateTime);
            
            const result = strategy.checkFastPath(wrapperWithPlain as any, context);
            
            expect(result.canUseFastPath).toBe(true);
            expect(result.strategy).toBe('temporal-wrapper');
        });

        it('should handle same timezone and calendar correctly', () => {
            const sameContext = {
                ...context,
                options: {
                    ...context.options,
                    timeZone: 'UTC',
                    calendar: 'iso8601'
                }
            };
            
            const result = strategy.checkFastPath(validWrapper as any, sameContext);
            
            expect(result.canUseFastPath).toBe(true);
            expect((result as any).data).toBe(validDateTime);
        });
    });

    describe('getOptimizationHints', () => {
        it('should provide low complexity hints for valid TemporalWrapper without conversions', () => {
            const hints = strategy.getOptimizationHints(validWrapper as any, context);
            
            expect(hints.preferredStrategy).toBe('temporal-wrapper');
            expect(hints.shouldCache).toBe(false);
            expect(hints.canUseFastPath).toBe(true);
            expect(hints.estimatedComplexity).toBe('low');
            expect(hints.suggestedOptions.enableFastPath).toBe(true);
            expect(hints.suggestedOptions.enableCaching).toBe(false);
            expect(hints.warnings).toContain('TemporalWrapper objects are already parsed - caching not beneficial');
        });

        it('should provide medium complexity hints when conversion is needed', () => {
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const hints = strategy.getOptimizationHints(validWrapper as any, timezoneContext);
            
            expect(hints.estimatedComplexity).toBe('medium');
            expect(hints.canUseFastPath).toBe(false);
            expect(hints.warnings).toContain('Timezone or calendar conversion required');
        });

        it('should provide low complexity hints for PlainDateTime objects (converted to ZonedDateTime)', () => {
            const plainDateTime = Temporal.PlainDateTime.from('2023-01-01T00:00:00');
            const wrapperWithPlain = TemporalWrapper.from(plainDateTime);
            
            const hints = strategy.getOptimizationHints(wrapperWithPlain as any, context);
            
            expect(hints.estimatedComplexity).toBe('low');
            expect(hints.canUseFastPath).toBe(true);
        });

        it('should provide high complexity hints for invalid TemporalWrapper', () => {
            const invalidWrapper = {
                datetime: null
            } as unknown as TemporalWrapper;
            
            // Mock canHandle and getConfidence
            const originalCanHandle = strategy.canHandle;
            const originalGetConfidence = strategy.getConfidence;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            (strategy as any).getConfidence = jest.fn().mockReturnValue(0.1);
            
            const hints = strategy.getOptimizationHints(invalidWrapper as any, context);
            
            expect(hints.estimatedComplexity).toBe('high');
            expect(hints.warnings).toContain('Invalid TemporalWrapper requires error handling');
            expect(hints.warnings).toContain('Low confidence parsing - invalid TemporalWrapper');
            
            strategy.canHandle = originalCanHandle;
            strategy.getConfidence = originalGetConfidence;
        });

        it('should provide warnings for objects with epochNanoseconds but not ZonedDateTime', () => {
            const customWrapper = {
                datetime: {
                    epochNanoseconds: validDateTime.epochNanoseconds,
                    timeZoneId: 'UTC',
                    calendarId: 'iso8601'
                }
            } as unknown as TemporalWrapper;
            
            const originalCanHandle = strategy.canHandle;
            (strategy as any).canHandle = jest.fn().mockReturnValue(true);
            
            const hints = strategy.getOptimizationHints(customWrapper as any, context);
            
            expect(hints.estimatedComplexity).toBe('medium');
            expect(hints.warnings).toContain('ZonedDateTime reconstruction required');
            
            strategy.canHandle = originalCanHandle;
        });

        it('should always recommend against caching', () => {
            const hints = strategy.getOptimizationHints(validWrapper as any, context);
            
            expect(hints.shouldCache).toBe(false);
            expect(hints.suggestedOptions.enableCaching).toBe(false);
            expect(hints.warnings).toContain('TemporalWrapper objects are already parsed - caching not beneficial');
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle TemporalWrapper with custom properties', () => {
            const customWrapper = TemporalWrapper.from(validDateTime);
            (customWrapper as any).customProperty = 'custom-value';
            
            const result = strategy.parse(customWrapper as any, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
            }
        });

        it('should handle context modifications during parsing', () => {
            const modifiableContext = { ...context };
            const result = strategy.parse(validWrapper as any, modifiableContext);
            
            // Create new context with modified timezone (cannot modify read-only property)
            const modifiedContext = {
                ...modifiableContext,
                options: { ...modifiableContext.options, timeZone: 'America/New_York' }
            };
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                // Should use original timezone
                expect(result.data.timeZoneId).toBe('UTC');
            }
        });

        it('should handle TemporalWrapper with different Temporal types', () => {
            const instant = Temporal.Instant.from('2023-01-01T00:00:00Z');
            const plainDate = Temporal.PlainDate.from('2023-01-01');
            const plainTime = Temporal.PlainTime.from('00:00:00');
            
            const wrapperWithInstant = TemporalWrapper.from(instant as any);
            const wrapperWithPlainDate = TemporalWrapper.from(plainDate as any);
            const wrapperWithPlainTime = TemporalWrapper.from(plainTime as any);
            
            // These should all be handled, though may require conversion
            expect(strategy.canHandle(wrapperWithInstant as any, context)).toBe(true);
            expect(strategy.canHandle(wrapperWithPlainDate as any, context)).toBe(true);
            expect(strategy.canHandle(wrapperWithPlainTime as any, context)).toBe(true);
        });

        it('should handle TemporalWrapper with null datetime gracefully', () => {
            const nullWrapper = {
                datetime: null
            } as unknown as TemporalWrapper;
            
            // Should not be handled by canHandle
            expect(strategy.canHandle(nullWrapper as any, context)).toBe(false);
        });

        it('should handle TemporalWrapper with undefined datetime gracefully', () => {
            const undefinedWrapper = {
                datetime: undefined
            } as unknown as TemporalWrapper;
            
            expect(strategy.canHandle(undefinedWrapper as any, context)).toBe(false);
        });
    });

    describe('integration scenarios', () => {
        it('should work with different timezone combinations', () => {
            const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
            
            timezones.forEach(sourceTimezone => {
                const sourceDateTime = Temporal.ZonedDateTime.from(`2023-06-15T12:00:00[${sourceTimezone}]`);
                const sourceWrapper = TemporalWrapper.from(sourceDateTime);
                
                timezones.forEach(targetTimezone => {
                    const targetContext = {
                        ...context,
                        options: { ...context.options, timeZone: targetTimezone }
                    };
                    
                    const result = strategy.parse(sourceWrapper as any, targetContext);
                    
                    expect(result.success).toBe(true);
                    if (result.success && result.data) {
                        expect(result.data.timeZoneId).toBe(targetTimezone);
                    }
                });
            });
        });

        it('should work with different calendar combinations', () => {
            const calendars = ['iso8601', 'hebrew', 'islamic', 'buddhist'];
            
            calendars.forEach(sourceCalendar => {
                const sourceDateTime = validDateTime.withCalendar(sourceCalendar);
                const sourceWrapper = TemporalWrapper.from(sourceDateTime);
                
                calendars.forEach(targetCalendar => {
                    const targetContext = {
                        ...context,
                        options: { ...context.options, calendar: targetCalendar }
                    };
                    
                    const result = strategy.parse(sourceWrapper as any, targetContext);
                    
                    expect(result.success).toBe(true);
                    if (result.success && result.data) {
                        expect(result.data.calendarId).toBe(targetCalendar);
                    }
                });
            });
        });

        it('should handle DST transitions correctly', () => {
            // Create datetime during DST transition
            const dstDateTime = Temporal.ZonedDateTime.from('2023-03-12T02:30:00[America/New_York]');
            const dstWrapper = TemporalWrapper.from(dstDateTime);
            
            const result = strategy.parse(dstWrapper as any, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
            }
        });

        it('should handle leap year dates correctly', () => {
            const leapYearDateTime = Temporal.ZonedDateTime.from('2024-02-29T00:00:00Z[UTC]');
            const leapYearWrapper = TemporalWrapper.from(leapYearDateTime);
            
            const result = strategy.parse(leapYearWrapper as any, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.month).toBe(2);
                expect(result.data.day).toBe(29);
                expect(result.data.year).toBe(2024);
            }
        });
    });
});