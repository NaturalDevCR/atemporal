/**
 * @file Temporal PlainDateTime parsing strategy for handling Temporal.PlainDateTime inputs
 */

import { Temporal } from "@js-temporal/polyfill";
import type { TemporalInput } from "../../../types/enhanced-types";
import { TemporalParseError } from "../../../types/enhanced-types";
import { DEFAULT_TEMPORAL_CONFIG } from "../../../types/index";
import { TemporalWrapper } from "../../../TemporalWrapper";
import type {
  ParseStrategy,
  ParseStrategyType,
  ParseResult,
  ParseValidationResult,
  ParseNormalizationResult,
  ParseConversionResult,
  ParseContext,
  ParseOptimizationHints,
  FastPathResult,
} from "../parsing-types";
import { createParseResult, createParseError } from "../parsing-types";

/**
 * Strategy for parsing Temporal.PlainDateTime inputs
 */
export class TemporalPlainDateTimeStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = "temporal-plain-datetime";
  readonly priority = 85;
  readonly description = "Parse Temporal.PlainDateTime instances";

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return input instanceof Temporal.PlainDateTime;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }
    return 0.9; // High confidence for Temporal.PlainDateTime
  }

  /**
   * Check if this strategy can handle the input quickly
   */
  checkFastPath(input: TemporalInput, context: ParseContext): FastPathResult {
    if (!this.canHandle(input, context)) {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0,
      };
    }

    const plainDateTime = input as Temporal.PlainDateTime;
    const timeZone = context.options.timeZone || "UTC";

    // Fast path for PlainDateTime conversion to ZonedDateTime
    try {
      const result = plainDateTime.toZonedDateTime(timeZone);
      return {
        canUseFastPath: true,
        data: result,
        strategy: this.type,
        confidence: 0.9,
      };
    } catch {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0,
      };
    }
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.canHandle(input, context)) {
      errors.push("Input is not a Temporal.PlainDateTime");
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: "fallback",
        confidence: 0,
        errors,
        warnings,
      };
    }

    const plainDateTime = input as Temporal.PlainDateTime;

    // Check if the PlainDateTime is valid
    try {
      plainDateTime.toString();
    } catch (error) {
      errors.push("Invalid Temporal.PlainDateTime");
    }

    // Warn if no timezone context is provided
    if (!context.options.timeZone) {
      warnings.push("No timezone specified, will use default timezone");
    }

    return {
      isValid: errors.length === 0,
      normalizedInput: input,
      suggestedStrategy: this.type,
      confidence: this.getConfidence(input, context),
      errors,
      warnings,
    };
  }

  /**
   * Normalize input for parsing
   */
  normalize(
    input: TemporalInput,
    context: ParseContext
  ): ParseNormalizationResult {
    return {
      normalizedInput: input,
      appliedTransforms: [],
      metadata: {
        originalType: "Temporal.PlainDateTime",
      },
    };
  }

  /**
   * Convert input to intermediate format
   */
  convert(input: TemporalInput, context: ParseContext): ParseConversionResult {
    const plainDateTime = input as Temporal.PlainDateTime;
    const timeZone =
      context.options.timeZone ||
      (DEFAULT_TEMPORAL_CONFIG as any).defaultTimeZone;
    const zonedDateTime = plainDateTime.toZonedDateTime(timeZone);

    return {
      result: zonedDateTime,
      intermediateSteps: ["temporal-plain-datetime"],
      appliedOptions: context.options,
      metadata: {
        year: plainDateTime.year,
        month: plainDateTime.month,
        day: plainDateTime.day,
        hour: plainDateTime.hour,
        minute: plainDateTime.minute,
        second: plainDateTime.second,
        timeZone: timeZone,
      },
    };
  }

  /**
   * Parse input to ZonedDateTime
   */
  parse(input: TemporalInput, context: ParseContext): ParseResult {
    let startTime: number;
    try {
      startTime = performance.now();
    } catch {
      startTime = Date.now();
    }

    try {
      const plainDateTime = input as Temporal.PlainDateTime;
      const timeZone =
        context.options.timeZone ||
        (DEFAULT_TEMPORAL_CONFIG as any).defaultTimeZone;

      // Convert PlainDateTime to ZonedDateTime
      const result = plainDateTime.toZonedDateTime(timeZone);

      let executionTime: number;
      try {
        executionTime = performance.now() - startTime;
      } catch {
        executionTime = Date.now() - startTime;
      }

      return createParseResult(
        result,
        this.type,
        executionTime,
        false,
        this.getConfidence(input, context)
      );
    } catch (error) {
      let executionTime: number;
      try {
        executionTime = performance.now() - startTime;
      } catch {
        executionTime = Date.now() - startTime;
      }

      const parseError =
        error instanceof Error
          ? new TemporalParseError(
              error.message,
              input,
              "TEMPORAL_PLAIN_DATETIME_PARSE_ERROR"
            )
          : new TemporalParseError(
              "Unknown error parsing Temporal.PlainDateTime",
              input,
              "UNKNOWN_ERROR"
            );

      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Get optimization hints for this strategy
   */
  getOptimizationHints(
    input: TemporalInput,
    context: ParseContext
  ): ParseOptimizationHints {
    return {
      preferredStrategy: this.type,
      shouldCache: false, // Temporal.PlainDateTime parsing is very fast
      canUseFastPath: true,
      estimatedComplexity: "low",
      suggestedOptions: {
        timeZone:
          context.options.timeZone ||
          (DEFAULT_TEMPORAL_CONFIG as any).defaultTimeZone,
      },
      warnings: context.options.timeZone
        ? []
        : ["Consider specifying a timezone for more predictable results"],
    };
  }
}
