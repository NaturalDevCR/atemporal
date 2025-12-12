import { Temporal } from "@js-temporal/polyfill";
import { TemporalPlainDateTimeStrategy } from "../../../../../src/core/parsing/strategies/temporal-plain-datetime-strategy";
import { ParseContext } from "../../../../../src/core/parsing/parsing-types";

describe("TemporalPlainDateTimeStrategy", () => {
  let strategy: TemporalPlainDateTimeStrategy;
  let context: ParseContext;

  beforeEach(() => {
    strategy = new TemporalPlainDateTimeStrategy();
    context = {
      options: {
        timeZone: "UTC",
        locale: "en-US",
      },
      localeConfig: {},
    } as any;
  });

  describe("basic properties", () => {
    it("should have correct type and priority", () => {
      expect(strategy.type).toBe("temporal-plain-datetime");
      expect(strategy.priority).toBe(85);
      expect(strategy.description).toContain("Temporal.PlainDateTime");
    });
  });

  describe("canHandle", () => {
    it("should handle Temporal.PlainDateTime instances", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      expect(strategy.canHandle(dateTime, context)).toBe(true);
    });

    it("should not handle other inputs", () => {
      expect(strategy.canHandle(new Date(), context)).toBe(false);
      expect(strategy.canHandle("2023-01-01T10:30:00", context)).toBe(false);
      expect(
        strategy.canHandle(Temporal.PlainDate.from("2023-01-01"), context)
      ).toBe(false);
      expect(strategy.canHandle({}, context)).toBe(false);
      expect(strategy.canHandle(null as any, context)).toBe(false);
    });
  });

  describe("validate", () => {
    it("should validate valid PlainDateTime", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.validate(dateTime, context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid for non-PlainDateTime input", () => {
      const result = strategy.validate("invalid", context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Input is not a Temporal.PlainDateTime");
    });

    it("should warn if no timezone is provided", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.validate(dateTime, { options: {} } as any);
      expect(result.warnings).toContain(
        "No timezone specified, will use default timezone"
      );
    });

    it("should handle invalid PlainDateTime (mocked)", () => {
      const mockDateTime = Object.create(Temporal.PlainDateTime.prototype);
      mockDateTime.toString = () => {
        throw new Error("Invalid");
      };

      const result = strategy.validate(mockDateTime, context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid Temporal.PlainDateTime");
    });
  });

  describe("checkFastPath", () => {
    it("should return fast path for supported input", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.checkFastPath(dateTime, context);
      expect(result.canUseFastPath).toBe(true);
      expect(result.confidence).toBe(0.9);
      expect(result.data).toBeDefined();
      expect(result.data?.year).toBe(2023);
      expect(result.data?.hour).toBe(10);
    });

    it("should not use fast path for unsupported input", () => {
      const result = strategy.checkFastPath("invalid", context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should handle conversion errors in fast path", () => {
      const mockDateTime = Object.create(Temporal.PlainDateTime.prototype);
      mockDateTime.toZonedDateTime = () => {
        throw new Error("Conversion failed");
      };

      const result = strategy.checkFastPath(mockDateTime, context);
      expect(result.canUseFastPath).toBe(false);
    });

    it("should use default UTC in fast path if no timezone", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.checkFastPath(dateTime, { options: {} } as any);
      expect(result.canUseFastPath).toBe(true);
    });
  });

  describe("parse", () => {
    it("should parse valid PlainDateTime", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.parse(dateTime, context);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
        expect(result.data.month).toBe(1);
        expect(result.data.day).toBe(1);
        expect(result.data.hour).toBe(10);
        expect(result.data.minute).toBe(30);
        expect(result.data.timeZoneId).toBe("UTC");
      }
    });

    it("should use default timezone if not provided", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.parse(dateTime, { options: {} } as any);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.year).toBe(2023);
      }
    });

    it("should handle parsing errors", () => {
      const mockDateTime = Object.create(Temporal.PlainDateTime.prototype);
      mockDateTime.toZonedDateTime = () => {
        throw new Error("Parse failure");
      };

      const result = strategy.parse(mockDateTime, context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle execution time calculation error", () => {
      const nowSpy = jest.spyOn(performance, "now").mockImplementation(() => {
        throw new Error("No performance");
      });

      try {
        const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
        const result = strategy.parse(dateTime, context);
        expect(result.success).toBe(true);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it("should handle execution time calculation error during parse error", () => {
      const nowSpy = jest.spyOn(performance, "now").mockImplementation(() => {
        throw new Error("No performance");
      });

      const mockDateTime = Object.create(Temporal.PlainDateTime.prototype);
      mockDateTime.toZonedDateTime = () => {
        throw new Error("Parse failure");
      };

      try {
        const result = strategy.parse(mockDateTime, context);
        expect(result.success).toBe(false);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it("should handle non-Error object thrown during parse", () => {
      const mockDateTime = Object.create(Temporal.PlainDateTime.prototype);
      mockDateTime.toZonedDateTime = () => {
        throw "string error";
      };

      const result = strategy.parse(mockDateTime, context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Unknown error parsing");
    });
  });

  describe("normalize", () => {
    it("should return input as is", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const result = strategy.normalize(dateTime, context);
      expect(result.normalizedInput).toBe(dateTime);
    });
  });

  describe("convert", () => {
    it("should convert PlainDateTime to ZonedDateTime", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-05-15T10:30:00");
      const result = strategy.convert(dateTime, context);
      expect(result.result.year).toBe(2023);
      expect(result.result.hour).toBe(10);
      expect(result.metadata.year).toBe(2023);
    });

    it("should use default config timezone if none provided", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-05-15T10:30:00");
      const result = strategy.convert(dateTime, { options: {} } as any);
      expect(result.metadata.timeZone).toBeDefined();
    });
  });

  describe("getOptimizationHints", () => {
    it("should return correct hints", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const hints = strategy.getOptimizationHints(dateTime, context);
      expect(hints.shouldCache).toBe(false);
      expect(hints.canUseFastPath).toBe(true);
      expect(hints.warnings).toHaveLength(0);
    });

    it("should return warnings if no timezone", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      const hints = strategy.getOptimizationHints(dateTime, {
        options: {},
      } as any);
      expect(hints.warnings).toContain(
        "Consider specifying a timezone for more predictable results"
      );
    });
  });

  describe("getConfidence", () => {
    it("should return 0.9 for supported input", () => {
      const dateTime = Temporal.PlainDateTime.from("2023-01-01T10:30:00");
      expect(strategy.getConfidence(dateTime, context)).toBe(0.9);
    });

    it("should return 0 for unsupported input", () => {
      expect(strategy.getConfidence("invalid", context)).toBe(0);
    });
  });
});
