/**
 * @file Test suite for temporal detection utility
 * Tests native Temporal API detection and fallback to polyfill
 */

import {
  isNativeTemporalAvailable,
  getTemporalAPI,
  initializeTemporal,
  getCachedTemporalAPI,
  resetTemporalAPICache,
  isBrowserEnvironment,
  isNodeEnvironment,
  getTemporalInfo,
} from "../../core/temporal-detection";

describe("Temporal Detection", () => {
  beforeEach(() => {
    // Reset cache before each test
    resetTemporalAPICache();
  });

  describe("isNativeTemporalAvailable", () => {
    it("should return false when native Temporal is not available", () => {
      // In current environments, native Temporal is not yet available
      expect(isNativeTemporalAvailable()).toBe(false);
    });

    it("should handle errors gracefully", () => {
      // Mock global to not have Temporal
      const originalTemporal = (global as any).Temporal;
      delete (global as any).Temporal;

      expect(isNativeTemporalAvailable()).toBe(false);

      // Restore original Temporal if it existed
      if (originalTemporal) {
        (global as any).Temporal = originalTemporal;
      }
    });

    it("should return false when error occurs during detection", () => {
      // Mock global.Temporal to throw error on access
      Object.defineProperty(global, "Temporal", {
        configurable: true,
        get: () => {
          throw new Error("Access error");
        },
      });

      expect(isNativeTemporalAvailable()).toBe(false);

      // Cleanup
      delete (global as any).Temporal;
    });

    it("should return true when native Temporal is properly available", () => {
      // Mock native Temporal API
      const mockTemporal = {
        Now: {},
        PlainDate: function () {},
        PlainDateTime: function () {},
        ZonedDateTime: function () {},
        Instant: function () {},
        Duration: function () {},
        PlainTime: function () {},
        PlainYearMonth: function () {},
        PlainMonthDay: function () {},
        TimeZone: function () {},
        Calendar: function () {},
      };

      const originalTemporal = (global as any).Temporal;
      (global as any).Temporal = mockTemporal;

      expect(isNativeTemporalAvailable()).toBe(true);

      // Restore original Temporal
      if (originalTemporal) {
        (global as any).Temporal = originalTemporal;
      } else {
        delete (global as any).Temporal;
      }
    });

    it("should return false when Temporal object is incomplete", () => {
      // Mock incomplete Temporal API
      const incompleteTemporal = {
        Now: {},
        PlainDate: function () {},
        // Missing other required methods
      };

      const originalTemporal = (global as any).Temporal;
      (global as any).Temporal = incompleteTemporal;

      expect(isNativeTemporalAvailable()).toBe(false);

      // Restore original Temporal
      if (originalTemporal) {
        (global as any).Temporal = originalTemporal;
      } else {
        delete (global as any).Temporal;
      }
    });
  });

  describe("getTemporalAPI", () => {
    it("should return polyfilled Temporal when native is not available", () => {
      const api = getTemporalAPI();
      expect(api.isNative).toBe(false);
      expect(api.Temporal).toBeDefined();
      expect(typeof api.Temporal.Now).toBe("object");
      expect(typeof api.Temporal.PlainDate).toBe("function");
    });

    it("should return native Temporal when available", () => {
      // Mock native Temporal API
      const mockTemporal = {
        Now: {},
        PlainDate: function () {},
        PlainDateTime: function () {},
        ZonedDateTime: function () {},
        Instant: function () {},
        Duration: function () {},
        PlainTime: function () {},
        PlainYearMonth: function () {},
        PlainMonthDay: function () {},
        TimeZone: function () {},
        Calendar: function () {},
      };

      const originalTemporal = (global as any).Temporal;
      (global as any).Temporal = mockTemporal;

      const api = getTemporalAPI();
      expect(api.isNative).toBe(true);
      expect(api.Temporal).toBe(mockTemporal);

      // Restore original Temporal
      if (originalTemporal) {
        (global as any).Temporal = originalTemporal;
      } else {
        delete (global as any).Temporal;
      }
    });
  });

  describe("initializeTemporal", () => {
    it("should initialize and return Temporal API", () => {
      const api = initializeTemporal();
      expect(api).toBeDefined();
      expect(api.Temporal).toBeDefined();
      expect(typeof api.isNative).toBe("boolean");
    });

    it("should log in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      initializeTemporal();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Atemporal: Using")
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("getCachedTemporalAPI", () => {
    it("should cache the Temporal API instance", () => {
      const api1 = getCachedTemporalAPI();
      const api2 = getCachedTemporalAPI();

      expect(api1).toBe(api2); // Should be the same instance
    });

    it("should reinitialize after cache reset", () => {
      const api1 = getCachedTemporalAPI();
      resetTemporalAPICache();
      const api2 = getCachedTemporalAPI();

      expect(api1).not.toBe(api2); // Should be different instances
      expect(api1.isNative).toBe(api2.isNative); // But same configuration
    });
  });

  describe("Environment Detection", () => {
    describe("isBrowserEnvironment", () => {
      it("should return false in Node.js environment", () => {
        expect(isBrowserEnvironment()).toBe(false);
      });

      it("should return true when browser globals are present", () => {
        // Mock browser environment
        (global as any).window = {};
        (global as any).document = {};
        (global as any).navigator = {};

        expect(isBrowserEnvironment()).toBe(true);

        // Clean up
        delete (global as any).window;
        delete (global as any).document;
        delete (global as any).navigator;
      });
    });

    describe("isNodeEnvironment", () => {
      it("should return true in Node.js environment", () => {
        expect(isNodeEnvironment()).toBe(true);
      });

      it("should return false when Node.js globals are not present", () => {
        const originalProcess = (global as any).process;
        const originalVersions = originalProcess?.versions;

        // Mock process without versions property
        if (originalProcess) {
          delete originalProcess.versions;
        }

        expect(isNodeEnvironment()).toBe(false);

        // Restore process versions
        if (originalProcess && originalVersions) {
          originalProcess.versions = originalVersions;
        }
      });

      it("should return false when check throws error", () => {
        const originalProcess = (global as any).process;

        try {
          Object.defineProperty(global, "process", {
            configurable: true,
            get: () => {
              throw new Error("Process check error");
            },
          });

          expect(isNodeEnvironment()).toBe(false);
        } finally {
          // Restore
          if (originalProcess) {
            Object.defineProperty(global, "process", {
              configurable: true,
              value: originalProcess,
              writable: true,
            });
          }
        }
      });
    });
  });

  describe("getTemporalInfo", () => {
    it("should return comprehensive Temporal information", () => {
      const info = getTemporalInfo();

      expect(info).toHaveProperty("isNative");
      expect(info).toHaveProperty("environment");
      expect(info).toHaveProperty("version");
      expect(typeof info.isNative).toBe("boolean");
      expect(["browser", "node", "unknown"]).toContain(info.environment);
      expect(["native", "polyfill"]).toContain(info.version);
    });

    it("should correctly identify Node.js environment", () => {
      const info = getTemporalInfo();
      expect(info.environment).toBe("node");
    });

    it("should use polyfill version in current environment", () => {
      const info = getTemporalInfo();
      expect(info.version).toBe("polyfill");
      expect(info.isNative).toBe(false);
    });
  });
});
