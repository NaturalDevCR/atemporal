import { Temporal } from "@js-temporal/polyfill";
import { TemporalPlainDateStrategy } from "../../../../../src/core/parsing/strategies/temporal-plain-date-strategy";
import { ParseContext } from "../../../../../src/core/parsing/parsing-types";

describe("TemporalPlainDateStrategy", () => {
  let strategy: TemporalPlainDateStrategy;
  let context: ParseContext;

  beforeEach(() => {
    strategy = new TemporalPlainDateStrategy();
    context = {
      options: {
        timeZone: "UTC",
        locale: "en-US",
      },
    } as any;
  });

  describe("basic properties", () => {
    it("should have correct type and priority", () => {
      expect(strategy.type).toBe("temporal-plain-date");
      expect(strategy.priority).toBe(80);
      expect(strategy.description).toContain("Temporal.PlainDate");
    });
  });

  describe("canHandle", () => {
    it("should handle Temporal.PlainDate instances", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      expect(strategy.canHandle(date, context)).toBe(true);
    });

    it("should not handle other inputs", () => {
      expect(strategy.canHandle(new Date(), context)).toBe(false);
      expect(strategy.canHandle("2023-01-01", context)).toBe(false);
      expect(strategy.canHandle({}, context)).toBe(false);
      expect(strategy.canHandle(null as any, context)).toBe(false);
    });
  });

  describe("validate", () => {
    it("should validate valid PlainDate", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const result = strategy.validate(date, context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid for non-PlainDate input", () => {
      const result = strategy.validate("invalid", context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Input is not a Temporal.PlainDate");
    });

    it("should warn if no timezone is provided", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const result = strategy.validate(date, { options: {} } as any);
      expect(result.warnings).toContain(
        "No timezone specified, will use default timezone and start of day"
      );
    });

    it("should handle invalid PlainDate (if possible to construct one)", () => {
      // It's hard to construct an invalid PlainDate instance as constructor validates.
      // But we can mock one to trigger the try/catch in validate
      const mockDate = Object.create(Temporal.PlainDate.prototype);
      // toString throwing
      mockDate.toString = () => {
        throw new Error("Invalid");
      };

      const result = strategy.validate(mockDate, context);
      expect(result.isValid).toBe(false); // Because errors pushed
      expect(result.errors).toContain("Invalid Temporal.PlainDate");
    });
  });

  describe("checkFastPath", () => {
    it("should return fast path for supported input", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const result = strategy.checkFastPath(date, context);
      expect(result.canUseFastPath).toBe(true);
      expect(result.confidence).toBe(0.85);
      expect(result.data).toBeDefined();
      expect(result.data?.year).toBe(2023);
    });

    it("should not use fast path for unsupported input", () => {
      const result = strategy.checkFastPath("invalid", context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should handle conversion errors in fast path", () => {
      const mockDate = Object.create(Temporal.PlainDate.prototype);
      mockDate.toPlainDateTime = () => {
        throw new Error("Conversion failed");
      };

      const result = strategy.checkFastPath(mockDate, context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should use default UTC in fast path if no timezone", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const result = strategy.checkFastPath(date, { options: {} } as any);
      expect(result.canUseFastPath).toBe(true);
      // check result data uses UTC (hard to verify without inspecting result intimately,
      // but ensures line 64 branch is taken)
    });
  });

  describe("parse", () => {
    it("should parse valid PlainDate", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const result = strategy.parse(date, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
        expect(result.data.month).toBe(1);
        expect(result.data.day).toBe(1);
        // Should start at 00:00:00
        expect(result.data.hour).toBe(0);
        expect(result.data.timeZoneId).toBe("UTC");
      }
    });

    it("should use default timezone if not provided", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      // Assuming default is UTC or system default.
      // In test environment likely UTC.
      const result = strategy.parse(date, { options: {} } as any);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.hour).toBe(0);
      }
    });

    it("should handle parsing errors", () => {
      const mockDate = Object.create(Temporal.PlainDate.prototype);
      mockDate.toPlainDateTime = () => {
        throw new Error("Parse failure");
      };

      const result = strategy.parse(mockDate, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle execution time calculation (lines 167-172 & 183-186)", () => {
      // Coverage for performance.now vs Date.now fallback
      // We can mock performance.now to throw
      const originalPerformance = global.performance;

      Object.defineProperty(global, "performance", {
        get: () => {
          throw new Error("No performance");
        },
        configurable: true,
      });

      try {
        const date = Temporal.PlainDate.from("2023-01-01");
        const result = strategy.parse(date, context);
        expect(result.success).toBe(true);
      } finally {
        Object.defineProperty(global, "performance", {
          value: originalPerformance,
          configurable: true,
        });
      }
    });

    it("should handle execution time calculation error during parse error", () => {
      const originalPerformance = global.performance;

      Object.defineProperty(global, "performance", {
        get: () => {
          throw new Error("No performance");
        },
        configurable: true,
      });

      const mockDate = Object.create(Temporal.PlainDate.prototype);
      mockDate.toPlainDateTime = () => {
        throw new Error("Parse failure");
      };

      try {
        const result = strategy.parse(mockDate, context);
        expect(result.success).toBe(false);
      } finally {
        Object.defineProperty(global, "performance", {
          value: originalPerformance,
          configurable: true,
        });
      }
    });
    it("should handle non-Error object thrown during parse", () => {
      const mockDate = Object.create(Temporal.PlainDate.prototype);
      mockDate.toPlainDateTime = () => {
        throw "string error";
      };

      const result = strategy.parse(mockDate, context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Unknown error parsing");
    });
  });

  describe("normalize", () => {
    it("should return input as is", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const result = strategy.normalize(date, context);
      expect(result.normalizedInput).toBe(date);
    });
  });

  describe("convert", () => {
    it("should convert PlainDate to ZonedDateTime", () => {
      const date = Temporal.PlainDate.from("2023-05-15");
      const result = strategy.convert(date, context);
      expect(result.result.year).toBe(2023);
      expect(result.result.month).toBe(5);
      expect(result.metadata.year).toBe(2023);
    });

    it("should use default config timezone if none provided", () => {
      const date = Temporal.PlainDate.from("2023-05-15");
      const result = strategy.convert(date, { options: {} } as any);
      // Default config likely UTC or similar
      expect(result.metadata.timeZone).toBeDefined();
    });
  });

  describe("getOptimizationHints", () => {
    it("should return correct hints", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const hints = strategy.getOptimizationHints(date, context);
      expect(hints.shouldCache).toBe(false);
      expect(hints.canUseFastPath).toBe(true);
      expect(hints.warnings).toHaveLength(0);
    });

    it("should return warnings if no timezone", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      const hints = strategy.getOptimizationHints(date, { options: {} } as any);
      expect(hints.warnings).toContain(
        "Consider specifying a timezone for more predictable results"
      );
    });
  });

  describe("getConfidence", () => {
    it("should return 0.85 for supported input", () => {
      const date = Temporal.PlainDate.from("2023-01-01");
      expect(strategy.getConfidence(date, context)).toBe(0.85);
    });

    it("should return 0 for unsupported input", () => {
      expect(strategy.getConfidence("invalid", context)).toBe(0);
    });
  });
});
