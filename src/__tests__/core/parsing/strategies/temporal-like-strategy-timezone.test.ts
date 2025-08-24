import { TemporalLikeStrategy } from '../../../../core/parsing/strategies/temporal-like-strategy';
import { ParseContext, createParseContext } from '../../../../core/parsing/parsing-types';
import { DEFAULT_TEMPORAL_CONFIG } from '../../../../types/index';

/**
 * Test suite for TemporalLikeStrategy timezone handling
 * Verifies that global timezone settings are properly respected
 */
describe('TemporalLikeStrategy - Timezone Handling', () => {
  let strategy: TemporalLikeStrategy;
  
  beforeEach(() => {
    strategy = new TemporalLikeStrategy();
  });

  describe('Global Timezone Precedence', () => {
    it('should use global timezone from context when provided', () => {
      const input = { year: 2023, month: 6, day: 15, hour: 12 };
      const context = createParseContext(input, {
        timeZone: 'America/New_York'
      });

      const result = strategy.normalize(input, context);
      
      expect(result.normalizedInput).toMatchObject({
        year: 2023,
        month: 6,
        day: 15,
        hour: 12,
        timeZone: 'America/New_York'
      });
    });

    it('should use object timezone when no global timezone is provided', () => {
      const input = { year: 2023, month: 6, day: 15, timeZone: 'Europe/London' };
      const context = createParseContext(input, {});

      const result = strategy.normalize(input, context);
      
      expect(result.normalizedInput).toMatchObject({
        year: 2023,
        month: 6,
        day: 15,
        timeZone: 'Europe/London'
      });
    });

    it('should use default timezone when neither global nor object timezone is provided', () => {
      const input = { year: 2023, month: 6, day: 15 };
      const context = createParseContext(input, {});

      const result = strategy.normalize(input, context);
      
      expect(result.normalizedInput).toMatchObject({
        year: 2023,
        month: 6,
        day: 15,
        timeZone: DEFAULT_TEMPORAL_CONFIG.defaultTimeZone
      });
    });

    it('should override object timezone with global timezone and add warning', () => {
      const input = { year: 2023, month: 6, day: 15, timeZone: 'Europe/London' };
      const context = createParseContext(input, {
        timeZone: 'America/New_York'
      });

      const result = strategy.normalize(input, context);
      
      expect(result.normalizedInput).toMatchObject({
        year: 2023,
        month: 6,
        day: 15,
        timeZone: 'America/New_York'
      });
      // Check that timezone override is tracked in appliedTransforms
      expect(result.appliedTransforms).toContain(
        'timezone-override:Europe/London->America/New_York'
      );
    });

    it('should not add warning when global and object timezones are the same', () => {
      const input = { year: 2023, month: 6, day: 15, timeZone: 'America/New_York' };
      const context = createParseContext(input, {
        timeZone: 'America/New_York'
      });

      const result = strategy.normalize(input, context);
      
      // Should not have timezone override transform when timezones are the same
      expect(result.appliedTransforms).not.toContain(
        expect.stringContaining('timezone-override')
      );
    });
  });

  describe('End-to-End Timezone Parsing', () => {
    it('should create ZonedDateTime with global timezone', () => {
      const input = { year: 2023, month: 6, day: 15, hour: 12, timeZone: 'Europe/London' };
      const context = createParseContext(input, {
        timeZone: 'America/New_York'
      });

      const result = strategy.parse(input, context);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.timeZoneId).toBe('America/New_York');
    });

    it('should preserve object timezone when no global timezone is set', () => {
      const input = { year: 2023, month: 6, day: 15, hour: 12, timeZone: 'Europe/London' };
      const context = createParseContext(input, {});

      const result = strategy.parse(input, context);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.timeZoneId).toBe('Europe/London');
    });

    it('should use default timezone when none specified', () => {
      const input = { year: 2023, month: 6, day: 15, hour: 12 };
      const context = createParseContext(input, {});

      const result = strategy.parse(input, context);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.timeZoneId).toBe(DEFAULT_TEMPORAL_CONFIG.defaultTimeZone);
    });
  });
});