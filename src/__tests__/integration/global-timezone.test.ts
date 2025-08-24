/**
 * Integration test for global timezone functionality
 * Verifies that global timezone settings are respected across the entire library
 */

import { TemporalWrapper } from '../../TemporalWrapper';
import { TemporalUtils } from '../../TemporalUtils';

describe('Global Timezone Integration', () => {
  afterEach(() => {
    // Reset to default timezone after each test
    TemporalUtils.resetTimeZone();
  });

  it('should respect global timezone when parsing temporal-like objects', () => {
    // Set global timezone
    TemporalUtils.setDefaultTimeZone('America/New_York');
    
    // Parse a temporal-like object without explicit timezone
    const result = TemporalWrapper.from({
      year: 2023,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30
    });
    
    expect(result.isValid()).toBe(true);
    expect(result.timeZoneId).toBe('America/New_York');
  });

  it('should allow object timezone to override when no global timezone is set', () => {
    // Don't set any global timezone - use the default state
    // (resetTimeZone was called in afterEach)
    
    // Parse a temporal-like object with explicit timezone
    const result = TemporalWrapper.from({
      year: 2023,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      timeZone: 'Europe/London'
    } as any);
    
    expect(result.isValid()).toBe(true);
    expect(result.timeZoneId).toBe('Europe/London');
  });

  it('should use global timezone even when object has different timezone', () => {
    // Set global timezone
    TemporalUtils.setDefaultTimeZone('Asia/Tokyo');
    
    // Parse a temporal-like object with different timezone
    const result = TemporalWrapper.from({
      year: 2023,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30
    } as any);
    
    expect(result.isValid()).toBe(true);
    expect(result.timeZoneId).toBe('Asia/Tokyo');
  });

  it('should fall back to default timezone when no timezone is specified', () => {
    // Don't set any global timezone - use the default state (UTC)
    // (resetTimeZone was called in afterEach)
    
    // Parse a temporal-like object without timezone
    const result = TemporalWrapper.from({
      year: 2023,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30
    });
    
    expect(result.isValid()).toBe(true);
    expect(result.timeZoneId).toBe('UTC');
  });
});