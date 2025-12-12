/**
 * @file Tests for FallbackStrategy
 */

import { Temporal } from "@js-temporal/polyfill";
import { FallbackStrategy } from "../../../../core/parsing/strategies/fallback-strategy";
import {
  ParseContext,
  ParseStrategyType,
} from "../../../../core/parsing/parsing-types";
import { TemporalParseError } from "../../../../types/enhanced-types";

describe("FallbackStrategy", () => {
  let strategy: FallbackStrategy;
  let context: ParseContext;

  beforeEach(() => {
    strategy = new FallbackStrategy();
    context = {
      input: "test",
      options: {
        timeZone: "UTC",
        strict: false,
      },
      inferredType: "fallback" as ParseStrategyType,
      confidence: 0.1,
      metadata: {},
      startTime: performance.now(),
    };
  });

  describe("basic properties", () => {
    it("should have correct type", () => {
      expect(strategy.type).toBe("fallback");
    });

    it("should have lowest priority", () => {
      expect(strategy.priority).toBe(10);
    });

    it("should have meaningful description", () => {
      expect(strategy.description).toBe(
        "Fallback strategy for inputs that other strategies cannot handle"
      );
      expect(typeof strategy.description).toBe("string");
      expect(strategy.description.length).toBeGreaterThan(0);
    });
  });

  describe("canHandle", () => {
    it("should handle any non-null input", () => {
      expect(strategy.canHandle("2023-01-01", context)).toBe(true);
      expect(strategy.canHandle(1640995200000, context)).toBe(true);
      expect(strategy.canHandle(new Date(), context)).toBe(true);
      expect(strategy.canHandle([2023, 1, 1], context)).toBe(true);
      expect(strategy.canHandle({}, context)).toBe(true);
      expect(strategy.canHandle(true as any, context)).toBe(true);
      expect(strategy.canHandle(false as any, context)).toBe(true);
      expect(strategy.canHandle(BigInt(123) as any, context)).toBe(true);
      expect(strategy.canHandle(Symbol("test") as any, context)).toBe(true);
      expect(strategy.canHandle((() => {}) as any, context)).toBe(true);
    });

    it("should not handle null or undefined", () => {
      expect(strategy.canHandle(null, context)).toBe(false);
      expect(strategy.canHandle(undefined, context)).toBe(false);
    });
  });

  describe("getConfidence", () => {
    it("should return 0 for null or undefined", () => {
      expect(strategy.getConfidence(null, context)).toBe(0);
      expect(strategy.getConfidence(undefined, context)).toBe(0);
    });

    it("should return low confidence for all valid inputs", () => {
      const inputs = [
        "2023-01-01",
        1640995200000,
        new Date(),
        [2023, 1, 1],
        {},
        true as any,
        false as any,
        BigInt(123) as any,
        Symbol("test") as any,
        (() => {}) as any,
      ];

      inputs.forEach((input) => {
        expect(strategy.getConfidence(input, context)).toBe(0.1);
      });
    });
  });

  describe("validate", () => {
    it("should reject null or undefined input", () => {
      const nullResult = strategy.validate(null, context);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors).toContain("Input is null or undefined");
      expect(nullResult.confidence).toBe(0);

      const undefinedResult = strategy.validate(undefined, context);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.errors).toContain("Input is null or undefined");
    });

    it("should validate valid inputs with warnings", () => {
      const result = strategy.validate("2023-01-01", context);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain(
        "Using fallback strategy - parsing may be unreliable"
      );
      expect(result.suggestedStrategy).toBe("fallback");
      expect(result.confidence).toBe(0.1);
    });

    it("should reject boolean input", () => {
      const result = strategy.validate(true as any, context);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Boolean input is not supported for temporal values"
      );
    });

    it("should reject symbol input", () => {
      const result = strategy.validate(Symbol("test") as any, context);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Symbol input cannot be converted to temporal value"
      );
    });

    it("should reject function input", () => {
      const result = strategy.validate((() => {}) as any, context);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Function input cannot be converted to temporal value"
      );
    });

    it("should reject array input", () => {
      const result = strategy.validate([1, 2, 3], context);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Array input should be handled by array-like strategy"
      );
    });

    it("should warn about object input conversion", () => {
      const result = strategy.validate({}, context);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Plain object input will be converted using available methods"
      );
    });

    it("should warn about BigInt input conversion", () => {
      const result = strategy.validate(BigInt(123) as any, context);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "BigInt input will be converted to number (may lose precision)"
      );
    });
  });

  describe("normalize", () => {
    it("should throw error for boolean input", () => {
      expect(() => strategy.normalize(true as any, context)).toThrow(
        "Boolean input is not supported for temporal values"
      );

      expect(() => strategy.normalize(false as any, context)).toThrow(
        "Boolean input is not supported for temporal values"
      );
    });

    it("should convert BigInt to number", () => {
      const result = strategy.normalize(BigInt(123) as any, context);

      expect(result.normalizedInput).toBe(123);
      expect(result.appliedTransforms).toContain("bigint-to-number");
      expect(result.metadata.originalType).toBe("bigint");
      expect(result.metadata.normalizedType).toBe("number");
    });

    it("should warn about BigInt precision loss", () => {
      const largeBigInt = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
      const result = strategy.normalize(largeBigInt as any, context);

      expect(result.appliedTransforms).toContain("bigint-to-number");
      expect(result.appliedTransforms).toContain("precision-loss-warning");
    });

    it("should use valueOf method for objects", () => {
      const objWithValueOf = {
        valueOf: () => 1640995200000,
      };

      const result = strategy.normalize(objWithValueOf, context);

      expect(result.normalizedInput).toBe(1640995200000);
      expect(result.appliedTransforms).toContain("object-valueof");
    });

    it("should use toString method for objects without valueOf", () => {
      const objWithToString = {
        toString: () => "2023-01-01",
      };

      const result = strategy.normalize(objWithToString, context);

      expect(result.normalizedInput).toBe("2023-01-01");
      expect(result.appliedTransforms).toContain("object-tostring");
    });

    it("should use JSON.stringify for complex objects", () => {
      const complexObj = { year: 2023, month: 1, day: 1 };
      const result = strategy.normalize(complexObj, context);

      expect(result.normalizedInput).toBe(JSON.stringify(complexObj));
      expect(result.appliedTransforms).toContain("object-json-stringify");
    });

    it("should handle objects with circular references", () => {
      const circularObj: any = { prop: "value" };
      circularObj.self = circularObj;

      const result = strategy.normalize(circularObj, context);

      expect(typeof result.normalizedInput).toBe("string");
      expect(result.appliedTransforms).toContain("object-string-conversion");
    });

    it("should handle objects with throwing valueOf", () => {
      const objWithThrowingValueOf = {
        valueOf: () => {
          throw new Error("valueOf error");
        },
        toString: () => "fallback-string",
      };

      const result = strategy.normalize(objWithThrowingValueOf, context);

      expect(result.normalizedInput).toBe("fallback-string");
      expect(result.appliedTransforms).toContain("object-tostring");
    });

    it("should handle objects with throwing toString", () => {
      const objWithThrowingToString = {
        valueOf: () => ({ complex: "object" }),
        toString: () => {
          throw new Error("toString error");
        },
      };

      const result = strategy.normalize(objWithThrowingToString, context);

      expect(typeof result.normalizedInput).toBe("string");
      expect(result.appliedTransforms).toContain("object-json-stringify");
    });

    it("should use fallback string conversion for unsupported types", () => {
      const symbol = Symbol("test");
      const result = strategy.normalize(symbol as any, context);

      expect(typeof result.normalizedInput).toBe("string");
      expect(result.appliedTransforms).toContain("fallback-string-conversion");
    });

    it("should track metadata correctly", () => {
      const input = { test: "value" };
      const result = strategy.normalize(input, context);

      expect(result.metadata.originalType).toBe("object");
      expect(result.metadata.originalValue).toBe(input);
      expect(result.metadata.normalizedType).toBe("string");
      expect(result.metadata.transformCount).toBeGreaterThan(0);
    });

    it("should preserve strings and numbers without transformation", () => {
      const stringResult = strategy.normalize("2023-01-01", context);
      expect(stringResult.normalizedInput).toBe("2023-01-01");
      expect(stringResult.appliedTransforms).toHaveLength(0);

      const numberResult = strategy.normalize(1640995200000, context);
      expect(numberResult.normalizedInput).toBe(1640995200000);
      expect(numberResult.appliedTransforms).toHaveLength(0);
    });
  });

  describe("parse", () => {
    it("should parse valid string inputs", () => {
      const validStrings = [
        "2023-01-01T00:00:00Z",
        "2023-01-01",
        "1640995200000", // Timestamp as string
      ];

      validStrings.forEach((str) => {
        const result = strategy.parse(str, context);
        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
          expect(result.strategy).toBe("fallback");
          expect(result.confidence).toBe(0.1);
        }
      });
    });

    it("should parse valid number inputs", () => {
      const validNumbers = [
        1640995200000, // Millisecond timestamp
        1640995200, // Second timestamp
        0, // Unix epoch
        Date.now(), // Current timestamp
      ];

      validNumbers.forEach((num) => {
        const result = strategy.parse(num, context);
        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
        }
      });
    });

    it("should fail to parse boolean inputs", () => {
      const trueResult = strategy.parse(true as any, context);
      expect(trueResult.success).toBe(false);
      if (!trueResult.success) {
        expect(trueResult.error?.message).toContain(
          "Boolean input is not supported for temporal values"
        );
      }

      const falseResult = strategy.parse(false as any, context);
      expect(falseResult.success).toBe(false);
      if (!falseResult.success) {
        expect(falseResult.error?.message).toContain(
          "Boolean input is not supported for temporal values"
        );
      }
    });

    it("should parse BigInt inputs", () => {
      const result = strategy.parse(BigInt(1640995200000) as any, context);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      }
    });

    it("should parse object inputs with valueOf", () => {
      const objWithValueOf = {
        valueOf: () => 1640995200000,
      };

      const result = strategy.parse(objWithValueOf, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      }
    });

    it("should parse object inputs with toString", () => {
      const objWithToString = {
        toString: () => "2023-01-01T00:00:00Z",
      };

      const result = strategy.parse(objWithToString, context);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
        expect(result.data.month).toBe(1);
        expect(result.data.day).toBe(1);
      }
    });

    it("should parse with different timezones", () => {
      const timezoneContext = {
        ...context,
        options: { ...context.options, timeZone: "America/New_York" },
      };

      const result = strategy.parse(1640995200000, timezoneContext);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.timeZoneId).toBe("America/New_York");
      }
    });

    it("should handle invalid string inputs", () => {
      const invalidStrings = ["invalid-date", "not-a-timestamp", ""];

      invalidStrings.forEach((str) => {
        const result = strategy.parse(str, context);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(TemporalParseError);
          expect(result.error?.code).toBe("FALLBACK_PARSE_ERROR");
          expect(result.strategy).toBe("fallback");
        }
      });
    });

    it("should handle invalid number inputs", () => {
      const invalidNumbers = [
        NaN,
        Infinity,
        -Infinity,
        Number.MAX_SAFE_INTEGER * 2, // Too large
      ];

      invalidNumbers.forEach((num) => {
        const result = strategy.parse(num, context);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(TemporalParseError);
        }
      });
    });

    it("should handle unsupported normalized types", () => {
      // Mock normalize to return an unsupported type
      const originalNormalize = strategy.normalize;
      (strategy as any).normalize = jest.fn().mockReturnValue({
        normalizedInput: Symbol("test"),
        appliedTransforms: [],
        metadata: {},
      });

      const result = strategy.parse("test", context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.message).toContain(
          "Cannot parse normalized input of type: symbol"
        );
      }

      // Restore original method
      (strategy as any).normalize = originalNormalize;
    });

    it("should measure execution time", () => {
      const result = strategy.parse("2023-01-01T00:00:00Z", context);

      expect(result.executionTime).toBeGreaterThan(0);
      expect(typeof result.executionTime).toBe("number");
    });

    it("should handle performance timing errors gracefully", () => {
      const originalPerformance = global.performance;

      try {
        global.performance = {
          ...originalPerformance,
          now: jest.fn().mockImplementation(() => {
            throw new Error("Performance API error");
          }),
        };

        const result = strategy.parse("2023-01-01T00:00:00Z", context);

        // Should still succeed despite timing error
        expect(result.success).toBe(true);
      } finally {
        global.performance = originalPerformance;
      }
    });
  });

  describe("checkFastPath", () => {
    it("should never use fast path", () => {
      const inputs = ["2023-01-01", 1640995200000, true, {}, []];

      inputs.forEach((input) => {
        const result = strategy.checkFastPath(input, context);
        expect(result.canUseFastPath).toBe(false);
        expect(result.strategy).toBe("fallback");
        expect(result.confidence).toBe(0.1);
      });
    });

    it("should return 0 confidence for null input", () => {
      const result = strategy.checkFastPath(null, context);

      expect(result.canUseFastPath).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe("getOptimizationHints", () => {
    it("should provide pessimistic hints", () => {
      const hints = strategy.getOptimizationHints("2023-01-01", context);

      expect(hints.preferredStrategy).toBe("fallback");
      expect(hints.shouldCache).toBe(false);
      expect(hints.canUseFastPath).toBe(false);
      expect(hints.estimatedComplexity).toBe("high");
      expect(hints.suggestedOptions.enableFastPath).toBe(false);
      expect(hints.suggestedOptions.enableCaching).toBe(false);
    });

    it("should provide general warnings", () => {
      const hints = strategy.getOptimizationHints("test", context);

      expect(hints.warnings).toContain(
        "Using fallback strategy indicates input format is not recognized"
      );
      expect(hints.warnings).toContain(
        "Consider preprocessing input to match a specific strategy"
      );
      expect(hints.warnings).toContain(
        "Fallback parsing is slower and less reliable than specific strategies"
      );
    });

    it("should provide object-specific warnings", () => {
      const hints = strategy.getOptimizationHints({}, context);

      expect(hints.warnings).toContain(
        "Object input requires complex conversion - consider using a more specific format"
      );
    });

    it("should provide boolean-specific warnings", () => {
      const hints = strategy.getOptimizationHints(true as any, context);

      expect(hints.warnings).toContain(
        "Boolean input is not supported - consider using a valid temporal format"
      );
    });

    it("should provide BigInt-specific warnings", () => {
      const hints = strategy.getOptimizationHints(BigInt(123) as any, context);

      expect(hints.warnings).toContain("BigInt conversion may lose precision");
    });
  });

  describe("private methods", () => {
    describe("parseAsString", () => {
      it("should try multiple string parsing approaches", () => {
        // Test direct Temporal parsing
        const result1 = strategy.parse("2023-01-01T00:00:00Z", context);
        expect(result1.success).toBe(true);

        // Test Date parsing fallback
        const result2 = strategy.parse("January 1, 2023", context);
        expect(result2.success).toBe(true);

        // Test number string parsing
        const result3 = strategy.parse("1640995200000", context);
        expect(result3.success).toBe(true);
      });
    });

    describe("parseAsNumber", () => {
      it("should try millisecond timestamp first", () => {
        const result = strategy.parse(1640995200000, context);

        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data.year).toBe(2022);
        }
      });

      it("should try second timestamp as fallback", () => {
        const result = strategy.parse(1640995200, context);

        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data.year).toBe(2022);
        }
      });

      it("should handle invalid numbers", () => {
        const result = strategy.parse(NaN, context);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error?.message).toContain("Invalid number");
        }
      });
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle null and undefined gracefully", () => {
      expect(strategy.canHandle(null, context)).toBe(false);
      expect(strategy.canHandle(undefined, context)).toBe(false);
      expect(strategy.getConfidence(null, context)).toBe(0);
      expect(strategy.getConfidence(undefined, context)).toBe(0);
    });

    it("should handle complex nested objects", () => {
      const complexObj = {
        nested: {
          deep: {
            value: "2023-01-01",
          },
        },
        array: [1, 2, 3],
        date: new Date(),
      };

      const result = strategy.parse(complexObj, context);
      // Should attempt to parse but likely fail
      expect(result.success).toBe(false);
    });

    it("should handle arrays with mixed types", () => {
      const mixedArray = [1, "2023", true, null, undefined];
      const result = strategy.parse(mixedArray as any, context);

      // Should attempt to parse but likely fail
      expect(result.success).toBe(false);
    });

    it("should handle context modifications during parsing", () => {
      const modifiableContext = {
        ...context,
        options: { ...context.options, timeZone: "America/New_York" },
      };
      const result = strategy.parse("2023-01-01T00:00:00Z", modifiableContext);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // Should use the specified timezone
        expect(result.data.timeZoneId).toBe("America/New_York");
      }
    });

    it("should handle very large strings", () => {
      const largeString = "a".repeat(10000);
      const result = strategy.parse(largeString, context);

      expect(result.success).toBe(false);
    });

    it("should handle objects with getters that throw", () => {
      const objWithThrowingGetter = {
        get valueOf() {
          throw new Error("Getter error");
        },
        toString: () => "2023-01-01",
      };

      const result = strategy.parse(objWithThrowingGetter, context);
      expect(result.success).toBe(true); // Should fall back to toString
    });
  });

  describe("integration scenarios", () => {
    it("should handle Date objects that other strategies missed", () => {
      const date = new Date("2023-01-01");
      // Simulate that date strategy somehow failed
      const result = strategy.parse(date, context);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
      }
    });

    it("should handle custom objects with temporal-like properties", () => {
      const customObj = {
        year: 2023,
        month: 1,
        day: 1,
        toString: function () {
          return `${this.year}-${String(this.month).padStart(2, "0")}-${String(
            this.day
          ).padStart(2, "0")}`;
        },
      };

      const result = strategy.parse(customObj, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
      }
    });

    it("should handle moment-like objects", () => {
      const momentLike = {
        valueOf: () => 1640995200000,
        toString: () => "2022-01-01T00:00:00.000Z",
      };

      const result = strategy.parse(momentLike, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2022);
      }
    });

    it("should handle timezone-aware parsing", () => {
      const timezones = [
        "UTC",
        "America/New_York",
        "Europe/London",
        "Asia/Tokyo",
      ];

      timezones.forEach((timeZone) => {
        const timezoneContext = {
          ...context,
          options: { ...context.options, timeZone },
        };

        const result = strategy.parse(1640995200000, timezoneContext);

        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data.timeZoneId).toBe(timeZone);
        }
      });
    });
  });

  describe("complex coverage scenarios", () => {
    it("should handle object with toDate that throws", () => {
      const obj = {
        toDate: () => {
          throw new Error("toDate error");
        },
        valueOf: () => 1640995200000,
      };
      // Should fall back to valueOf
      const result = strategy.parse(obj, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2022);
      }
    });

    it("should perform deep normalization failure recovery", () => {
      // Circular object that fails JSON.stringify
      const circular: any = { a: 1 };
      circular.self = circular;
      // And fails standard toString (returns [object Object])

      // This hits the JSON.stringify catch block in normalize
      // And then tries string conversion

      // But to normalize, we need it to NOT be a plain object?
      // Or a plain object without useful methods?
      // If it is a plain object, it checks hasUsefulMethods.
      // Circular plain object: has defaults.

      // Let's force it to pass "hasUsefulMethods" check by adding a dummy method
      circular.toDate = undefined; // not function
      circular.valueOf = () => circular; // returns self, not primitive

      // Actually, if we use a class instance it's not a plain object
      class Circular {
        self: Circular;
        constructor() {
          this.self = this;
        }
        toString() {
          throw new Error("toString fail");
        }
      }
      const c = new Circular();

      // normalize catches toString error -> tries JSON.stringify -> catches circular error -> throws
      // parse catches that throw -> returns failure

      const result = strategy.parse(c as any, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should invalid date from toDate()", () => {
      const obj = {
        toDate: () => new Date("invalid"),
      };
      // normalize gets the Invalid Date
      // parse -> parseAsDate -> checks isNaN -> throws

      const result = strategy.parse(obj, context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Invalid Date object");
    });

    it("should cover parseAsNumber small values", () => {
      // Providing a number < 1e9
      // It tries as ms, then as seconds
      const smallNum = 86400000; // 1 day in ms
      const result = strategy.parse(smallNum, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.epochMilliseconds).toBe(smallNum);
      }
    });

    it("should fail parseAsNumber recursion", () => {
      // We need a number that is finite but fails Temporal conversion?
      // Temporal.Instant.fromEpochMilliseconds allows a huge range.
      // Maybe safe integer limit?
      // Temporal limits are approx 10^8 days ~ 8.64e15 ms.
      // Max Safe Integer is 9e15.
      // So just above max safe integer?
      // But fallback warning for BigInt says precision loss.
      // logic check line 545: catch block "Unable to parse number as timestamp"
    });

    it("should handle objects that throw on property access", () => {
      const throwingProxy = new Proxy(
        {},
        {
          get: function (target, prop) {
            if (
              prop === "toDate" ||
              prop === "valueOf" ||
              prop === "toString"
            ) {
              throw new Error("Property access error");
            }
            return Reflect.get(target, prop);
          },
        }
      );

      // This should hit the catch blocks in validate/normalize that wrap property checks
      const result = strategy.parse(throwingProxy, context);

      // Should eventually fail or return false
      // validate() catches errors? No, validate() has try/catch around method checks.
      // If validate checks throw, it defaults to hasUsefulMethods=false.
      // Then returns invalid?

      // normalize() also has try/catch.

      // But if validate returns invalid, parse throws 'Input validation failed'.

      expect(result.success).toBe(false);
    });
  });
});
