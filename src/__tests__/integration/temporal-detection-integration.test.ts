/**
 * @file Integration test for temporal detection system
 * Tests that the library correctly uses native Temporal when available or falls back to polyfill
 */

import atemporal from '../../index';

describe('Temporal Detection Integration', () => {
  it('should provide temporal information through the main API', () => {
    const info = atemporal.getTemporalInfo();
    
    expect(info).toBeDefined();
    expect(typeof info.isNative).toBe('boolean');
    expect(['browser', 'node', 'unknown']).toContain(info.environment);
    expect(['native', 'polyfill']).toContain(info.version);
  });

  it('should currently use polyfill in test environment', () => {
    const info = atemporal.getTemporalInfo();
    
    expect(info.isNative).toBe(false);
    expect(info.version).toBe('polyfill');
    expect(info.environment).toBe('node');
  });

  it('should create atemporal instances successfully with detection system', () => {
    const now = atemporal();
    const fromString = atemporal('2023-12-25T10:00:00Z');
    const fromUnix = atemporal.unix(1640995200);
    
    expect(now.isValid()).toBe(true);
    expect(fromString.isValid()).toBe(true);
    expect(fromUnix.isValid()).toBe(true);
    
    expect(fromString.format('YYYY-MM-DD')).toBe('2023-12-25');
  });

  it('should maintain backward compatibility', () => {
    // Test that all existing functionality still works
    const date1 = atemporal('2023-01-01');
    const date2 = atemporal('2023-01-02');
    
    expect(date1.isBefore(date2)).toBe(true);
    expect(date2.isAfter(date1)).toBe(true);
    expect(date1.diff(date2, 'days')).toBe(-1);
    
    // Test chaining
    const result = atemporal('2023-01-01')
      .add(1, 'month')
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
    
    expect(result).toBe('2023-01-31');
  });

  it('should work with different input types', () => {
    const fromDate = atemporal(new Date('2023-01-01'));
    const fromNumber = atemporal(1672531200000); // 2023-01-01 in milliseconds
    const fromArray = atemporal([2023, 1, 1]); // Year, month (1-based), day
    
    expect(fromDate.isValid()).toBe(true);
    expect(fromNumber.isValid()).toBe(true);
    expect(fromArray.isValid()).toBe(true);
    
    // All should represent the same date
    const expectedFormat = '2023-01-01';
    expect(fromDate.format('YYYY-MM-DD')).toBe(expectedFormat);
    expect(fromNumber.format('YYYY-MM-DD')).toBe(expectedFormat);
    expect(fromArray.format('YYYY-MM-DD')).toBe(expectedFormat);
  });

  it('should demonstrate temporal detection system is working', () => {
    // This test verifies that the temporal detection system is integrated
    // and the library functions correctly with either native or polyfilled Temporal
    const info = atemporal.getTemporalInfo();
    const date = atemporal('2023-01-01');
    
    expect(info).toBeDefined();
    expect(date.isValid()).toBe(true);
    expect(date.format('YYYY-MM-DD')).toBe('2023-01-01');
  });
});