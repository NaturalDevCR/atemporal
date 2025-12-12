import { Temporal } from "@js-temporal/polyfill";
import { TemporalZonedStrategy } from "../../../../../src/core/parsing/strategies/temporal-zoned-strategy";
import { ParseContext } from "../../../../../src/core/parsing/parsing-types";

describe("TemporalZonedStrategy", () => {
  let strategy: TemporalZonedStrategy;
  let context: ParseContext;

  beforeEach(() => {
    strategy = new TemporalZonedStrategy();
    context = {
      options: {
        timeZone: "UTC",
        locale: "en-US",
      },
    } as any;
  });

  describe("basic properties", () => {
    it("should have correct type and priority", () => {
      expect(strategy.type).toBe("temporal-zoned");
      expect(strategy.priority).toBe(95);
      expect(strategy.description).toContain("Temporal.ZonedDateTime");
    });
  });

  describe("canHandle", () => {
    it("should handle Temporal.ZonedDateTime instances", () => {
      const zdt = Temporal.Now.zonedDateTimeISO();
      expect(strategy.canHandle(zdt, context)).toBe(true);
    });

    it("should not handle other inputs", () => {
      expect(strategy.canHandle(new Date(), context)).toBe(false);
      expect(strategy.canHandle(Temporal.Now.plainDateISO(), context)).toBe(
        false
      );
    });
  });

  describe("validate", () => {
    it("should validate valid ZonedDateTime", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      const result = strategy.validate(zdt, context);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("should return invalid for incorrect input type", () => {
      const result = strategy.validate("invalid", context);
      expect(result.isValid).toBe(false);
    });

    it("should warn on timezone mismatch", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("America/New_York");
      const result = strategy.validate(zdt, context); // context is UTC
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain(
        "Input timezone (America/New_York) differs from target timezone (UTC)"
      );
    });

    it("should handle invalid ZonedDateTime (throwing toString)", () => {
      const mockZDT = Object.create(Temporal.ZonedDateTime.prototype);
      mockZDT.toString = () => {
        throw new Error("Invalid");
      };
      Object.defineProperty(mockZDT, "timeZoneId", { value: "UTC" });

      const result = strategy.validate(mockZDT, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid Temporal.ZonedDateTime");
    });
  });

  describe("checkFastPath", () => {
    it("should use fast path with no conversion if timezone matches", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      const result = strategy.checkFastPath(zdt, context);
      expect(result.canUseFastPath).toBe(true);
      expect(result.data).toBe(zdt);
    });

    it("should use fast path with no conversion if no target timezone", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      const noTzContext = { options: {} } as any;
      const result = strategy.checkFastPath(zdt, noTzContext);
      expect(result.canUseFastPath).toBe(true);
      expect(result.data).toBe(zdt);
    });

    it("should use fast path with conversion if timezone differs", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("America/New_York");
      // Context is UTC
      const result = strategy.checkFastPath(zdt, context);
      expect(result.canUseFastPath).toBe(true);
      expect(result.data.timeZoneId).toBe("UTC");
    });

    it("should fail fast path for invalid input", () => {
      expect(strategy.checkFastPath("invalid", context).canUseFastPath).toBe(
        false
      );
    });

    it("should fail fast path if conversion throws", () => {
      const mockZDT = Object.create(Temporal.ZonedDateTime.prototype);
      // withTimeZone throwing
      Object.defineProperty(mockZDT, "timeZoneId", {
        value: "America/New_York",
      });
      mockZDT.withTimeZone = () => {
        throw new Error("Conversion error");
      };

      const result = strategy.checkFastPath(mockZDT, context);
      expect(result.canUseFastPath).toBe(false);
    });
  });

  describe("normalize", () => {
    it("should convert timezone during normalization", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("America/New_York");
      const result = strategy.normalize(zdt, context);
      expect(
        (result.normalizedInput as Temporal.ZonedDateTime).timeZoneId
      ).toBe("UTC");
      expect(result.appliedTransforms).toContain("timezone-conversion");
    });

    it("should not convert if timezone matches", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      const result = strategy.normalize(zdt, context);
      expect(result.appliedTransforms).toHaveLength(0);
    });
  });

  describe("parse", () => {
    it("should parse and convert timezone", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("America/New_York");
      const result = strategy.parse(zdt, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.timeZoneId).toBe("UTC");
      }
    });

    it("should parse without conversion if no target timezone", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("America/New_York");
      const result = strategy.parse(zdt, { options: {} } as any);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.timeZoneId).toBe("America/New_York");
      }
    });

    it("should return error if conversion throws", () => {
      const mockZDT = Object.create(Temporal.ZonedDateTime.prototype);
      Object.defineProperty(mockZDT, "timeZoneId", {
        value: "America/New_York",
      });
      mockZDT.withTimeZone = () => {
        throw new Error("Conversion error");
      };

      const result = strategy.parse(mockZDT, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle execution time calculation error", () => {
      const nowSpy = jest.spyOn(performance, "now").mockImplementation(() => {
        throw new Error("No performance");
      });

      try {
        const zdt = Temporal.Now.zonedDateTimeISO("UTC");
        const result = strategy.parse(zdt, context);
        expect(result.success).toBe(true);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it("should handle execution time error during parse error", () => {
      const nowSpy = jest.spyOn(performance, "now").mockImplementation(() => {
        throw new Error("No performance");
      });

      const mockZDT = Object.create(Temporal.ZonedDateTime.prototype);
      Object.defineProperty(mockZDT, "timeZoneId", {
        value: "America/New_York",
      });
      mockZDT.withTimeZone = () => {
        throw new Error("Conversion error");
      };

      try {
        const result = strategy.parse(mockZDT, context);
        expect(result.success).toBe(false);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it("should handle non-Error throw", () => {
      const mockZDT = Object.create(Temporal.ZonedDateTime.prototype);
      Object.defineProperty(mockZDT, "timeZoneId", {
        value: "America/New_York",
      });
      mockZDT.withTimeZone = () => {
        throw "string error";
      };
      const result = strategy.parse(mockZDT, context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Unknown error");
    });
  });

  describe("convert", () => {
    it("should return intermediate representation", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      const result = strategy.convert(zdt, context);
      expect(result.intermediateSteps).toContain("temporal-zoned");
      expect(result.metadata.timeZoneId).toBe("UTC");
    });
  });

  describe("getOptimizationHints", () => {
    it("should return hints", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      const result = strategy.getOptimizationHints(zdt, context);
      expect(result.shouldCache).toBe(false);
    });

    it("should warn if conversion needed", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("America/New_York");
      const result = strategy.getOptimizationHints(zdt, context);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe("getConfidence", () => {
    it("should return 1.0 for valid input", () => {
      const zdt = Temporal.Now.zonedDateTimeISO("UTC");
      expect(strategy.getConfidence(zdt, context)).toBe(1.0);
    });

    it("should return 0 for invalid input", () => {
      expect(strategy.getConfidence("invalid", context)).toBe(0);
    });
  });
});
