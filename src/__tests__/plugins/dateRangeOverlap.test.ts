/**
 * @file Comprehensive test suite for the dateRangeOverlap plugin
 * Tests all functionality including edge cases, error handling, and performance
 */

import atemporal from '../../index';
import dateRangeOverlapPlugin, {
    checkDateRangeOverlap,
    InvalidDateRangeError,
    OverlapDetectionError,
    OverlapCache
} from '../../plugins/dateRangeOverlap';
import type { DateRange, OverlapResult, OverlapOptions } from '../../types';

// Apply the plugin before running tests
atemporal.extend(dateRangeOverlapPlugin);

describe('Date Range Overlap Plugin', () => {
    beforeEach(() => {
        // Clear cache before each test to ensure clean state
        OverlapCache.clear();
    });

    describe('Plugin Registration', () => {
        it('should add checkDateRangeOverlap method to atemporal factory', () => {
            expect(typeof atemporal.checkDateRangeOverlap).toBe('function');
        });

        it('should add rangeOverlapsWith method to TemporalWrapper instances', () => {
            const instance = atemporal('2024-01-15');
            expect(typeof instance.rangeOverlapsWith).toBe('function');
        });

        it('should add to method to TemporalWrapper instances', () => {
            const instance = atemporal('2024-01-15');
            expect(typeof instance.to).toBe('function');
        });
    });

    describe('Basic Overlap Detection', () => {
        it('should detect overlapping ranges', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-10'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
        });

        it('should detect non-overlapping ranges', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-10'
            };
            const range2: DateRange = {
                start: '2024-01-15',
                end: '2024-01-20'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(false);
            expect(result.overlapRange).toBeNull();
        });

        it('should handle identical ranges', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-01'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
        });

        it('should handle one range completely inside another', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-31'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-10'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-20'));
        });
    });

    describe('Boundary Handling', () => {
        it('should detect touching ranges when includeBoundaries is true (default)', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-15',
                end: '2024-01-30'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-15'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
        });

        it('should not detect touching ranges when includeBoundaries is false', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-15',
                end: '2024-01-30'
            };

            const result = checkDateRangeOverlap(range1, range2, { includeBoundaries: false });

            expect(result.overlaps).toBe(false);
            expect(result.overlapRange).toBeNull();
        });

        it('should handle zero-duration ranges (start === end)', () => {
            const range1: DateRange = {
                start: '2024-01-15',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-15'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
        });

        it('should handle both ranges being zero-duration and identical', () => {
            const range1: DateRange = {
                start: '2024-01-15',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-15',
                end: '2024-01-15'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-15'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
        });
    });

    describe('Input Validation', () => {
        it('should throw InvalidDateRangeError for null range', () => {
            const range1 = null as any;
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2))
                .toThrow(InvalidDateRangeError);
        });

        it('should throw InvalidDateRangeError for undefined range', () => {
            const range1 = undefined as any;
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2))
                .toThrow(InvalidDateRangeError);
        });

        it('should throw InvalidDateRangeError for range with null start', () => {
            const range1: DateRange = {
                start: null as any,
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2))
                .toThrow(InvalidDateRangeError);
        });

        it('should throw InvalidDateRangeError for range with null end', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: null as any
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2))
                .toThrow(InvalidDateRangeError);
        });

        it('should throw InvalidDateRangeError for invalid date strings', () => {
            const range1: DateRange = {
                start: 'invalid-date',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2))
                .toThrow(InvalidDateRangeError);
        });

        it('should throw InvalidDateRangeError when start is after end with strict validation', () => {
            const range1: DateRange = {
                start: '2024-01-15',
                end: '2024-01-01' // Invalid: end before start
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2, { strictValidation: true }))
                .toThrow(InvalidDateRangeError);
        });

        it('should not throw when start is after end with strict validation disabled', () => {
            const range1: DateRange = {
                start: '2024-01-15',
                end: '2024-01-01' // Invalid: end before start
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };

            expect(() => checkDateRangeOverlap(range1, range2, { strictValidation: false }))
                .not.toThrow();
        });
    });

    describe('Different Input Types', () => {
        it('should handle Date objects', () => {
            const range1: DateRange = {
                start: new Date('2024-01-01'),
                end: new Date('2024-01-15')
            };
            const range2: DateRange = {
                start: new Date('2024-01-10'),
                end: new Date('2024-01-20')
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });

        it('should handle Unix timestamps', () => {
            const range1: DateRange = {
                start: 1704067200000, // 2024-01-01
                end: 1705276800000   // 2024-01-15
            };
            const range2: DateRange = {
                start: 1704844800000, // 2024-01-10
                end: 1705708800000   // 2024-01-20
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });

        it('should handle TemporalWrapper instances', () => {
            const range1: DateRange = {
                start: atemporal('2024-01-01'),
                end: atemporal('2024-01-15')
            };
            const range2: DateRange = {
                start: atemporal('2024-01-10'),
                end: atemporal('2024-01-20')
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });

        it('should handle mixed input types', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: new Date('2024-01-15')
            };
            const range2: DateRange = {
                start: 1704844800000, // 2024-01-10
                end: atemporal('2024-01-20')
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });
    });

    describe('Timezone Handling', () => {
        it('should handle ranges in different timezones', () => {
            const range1: DateRange = {
                start: '2024-01-01T12:00:00',
                end: '2024-01-15T12:00:00'
            };
            const range2: DateRange = {
                start: '2024-01-10T12:00:00',
                end: '2024-01-20T12:00:00'
            };

            const result = checkDateRangeOverlap(range1, range2, { timezone: 'America/New_York' });

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });

        it('should use default timezone when not specified', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });
    });

    describe('Instance Methods', () => {
        describe('rangeOverlapsWith', () => {
            it('should check overlap with another range', () => {
                const date = atemporal('2024-01-15');
                const range: DateRange = {
                    start: '2024-01-10',
                    end: '2024-01-20'
                };

                const result = date.rangeOverlapsWith(range);

                expect(result.overlaps).toBe(true);
                expect(result.overlapRange).not.toBeNull();
                expect(result.overlapRange!.start).toEqual(new Date('2024-01-15'));
                expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
            });

            it('should return false when date is outside range', () => {
                const date = atemporal('2024-01-25');
                const range: DateRange = {
                    start: '2024-01-10',
                    end: '2024-01-20'
                };

                const result = date.rangeOverlapsWith(range);

                expect(result.overlaps).toBe(false);
                expect(result.overlapRange).toBeNull();
            });

            it('should throw error for invalid date instance', () => {
                const date = atemporal('invalid-date');
                const range: DateRange = {
                    start: '2024-01-10',
                    end: '2024-01-20'
                };

                expect(() => date.rangeOverlapsWith(range))
                    .toThrow(InvalidDateRangeError);
            });
        });

        describe('to', () => {
            it('should create a date range from current instance to end date', () => {
                const start = atemporal('2024-01-01');
                const range = start.to('2024-01-15');

                expect(range.start).toEqual(new Date('2024-01-01'));
                expect(range.end).toBe('2024-01-15');
            });

            it('should throw error for invalid date instance', () => {
                const start = atemporal('invalid-date');

                expect(() => start.to('2024-01-15'))
                    .toThrow(InvalidDateRangeError);
            });
        });
    });

    describe('Caching', () => {
        it('should cache overlap results for performance', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            // First call should calculate and cache
            const result1 = checkDateRangeOverlap(range1, range2);
            const stats1 = OverlapCache.getStats();

            // Second call should use cache
            const result2 = checkDateRangeOverlap(range1, range2);
            const stats2 = OverlapCache.getStats();

            expect(result1).toEqual(result2);
            expect(stats2.size).toBeGreaterThan(0);
        });

        it('should clear cache when requested', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            checkDateRangeOverlap(range1, range2);
            expect(OverlapCache.getStats().size).toBeGreaterThan(0);

            OverlapCache.clear();
            expect(OverlapCache.getStats().size).toBe(0);
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle large date ranges efficiently', () => {
            const range1: DateRange = {
                start: '1900-01-01',
                end: '2100-12-31'
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-12-31'
            };

            const startTime = performance.now();
            const result = checkDateRangeOverlap(range1, range2);
            const endTime = performance.now();

            expect(result.overlaps).toBe(true);
            expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
        });

        it('should handle many consecutive overlap checks efficiently', () => {
            const ranges: DateRange[] = [];
            for (let i = 0; i < 50; i++) {
                const startDay = (i % 28) + 1; // Keep days within valid range (1-28)
                const endDay = Math.min(startDay + 5, 28); // Ensure end day is also valid
                ranges.push({
                    start: `2024-01-${String(startDay).padStart(2, '0')}`,
                    end: `2024-01-${String(endDay).padStart(2, '0')}`
                });
            }

            const startTime = performance.now();
            for (let i = 0; i < ranges.length - 1; i++) {
                checkDateRangeOverlap(ranges[i], ranges[i + 1]);
            }
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
        });

        it('should handle ranges spanning different years', () => {
            const range1: DateRange = {
                start: '2023-12-15',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-01',
                end: '2024-02-01'
            };

            const result = checkDateRangeOverlap(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
            expect(result.overlapRange!.start).toEqual(new Date('2024-01-01'));
            expect(result.overlapRange!.end).toEqual(new Date('2024-01-15'));
        });
    });

    describe('Factory Method Integration', () => {
        it('should work with atemporal factory method', () => {
            const range1: DateRange = {
                start: '2024-01-01',
                end: '2024-01-15'
            };
            const range2: DateRange = {
                start: '2024-01-10',
                end: '2024-01-20'
            };

            const result = atemporal.checkDateRangeOverlap!(range1, range2);

            expect(result.overlaps).toBe(true);
            expect(result.overlapRange).not.toBeNull();
        });
    });
});