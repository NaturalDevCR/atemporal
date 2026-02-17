import { Temporal } from "@js-temporal/polyfill";
import { TemporalLikeStrategy } from "../../../../../src/core/parsing/strategies/temporal-like-strategy";
import {
  ParseContext,
  createParseContext,
} from "../../../../../src/core/parsing/parsing-types";
import { DEFAULT_TEMPORAL_CONFIG } from "../../../../../src/types/index";

describe("TemporalLikeStrategy", () => {
  let strategy: TemporalLikeStrategy;
  let context: ParseContext;

  beforeEach(() => {
    strategy = new TemporalLikeStrategy();
    context = createParseContext({ year: 2023, month: 1, day: 1 });
  });

  describe("basic properties", () => {
    it("should have correct type and priority", () => {
      expect(strategy.type).toBe("temporal-like");
      expect(strategy.priority).toBe(40);
    });
  });

  describe("canHandle", () => {
    it("should handle valid temporal-like objects", () => {
      // Must have year + at least one other property
      expect(strategy.canHandle({ year: 2023, month: 1 }, context)).toBe(true);
      expect(
        strategy.canHandle({ year: 2023, calendar: "iso8601" }, context)
      ).toBe(true);
    });

    it("should not handle objects with only year", () => {
      expect(strategy.canHandle({ year: 2023 }, context)).toBe(false);
    });

    it("should not handle non-objects", () => {
      expect(strategy.canHandle(null, context)).toBe(false);
      expect(strategy.canHandle(undefined, context)).toBe(false);
      expect(strategy.canHandle("string", context)).toBe(false);
      expect(strategy.canHandle(123, context)).toBe(false);
    });

    it("should not handle objects without year", () => {
      expect(strategy.canHandle({ month: 1 }, context)).toBe(false);
      expect(strategy.canHandle({ day: 1 }, context)).toBe(false);
    });

    it("should not handle objects with non-numeric year", () => {
      expect(strategy.canHandle({ year: "2023", month: 1 }, context)).toBe(
        false
      );
    });

    it("should not handle objects with extra non-temporal properties", () => {
      expect(
        strategy.canHandle({ year: 2023, month: 1, foo: "bar" }, context)
      ).toBe(false);
    });
  });

  describe("getConfidence", () => {
    it("should return 0 if cannot handle", () => {
      expect(strategy.getConfidence({}, context)).toBe(0);
      expect(strategy.getConfidence({ year: 2023 }, context)).toBe(0); // Only year is not enough
    });

    it("should return medium confidence (0.7) for minimal properties (2)", () => {
      // year + 1 other is min
      expect(strategy.getConfidence({ year: 2023, month: 1 }, context)).toBe(
        0.7
      );
    });

    it("should return high confidence (0.9) for many properties", () => {
      expect(
        strategy.getConfidence(
          { year: 2023, month: 1, day: 1, hour: 12 },
          context
        )
      ).toBe(0.9);
    });

    it("should return high confidence (0.9) for >= 3 properties", () => {
      expect(
        strategy.getConfidence({ year: 2023, month: 1, day: 1 }, context)
      ).toBe(0.9);
    });

    it("should boost confidence with timezone", () => {
      // 1 prop (0.5) + timezone (+0.1) = 0.6
      expect(
        strategy.getConfidence({ year: 2023, timeZone: "UTC" }, context)
      ).toBeCloseTo(0.6);
    });

    it("should boost confidence with calendar", () => {
      // 1 prop (0.5) + calendar (+0.05) = 0.55
      expect(
        strategy.getConfidence({ year: 2023, calendar: "iso8601" }, context)
      ).toBeCloseTo(0.55);
    });

    it("should cap confidence at 0.95", () => {
      // 3 props (0.9) + timezone (+0.1) = 1.0 -> cap 0.95
      expect(
        strategy.getConfidence(
          { year: 2023, month: 1, day: 1, timeZone: "UTC" },
          context
        )
      ).toBe(0.95);
    });
  });

  describe("checkFastPath", () => {
    it("should return fast path for simple YMD object", () => {
      const input = { year: 2023, month: 1, day: 1 };
      const result = strategy.checkFastPath(input, context);
      expect(result.canUseFastPath).toBe(true);
      expect(result.confidence).toBe(0.9);
    });

    it("should not use fast path if time components present", () => {
      const input = { year: 2023, month: 1, day: 1, hour: 10 };
      const result = strategy.checkFastPath(input, context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should not use fast path if timezone present", () => {
      const input = { year: 2023, month: 1, day: 1, timeZone: "UTC" };
      const result = strategy.checkFastPath(input, context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should return failure for invalid input", () => {
      expect(strategy.checkFastPath({}, context).canUseFastPath).toBe(false);
    });
  });

  describe("validate", () => {
    it("should validate and score valid full object", () => {
      const input = { year: 2023, month: 1, day: 1, hour: 10, minute: 30 };
      const result = strategy.validate(input, context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation for invalid types", () => {
      const input = "invalid";
      const result = strategy.validate(input, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Input is not a temporal-like object");
    });

    it("should validate year range", () => {
      // Must provide month to pass canHandle
      expect(
        strategy.validate({ year: 2023.5, month: 1 }, context).errors
      ).toContain("Year must be an integer");
      expect(
        strategy.validate({ year: 0, month: 1 }, context).errors
      ).toContain("Year must be between 1 and 9999");
    });

    it("should validate month range", () => {
      expect(
        strategy.validate({ year: 2023, month: 13 }, context).errors
      ).toContain("Month must be between 1 and 12");
      expect(
        strategy.validate({ year: 2023, month: 1.5 }, context).errors
      ).toContain("Month must be an integer");
    });

    it("should validate day range", () => {
      expect(
        strategy.validate({ year: 2023, month: 1, day: 32 }, context).errors
      ).toContain("Day must be between 1 and 31");
    });

    it("should validate impossible dates (Feb 30)", () => {
      const result = strategy.validate(
        { year: 2023, month: 2, day: 30 },
        context
      );
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("February 30 does not exist"))
      ).toBe(true);
    });

    it("should validate impossible dates (April 31)", () => {
      const result = strategy.validate(
        { year: 2023, month: 4, day: 31 },
        context
      );
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("Day 31 does not exist in month 4")
        )
      ).toBe(true);
    });

    it("should validate time components", () => {
      expect(
        strategy.validate({ year: 2023, hour: -1 }, context).errors
      ).toContain("hour must be a non-negative integer");
      expect(
        strategy.validate({ year: 2023, minute: 1.5 }, context).errors
      ).toContain("minute must be a non-negative integer");
    });

    it("should warn on invalid timezone type", () => {
      const input = { year: 2023, timeZone: 123 as any };
      const result = strategy.validate(input, context);
      expect(result.warnings).toContain("timeZone should be a string");
    });

    it("should warn on invalid calendar type", () => {
      const input = { year: 2023, calendar: 123 as any };
      const result = strategy.validate(input, context);
      expect(result.warnings).toContain("calendar should be a string");
    });

    it("should handle error during validation", () => {
      // Mock to throw error
      const mockInput = { year: 2023 };
      Object.defineProperty(mockInput, "month", {
        get: () => {
          throw new Error("Mock error");
        },
      });
      const result = strategy.validate(mockInput, context);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Validation error"))).toBe(
        true
      );
    });
  });

  describe("normalize", () => {
    it("should apply defaults and track transforms", () => {
      const input = { year: 2023, month: 5, day: 15 };
      const result = strategy.normalize(input, context);

      expect(result.appliedTransforms).toContain("default-hour:0");
      expect(result.appliedTransforms).toContain("default-minute:0");
      expect(result.appliedTransforms).toContain("default-second:0");

      expect(result.normalizedInput).toMatchObject({
        hour: 0,
        minute: 0,
        second: 0,
      });
    });

    it("should apply month and day defaults", () => {
      const input = { year: 2023 };
      const result = strategy.normalize(input, context);

      expect(result.appliedTransforms).toContain("default-month:1");
      expect(result.appliedTransforms).toContain("default-day:1");
      const normalized = result.normalizedInput as any;
      expect(normalized.month).toBe(1);
      expect(normalized.day).toBe(1);
    });

    it("should track timezone override", () => {
      const input = { year: 2023, timeZone: "Europe/London" };
      const nyContext = createParseContext(input, {
        timeZone: "America/New_York",
      });
      const result = strategy.normalize(input, nyContext);

      expect(
        result.appliedTransforms.some((t) => t.startsWith("timezone-override"))
      ).toBe(true);
    });

    it("should handle error during normalization (mocked getter throw)", () => {
      const input = { year: 2023 };
      // Define a property that throws on access
      Object.defineProperty(input, "month", {
        get: () => {
          throw new Error("Access error");
        },
        enumerable: true,
      });

      // Validation accesses properties too.
      // But validate is only called in parse(), normalize() is called directly here.
      // So this should trigger the catch block in normalize.
      const result = strategy.normalize(input, context);
      expect(result.appliedTransforms[0]).toContain("error:Access error");
    });
  });

  describe("convert", () => {
    it("should handle internal conversion failure", () => {
      const input = {
        year: 2023,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
        timeZone: "Invalid/TimeZone",
      };

      // toZonedDateTime will throw for invalid timezone
      expect(() => strategy.convert(input, context)).toThrow(
        "Conversion failed"
      );
    });
  });

  describe("parse", () => {
    it("should parse valid object", () => {
      const input = { year: 2023, month: 5, day: 15, hour: 10 };
      const result = strategy.parse(input, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
        expect(result.data.month).toBe(5);
        expect(result.data.day).toBe(15);
        expect(result.data.hour).toBe(10);
      }
    });

    it("should handle normalization error in parse", () => {
      // We mock normalize to return an error transform
      jest.spyOn(strategy, "normalize").mockReturnValue({
        normalizedInput: {} as any,
        appliedTransforms: ["error:Forced normalization error"],
        metadata: {},
      });

      const result = strategy.parse({ year: 2023, month: 1 }, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Normalization failed");
    });

    it("should handle conversion error", () => {
      // Mock convert to throw
      jest.spyOn(strategy, "convert").mockImplementation(() => {
        throw new Error("Forced conversion error");
      });

      const result = strategy.parse({ year: 2023, month: 1 }, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle unknown error during parse", () => {
      // Mock validate to throw non-Error
      jest.spyOn(strategy, "validate").mockImplementation(() => {
        throw "string error";
      });

      const result = strategy.parse({ year: 2023 }, context);
      expect(result.success).toBe(false);
      expect((result as any).error.message).toContain("Unknown parsing error");
    });

    it("should handle execution time calculation error in parse (success path)", () => {
      const originalNow = performance.now;
      Object.defineProperty(performance, "now", {
        value: () => {
          throw new Error("No performance");
        },
        configurable: true,
      });
      try {
        const input = { year: 2023, month: 5, day: 15, hour: 10 };
        const result = strategy.parse(input, context);
        expect(result.success).toBe(true);
      } finally {
        Object.defineProperty(performance, "now", {
          value: originalNow,
          configurable: true,
        });
      }
    });

    it("should handle execution time calculation error in parse (error path)", () => {
      const originalNow = performance.now;
      Object.defineProperty(performance, "now", {
        value: () => {
          throw new Error("No performance");
        },
        configurable: true,
      });
      jest.spyOn(strategy, "validate").mockReturnValue({
        isValid: false,
        errors: ["Mock error"],
        normalizedInput: {} as any,
        suggestedStrategy: "fallback",
        confidence: 0,
        warnings: [],
      });

      try {
        const result = strategy.parse({ year: 2023 }, context);
        expect(result.success).toBe(false);
      } finally {
        Object.defineProperty(performance, "now", {
          value: originalNow,
          configurable: true,
        });
      }
    });
  });

  describe("getOptimizationHints", () => {
    it("should return hints for supported input", () => {
      const hints = strategy.getOptimizationHints({ year: 2023 });
      expect(hints.estimatedComplexity).toBe("low");
      expect(hints.shouldCache).toBe(false);
    });

    it("should return medium complexity for timezone/calendar", () => {
      const hints = strategy.getOptimizationHints({
        year: 2023,
        timeZone: "UTC",
      });
      expect(hints.estimatedComplexity).toBe("medium");
    });

    it("should return high complexity for high precision", () => {
      const hints = strategy.getOptimizationHints({
        year: 2023,
        nanosecond: 100,
      });
      expect(hints.estimatedComplexity).toBe("high");
      expect(hints.shouldCache).toBe(true);
    });

    it("should return fallback for invalid input", () => {
      const hints = strategy.getOptimizationHints({});
      expect(hints.preferredStrategy).toBe("fallback");
    });
  });
});
