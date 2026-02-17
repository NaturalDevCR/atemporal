import { Temporal } from "@js-temporal/polyfill";
import { TemporalInstantStrategy } from "../../../../../src/core/parsing/strategies/temporal-instant-strategy";
import { ParseContext } from "../../../../../src/core/parsing/parsing-types";

describe("TemporalInstantStrategy", () => {
  let strategy: TemporalInstantStrategy;
  let context: ParseContext;

  beforeEach(() => {
    strategy = new TemporalInstantStrategy();
    context = {
      options: {
        timeZone: "UTC",
        locale: "en-US",
      },
    } as any;
  });

  describe("basic properties", () => {
    it("should have correct type and priority", () => {
      expect(strategy.type).toBe("temporal-instant");
      expect(strategy.priority).toBe(90);
      expect(strategy.description).toContain("Temporal.Instant");
    });
  });

  describe("canHandle", () => {
    it("should handle Temporal.Instant instances", () => {
      const instant = Temporal.Now.instant();
      expect(strategy.canHandle(instant, context)).toBe(true);
    });

    it("should not handle other inputs", () => {
      expect(strategy.canHandle(new Date(), context)).toBe(false);
      expect(strategy.canHandle(Temporal.Now.plainDateISO(), context)).toBe(
        false
      );
    });
  });

  describe("validate", () => {
    it("should validate valid Instant", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.validate(instant, context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid for incorrect input type", () => {
      const result = strategy.validate("invalid", context);
      expect(result.isValid).toBe(false);
    });

    it("should handle invalid Instant (throwing toString)", () => {
      const mockInstant = Object.create(Temporal.Instant.prototype);
      mockInstant.toString = () => {
        throw new Error("Invalid");
      };

      const result = strategy.validate(mockInstant, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid Temporal.Instant");
    });
  });

  describe("checkFastPath", () => {
    it("should use fast path with timezone", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.checkFastPath(instant, context);
      expect(result.canUseFastPath).toBe(true);
      expect(result.data.timeZoneId).toBe("UTC");
    });

    it("should use fast path with default timezone", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.checkFastPath(instant, { options: {} } as any);
      expect(result.canUseFastPath).toBe(true);
      expect(result.data.timeZoneId).toBe("UTC");
    });

    it("should fail fast path if conversion throws", () => {
      const mockInstant = Object.create(Temporal.Instant.prototype);
      mockInstant.toZonedDateTimeISO = () => {
        throw new Error("Conversion error");
      };

      const result = strategy.checkFastPath(mockInstant, context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should fail fast path for invalid input", () => {
      expect(strategy.checkFastPath("invalid", context).canUseFastPath).toBe(
        false
      );
    });
  });

  describe("normalize", () => {
    it("should return input as is", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.normalize(instant, context);
      expect(result.normalizedInput).toBe(instant);
    });
  });

  describe("parse", () => {
    it("should parse and convert to ZonedDateTime", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.parse(instant, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.timeZoneId).toBe("UTC");
      }
    });

    it("should use default config timezone if none provided", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.parse(instant, { options: {} } as any);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // Default config likely UTC or based on env
        expect(result.data.timeZoneId).toBeDefined();
      }
    });

    it("should return error if conversion throws", () => {
      const mockInstant = Object.create(Temporal.Instant.prototype);
      mockInstant.toZonedDateTimeISO = () => {
        throw new Error("Conversion error");
      };

      const result = strategy.parse(mockInstant, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle execution time calculation error using performance", () => {
      const originalNow = performance.now;
      Object.defineProperty(performance, "now", {
        value: () => {
          throw new Error("No performance");
        },
        configurable: true,
      });

      try {
        const instant = Temporal.Now.instant();
        const result = strategy.parse(instant, context);
        expect(result.success).toBe(true);
      } finally {
        Object.defineProperty(performance, "now", {
          value: originalNow,
          configurable: true,
        });
      }
    });

    it("should handle execution time error during parse error", () => {
      const originalNow = performance.now;
      Object.defineProperty(performance, "now", {
        value: () => {
          throw new Error("No performance");
        },
        configurable: true,
      });

      const mockInstant = Object.create(Temporal.Instant.prototype);
      mockInstant.toZonedDateTimeISO = () => {
        throw new Error("Conversion error");
      };

      try {
        const result = strategy.parse(mockInstant, context);
        expect(result.success).toBe(false);
      } finally {
        Object.defineProperty(performance, "now", {
          value: originalNow,
          configurable: true,
        });
      }
    });

    it("should handle non-Error throw", () => {
      const mockInstant = Object.create(Temporal.Instant.prototype);
      mockInstant.toZonedDateTimeISO = () => {
        throw "string error";
      };
      const result = strategy.parse(mockInstant, context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Unknown error");
    });
  });

  describe("convert", () => {
    it("should return intermediate representation", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.convert(instant, context);
      expect(result.intermediateSteps).toContain("temporal-instant");
      expect(result.metadata.timeZone).toBe("UTC");
    });

    it("should use default config timezone for metadata", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.convert(instant, { options: {} } as any);
      expect(result.metadata.timeZone).toBeDefined();
    });
  });

  describe("getOptimizationHints", () => {
    it("should return correct hints", () => {
      const instant = Temporal.Now.instant();
      const result = strategy.getOptimizationHints(instant, context);
      expect(result.shouldCache).toBe(false);
      expect(result.canUseFastPath).toBe(true);
    });
  });

  describe("getConfidence", () => {
    it("should return 0.95 for valid input", () => {
      const instant = Temporal.Now.instant();
      expect(strategy.getConfidence(instant, context)).toBe(0.95);
    });

    it("should return 0 for invalid input", () => {
      expect(strategy.getConfidence("invalid", context)).toBe(0);
    });
  });
});
