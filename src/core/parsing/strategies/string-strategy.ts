/**
 * @file String parsing strategy for handling string-based temporal inputs
 */

import { Temporal } from "@js-temporal/polyfill";
import type { TemporalInput, StrictParsingOptions } from "../../../types/index";
import { TemporalParseError } from "../../../types/enhanced-types";

import type {
  ParseStrategy,
  ParseContext,
  ParseResult,
  ParseValidationResult,
  ParseNormalizationResult,
  ParseOptimizationHints,
  FastPathResult,
  ParseStrategyType,
} from "../parsing-types";

import {
  createParseResult,
  createParseError,
  PARSE_PATTERNS,
  matchesPattern,
} from "../parsing-types";

/**
 * String parsing strategy for handling string-based temporal inputs
 */
export class StringParseStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = "string";
  readonly priority = 50;
  readonly description = "Parse string representations of dates and times";

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return typeof input === "string" && input.trim().length > 0;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }

    const str = (input as string).trim();

    // High confidence for ISO formats
    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME_TZ)) {
      return 0.95;
    }

    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME)) {
      return 0.9;
    }

    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATE)) {
      return 0.85;
    }

    // Medium confidence for timestamps
    if (
      matchesPattern(str, PARSE_PATTERNS.TIMESTAMP_MS) ||
      matchesPattern(str, PARSE_PATTERNS.TIMESTAMP_S)
    ) {
      return 0.7;
    }

    // Lower confidence for human readable (only for truly descriptive formats)
    if (
      matchesPattern(str, PARSE_PATTERNS.HUMAN_READABLE) ||
      this.isHumanReadableDate(str)
    ) {
      // Check if it's a simple slash/dash format that should be parseable instead
      if (
        /^\d{4}[/\-]\d{1,2}[/\-]\d{1,2}$/.test(str) ||
        /^\d{1,2}[/\-]\d{1,2}[/\-]\d{4}$/.test(str) ||
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)
      ) {
        return 0.5; // These are parseable, not human-readable
      }
      return 0.6;
    }

    // Try to parse as Date to check validity
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return 0.5;
      }
    } catch {
      // Ignore parsing errors
    }

    return 0.1; // Very low confidence for unrecognized strings
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if input is a string first
    if (typeof input !== "string") {
      errors.push("Input is not a valid string");
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: "fallback",
        confidence: 0,
        errors,
        warnings,
      };
    }

    const str = (input as string).trim();

    // Check for empty string
    if (str.length === 0) {
      errors.push("String is empty");
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: "fallback",
        confidence: 0,
        errors,
        warnings,
      };
    }

    // Check for obviously invalid patterns
    if (str.includes("undefined") || str.includes("null")) {
      warnings.push("String contains undefined or null values");
    }

    // Validate ISO format strings more strictly
    if (str.includes("T") && str.includes("-")) {
      // This looks like an ISO datetime string, validate it more strictly
      const isoPattern =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?$/;

      // Check for ISO-like pattern with potentially invalid values
      const isoLikePattern =
        /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?$/;
      const isoLikeMatch = str.match(isoLikePattern);

      if (isoLikeMatch) {
        // Extract and validate date/time components
        const [, year, month, day, hour, minute, second] = isoLikeMatch;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        const hourNum = parseInt(hour, 10);
        const minuteNum = parseInt(minute, 10);
        const secondNum = parseInt(second, 10);

        if (monthNum < 1 || monthNum > 12) {
          errors.push(
            `Invalid month: ${monthNum}. Month must be between 1 and 12`
          );
        }
        if (dayNum < 1 || dayNum > 31) {
          errors.push(`Invalid day: ${dayNum}. Day must be between 1 and 31`);
        }
        if (hourNum < 0 || hourNum > 23) {
          errors.push(
            `Invalid hour: ${hourNum}. Hour must be between 0 and 23`
          );
        }
        if (minuteNum < 0 || minuteNum > 59) {
          errors.push(
            `Invalid minute: ${minuteNum}. Minute must be between 0 and 59`
          );
        }
        if (secondNum < 0 || secondNum > 59) {
          errors.push(
            `Invalid second: ${secondNum}. Second must be between 0 and 59`
          );
        }

        // Additional validation for impossible dates
        if (monthNum === 2 && dayNum > 29) {
          errors.push(`February ${dayNum} does not exist`);
        } else if ([4, 6, 9, 11].includes(monthNum) && dayNum > 30) {
          errors.push(
            `Day ${dayNum} does not exist in month ${monthNum} (max: 30 days)`
          );
        }
      } else if (str.includes("T")) {
        // Malformed ISO-like string that doesn't match expected pattern
        errors.push("Malformed ISO datetime string format");
      }
    }

    // Validate simple date formats (YYYY-MM-DD)
    else if (str.includes("-") && /^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
      const datePattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
      const dateMatch = str.match(datePattern);

      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);

        if (monthNum < 1 || monthNum > 12) {
          errors.push(
            `Invalid month: ${monthNum}. Month must be between 1 and 12`
          );
        }
        if (dayNum < 1 || dayNum > 31) {
          errors.push(`Invalid day: ${dayNum}. Day must be between 1 and 31`);
        }

        // Additional validation for impossible dates
        if (monthNum === 2 && dayNum > 29) {
          errors.push(`February ${dayNum} does not exist`);
        } else if ([4, 6, 9, 11].includes(monthNum) && dayNum > 30) {
          errors.push(
            `Day ${dayNum} does not exist in month ${monthNum} (max: 30 days)`
          );
        }
      }
    }

    // Check for potential timezone issues
    if (str.includes("GMT") || str.includes("UTC")) {
      warnings.push(
        "String contains timezone abbreviations which may be ambiguous"
      );
    }

    const normalizedInput = this.normalizeString(str);
    const confidence = this.getConfidence(normalizedInput, context);

    return {
      isValid: errors.length === 0,
      normalizedInput,
      suggestedStrategy: this.type,
      confidence,
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
    const originalStr = input as string;
    const str = originalStr.trim();
    const appliedTransforms: string[] = [];
    const metadata: Record<string, unknown> = {
      originalLength: originalStr.length,
    };

    // Track if trimming was applied
    if (str !== originalStr) {
      appliedTransforms.push("trim");
    }

    let normalized = str;

    // Handle common variations
    const lowerStr = normalized.toLowerCase();

    if (lowerStr === "now") {
      normalized = new Date().toISOString();
      appliedTransforms.push("now-to-iso");
    } else if (lowerStr === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      normalized = today.toISOString();
      appliedTransforms.push("today-to-iso");
    } else if (lowerStr === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      normalized = tomorrow.toISOString();
      appliedTransforms.push("tomorrow-to-iso");
    } else if (lowerStr === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      normalized = yesterday.toISOString();
      appliedTransforms.push("yesterday-to-iso");
    }

    // Handle timestamp strings
    if (matchesPattern(normalized, PARSE_PATTERNS.TIMESTAMP_MS)) {
      const timestamp = parseInt(normalized, 10);
      normalized = new Date(timestamp).toISOString();
      appliedTransforms.push("timestamp-ms-to-iso");
    } else if (matchesPattern(normalized, PARSE_PATTERNS.TIMESTAMP_S)) {
      const timestamp = parseInt(normalized, 10) * 1000;
      normalized = new Date(timestamp).toISOString();
      appliedTransforms.push("timestamp-s-to-iso");
    }

    // Normalize timezone formats
    // Check if no timezone is specified (no Z, +offset, or -offset at the end)
    const hasTimezone =
      normalized.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(normalized);

    // Add UTC timezone when no timezone is specified and either:
    // 1. No target timezone is specified in context, OR
    // 2. Target timezone is UTC (to maintain backward compatibility)
    if (
      !hasTimezone &&
      normalized.includes("T") &&
      (!context.options.timeZone || context.options.timeZone === "UTC")
    ) {
      normalized += "Z";
      appliedTransforms.push("add-utc-timezone");
    }

    // Handle time-only strings (HH:mm, HH:mm:ss)
    // We check this AFTER other normalizations but BEFORE the final return
    // Regex matches HH:MM or HH:MM:SS, optional milliseconds
    const timeOnlyPattern = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
    if (timeOnlyPattern.test(normalized)) {
      // Get current date in the target timezone or default
      const targetTimeZone = context.options.timeZone || "UTC";
      let currentDate;

      try {
        currentDate = Temporal.Now.plainDateISO(targetTimeZone).toString();
      } catch {
        // Fallback if timezone is invalid (though validate() should have caught this)
        currentDate = Temporal.Now.plainDateISO("UTC").toString();
      }

      // Combine date and time
      // We do NOT add 'T' here because normalized might already be just the time
      // Actually, we construct a full ISO string: YYYY-MM-DDTHH:mm:ss
      normalized = `${currentDate}T${normalized}`;

      // If no timezone was requested, we might want to append the offset of the target timezone
      // or just let the ZonedDateTime.from parsing handle it with the target timezone option
      // However, to be safe and explicit:
      // If we just made "2024-01-01T09:30", ZonedDateTime.from needs a timezone or offset.
      // If context.options.timeZone is set, ZonedDateTime.from(str, { timeZone }) works IF str doesn't have offset mismatch.
      // But the easiest way to ensure "Today at 09:30 in [TimeZone]" is to make it a PlainDateTime-like string
      // and let the parse method handle the toZonedDateTime conversion.
      // BUT strict ISO parsing often requires 'T'.

      appliedTransforms.push("time-only-to-iso");

      // Note: The parse method handles "plain" ISO strings by associating them with the
      // context.options.timeZone. So normalizing to "YYYY-MM-DDTHH:mm:ss" is sufficient.
    }

    metadata.finalLength = normalized.length;
    metadata.transformCount = appliedTransforms.length;

    return {
      normalizedInput: normalized,
      appliedTransforms,
      metadata,
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
      // Validate input first
      const validation = this.validate(input, context);
      if (!validation.isValid) {
        throw new Error(validation.errors.join("; "));
      }

      // Normalize input first
      const normalizationResult = this.normalize(input, context);
      const normalizedStr = normalizationResult.normalizedInput as string;

      // Try different parsing approaches in order of preference
      let result: Temporal.ZonedDateTime;

      // 1. Try Temporal.ZonedDateTime.from() first (most precise)
      try {
        // Check if input already has timezone information
        const hasTimezoneInfo = /[+-]\d{2}:?\d{2}|\[.*\]|Z$/.test(
          normalizedStr
        );

        if (hasTimezoneInfo) {
          // Input has timezone info, preserve it by parsing as-is
          result = Temporal.ZonedDateTime.from(normalizedStr);
        } else if (context.options.timeZone) {
          // No timezone in input, treat time as local time in context timezone
          // Parse as PlainDateTime first, then convert to target timezone
          const plainDateTime = Temporal.PlainDateTime.from(normalizedStr);
          result = plainDateTime.toZonedDateTime(context.options.timeZone);
        } else {
          // No timezone anywhere, parse as-is
          result = Temporal.ZonedDateTime.from(normalizedStr);
        }
      } catch {
        // 2. Try Temporal.Instant.from() and convert
        try {
          const instant = Temporal.Instant.from(normalizedStr);

          // Try to preserve original timezone from input string
          const originalInput = input as string;
          const offsetMatch = originalInput.match(/([+-]\d{2}:?\d{2})(?:\[|$)/);

          if (offsetMatch) {
            // Use the original timezone offset
            const offset = offsetMatch[1].includes(":")
              ? offsetMatch[1]
              : offsetMatch[1].slice(0, 3) + ":" + offsetMatch[1].slice(3);
            result = instant.toZonedDateTimeISO(offset);
          } else {
            const timeZone = context.options.timeZone || "UTC";
            result = instant.toZonedDateTimeISO(timeZone);
          }
        } catch {
          // Try parsing as Date, but validate for problematic cases
          const date = new Date(normalizedStr);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date string");
          }

          // Check for invalid leap day that Date incorrectly accepts
          if (this.isInvalidLeapDay(normalizedStr, date)) {
            throw new Error("Invalid leap day");
          }

          const instant = Temporal.Instant.fromEpochMilliseconds(
            date.getTime()
          );

          // Try to preserve original timezone from input string
          let timeZone = context.options.timeZone || "UTC";
          const originalInput = input as string;

          // Extract timezone offset from original input if present
          const offsetMatch = originalInput.match(/([+-]\d{2}:?\d{2})(?:\[|$)/);
          if (offsetMatch) {
            // Use the original timezone offset
            const offset = offsetMatch[1].includes(":")
              ? offsetMatch[1]
              : offsetMatch[1].slice(0, 3) + ":" + offsetMatch[1].slice(3);
            result = instant.toZonedDateTimeISO(offset);
          } else {
            result = instant.toZonedDateTimeISO(timeZone);
          }
        }
      }

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

      const parseError = new TemporalParseError(
        `Failed to parse string: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        input,
        "STRING_PARSE_ERROR",
        `Strategy: ${this.type}`
      );

      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Check if fast path can be used
   */
  checkFastPath(input: TemporalInput, context: ParseContext): FastPathResult {
    if (!this.canHandle(input, context)) {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0,
      };
    }

    const str = (input as string).trim();

    // Fast path for ISO datetime with timezone
    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME_TZ)) {
      try {
        // Try direct parsing first
        const result = Temporal.ZonedDateTime.from(str);
        return {
          canUseFastPath: true,
          data: result,
          strategy: this.type,
          confidence: 0.95,
        };
      } catch {
        // Try using Instant.from with timezone preservation
        try {
          const instant = Temporal.Instant.from(str);
          const offsetMatch = str.match(/([+-]\d{2}:?\d{2})(?:\[|$)/);
          if (offsetMatch) {
            const offset = offsetMatch[1].includes(":")
              ? offsetMatch[1]
              : offsetMatch[1].slice(0, 3) + ":" + offsetMatch[1].slice(3);
            const result = instant.toZonedDateTimeISO(offset);
            return {
              canUseFastPath: true,
              data: result,
              strategy: this.type,
              confidence: 0.95,
            };
          }
        } catch {
          // Fall back to regular parsing
        }
      }
    }

    // Fast path for ISO datetime - but only if no timezone context is provided or it's UTC
    // If timezone context exists and is not UTC, we need to use regular parsing to handle it properly
    if (
      matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME) &&
      (!context.options.timeZone || context.options.timeZone === "UTC")
    ) {
      try {
        const withTz = str.endsWith("Z") ? str : str + "Z";
        const result = Temporal.ZonedDateTime.from(withTz);
        return {
          canUseFastPath: true,
          data: result,
          strategy: this.type,
          confidence: 0.9,
        };
      } catch (error) {
        // If Temporal.ZonedDateTime.from fails, try using Instant.from
        try {
          const withTz = str.endsWith("Z") ? str : str + "Z";
          const instant = Temporal.Instant.from(withTz);
          const result = instant.toZonedDateTimeISO("UTC");
          return {
            canUseFastPath: true,
            data: result,
            strategy: this.type,
            confidence: 0.9,
          };
        } catch {
          // Fall back to regular parsing
        }
      }
    }

    return {
      canUseFastPath: false,
      strategy: this.type,
      confidence: this.getConfidence(input, context),
    };
  }

  /**
   * Get optimization hints
   */
  getOptimizationHints(
    input: TemporalInput,
    context: ParseContext
  ): ParseOptimizationHints {
    const str = (input as string).trim();
    const confidence = this.getConfidence(input, context);

    let estimatedComplexity: "low" | "medium" | "high" = "medium";
    let shouldCache = true;
    let canUseFastPath = false;
    const warnings: string[] = [];

    // Determine complexity
    if (
      matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME_TZ) ||
      matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME)
    ) {
      estimatedComplexity = "low";
      canUseFastPath = true;
    } else if (
      matchesPattern(str, PARSE_PATTERNS.ISO_DATE) ||
      matchesPattern(str, PARSE_PATTERNS.TIMESTAMP_MS) ||
      matchesPattern(str, PARSE_PATTERNS.TIMESTAMP_S)
    ) {
      estimatedComplexity = "low";
    } else if (
      matchesPattern(str, PARSE_PATTERNS.HUMAN_READABLE) ||
      this.isHumanReadableDate(str)
    ) {
      estimatedComplexity = "medium";
    } else {
      estimatedComplexity = "high";
      warnings.push("Unrecognized string format may require complex parsing");
    }

    // Caching recommendations
    if (str.length > 100) {
      warnings.push("Very long string - consider preprocessing");
    }

    if (confidence < 0.3) {
      shouldCache = false;
      warnings.push("Low confidence parsing - results may not be cacheable");
    }

    return {
      preferredStrategy: this.type,
      shouldCache,
      canUseFastPath,
      estimatedComplexity,
      suggestedOptions: {
        enableFastPath: canUseFastPath,
        enableCaching: shouldCache,
      },
      warnings,
    };
  }

  /**
   * Normalize string input
   */
  private normalizeString(str: string): string {
    return str.trim();
  }

  /**
   * Check if the input string represents a human-readable date format
   */
  private isHumanReadableDate(str: string): boolean {
    // Common human-readable date patterns
    const humanReadablePatterns = [
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i, // Dec 25, 2023 or Dec 25 2023
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i, // December 25, 2023
      /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i, // 25 Dec 2023
      /^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // 25 December 2023
      /^\d{4}\/\d{1,2}\/\d{1,2}$/, // 2023/12/25
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // 12/25/2023
    ];

    return humanReadablePatterns.some((pattern) => pattern.test(str.trim()));
  }

  /**
   * Check if the input string represents an invalid leap day that Date incorrectly accepts
   */
  private isInvalidLeapDay(inputStr: string, parsedDate: Date): boolean {
    // Extract year, month, day from the input string if it looks like a date
    const dateMatch = inputStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!dateMatch) {
      return false; // Not a recognizable date format
    }

    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const day = parseInt(dateMatch[3], 10);

    // Check if it's February 29th
    if (month === 2 && day === 29) {
      // Check if it's not a leap year
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      if (!isLeapYear) {
        return true; // Invalid leap day
      }
    }

    return false;
  }
}
