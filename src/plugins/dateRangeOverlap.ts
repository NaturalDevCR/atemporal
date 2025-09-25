/**
 * @file Date Range Overlap Detection Plugin
 * This plugin extends the atemporal library with date range overlap detection capabilities.
 * It provides methods to check if two date ranges intersect and retrieve the overlapping period.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils, LRUCache, GlobalCacheCoordinator } from '../TemporalUtils';
import { LocaleUtils } from '../core/locale';
import type { AtemporalFactory, Plugin, DateRange, OverlapResult, OverlapOptions, DateInput } from '../types';
import { InvalidDateError } from '../errors';

/**
 * Custom error class for date range overlap detection errors.
 */
export class InvalidDateRangeError extends Error {
    constructor(message: string, public range?: DateRange) {
        super(message);
        this.name = 'InvalidDateRangeError';
    }
}

/**
 * Custom error class for overlap detection operation errors.
 */
export class OverlapDetectionError extends Error {
    constructor(message: string, public ranges?: [DateRange, DateRange]) {
        super(message);
        this.name = 'OverlapDetectionError';
    }
}

/**
 * Cache for overlap detection results to improve performance.
 * Stores calculated overlap results with range-aware keys.
 */
class OverlapCache {
    private static cache = new LRUCache<string, OverlapResult>(200); // Reasonable size for overlap cache
    private static readonly MAX_SIZE = 200;

    /**
     * Generates a cache key for two date ranges and options.
     * @param range1 - First date range
     * @param range2 - Second date range
     * @param options - Overlap detection options
     * @returns Cache key string
     */
    private static generateKey(
        range1: DateRange,
        range2: DateRange,
        options: OverlapOptions
    ): string {
        // Handle null/undefined ranges safely
        if (!range1 || !range2) {
            return `null:${Date.now()}:${Math.random()}`; // Unique key for invalid ranges
        }
        
        const r1Start = typeof range1.start === 'string' ? range1.start : String(range1.start);
        const r1End = typeof range1.end === 'string' ? range1.end : String(range1.end);
        const r2Start = typeof range2.start === 'string' ? range2.start : String(range2.start);
        const r2End = typeof range2.end === 'string' ? range2.end : String(range2.end);
        
        return `${r1Start}:${r1End}:${r2Start}:${r2End}:${options.includeBoundaries}:${options.timezone}:${options.strictValidation}`;
    }

    /**
     * Gets a cached overlap result or returns null if not found.
     * @param range1 - First date range
     * @param range2 - Second date range
     * @param options - Overlap detection options
     * @returns Cached result or null
     */
    static getOverlapResult(
        range1: DateRange,
        range2: DateRange,
        options: OverlapOptions
    ): OverlapResult | null {
        // Don't use cache for invalid ranges
        if (!range1 || !range2) {
            return null;
        }
        
        const key = this.generateKey(range1, range2, options);
        const result = this.cache.get(key);
        return result !== undefined ? result : null;
    }

    /**
     * Caches an overlap detection result.
     * @param range1 - First date range
     * @param range2 - Second date range
     * @param options - Overlap detection options
     * @param result - The result to cache
     */
    static setOverlapResult(
        range1: DateRange,
        range2: DateRange,
        options: OverlapOptions,
        result: OverlapResult
    ): void {
        // Don't cache results for invalid ranges
        if (!range1 || !range2) {
            return;
        }
        
        const key = this.generateKey(range1, range2, options);
        this.cache.set(key, result);
    }

    /**
     * Clears the overlap cache.
     */
    static clear(): void {
        this.cache.clear();
    }

    /**
     * Gets cache statistics.
     * @returns Object with cache size and max size
     */
    static getStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE
        };
    }
}

// Register with global cache coordinator
GlobalCacheCoordinator.registerCache('dateRangeOverlap', {
    clear: () => OverlapCache.clear(),
    getStats: () => OverlapCache.getStats()
});

/**
 * Validates a date range object for consistency and valid dates.
 * @param range - The date range to validate
 * @param options - Validation options
 * @returns Validated TemporalWrapper instances for start and end
 * @throws InvalidDateRangeError if validation fails
 */
function validateDateRange(
    range: DateRange,
    options: OverlapOptions
): { start: TemporalWrapper; end: TemporalWrapper } {
    if (!range || typeof range !== 'object') {
        throw new InvalidDateRangeError('Date range must be an object with start and end properties', range);
    }

    if (range.start === undefined || range.start === null) {
        throw new InvalidDateRangeError('Date range start cannot be null or undefined', range);
    }

    if (range.end === undefined || range.end === null) {
        throw new InvalidDateRangeError('Date range end cannot be null or undefined', range);
    }

    let start: TemporalWrapper;
    let end: TemporalWrapper;

    try {
        start = TemporalWrapper.from(range.start, options.timezone);
        if (!start.isValid()) {
            throw new InvalidDateRangeError(`Invalid start date: ${range.start}`, range);
        }
    } catch (error) {
        throw new InvalidDateRangeError(`Failed to parse start date: ${range.start}`, range);
    }

    try {
        end = TemporalWrapper.from(range.end, options.timezone);
        if (!end.isValid()) {
            throw new InvalidDateRangeError(`Invalid end date: ${range.end}`, range);
        }
    } catch (error) {
        throw new InvalidDateRangeError(`Failed to parse end date: ${range.end}`, range);
    }

    // Check if start is after end (invalid range)
    if (options.strictValidation && start.isAfter(end)) {
        throw new InvalidDateRangeError(
            `Invalid date range: start date (${start.format()}) is after end date (${end.format()})`,
            range
        );
    }

    return { start, end };
}

/**
 * Core function to detect overlap between two date ranges.
 * @param range1 - First date range
 * @param range2 - Second date range
 * @param options - Configuration options
 * @returns OverlapResult containing overlap status and overlapping range
 */
export function checkDateRangeOverlap(
    range1: DateRange,
    range2: DateRange,
    options: OverlapOptions = {}
): OverlapResult {
    // Set default options
    const opts: Required<OverlapOptions> = {
        includeBoundaries: options.includeBoundaries ?? true,
        timezone: options.timezone ?? TemporalUtils.defaultTimeZone,
        strictValidation: options.strictValidation ?? true
    };

    // Check cache first for performance
    const cachedResult = OverlapCache.getOverlapResult(range1, range2, opts);
    if (cachedResult !== null) {
        return cachedResult;
    }

    try {
        // Validate both date ranges
        const { start: start1, end: end1 } = validateDateRange(range1, opts);
        const { start: start2, end: end2 } = validateDateRange(range2, opts);

        // Calculate overlap using efficient comparison logic
        let overlaps: boolean;
        let overlapStart: TemporalWrapper | null = null;
        let overlapEnd: TemporalWrapper | null = null;

        if (opts.includeBoundaries) {
            // Ranges overlap if: start1 <= end2 AND start2 <= end1
            overlaps = start1.isSameOrBefore(end2) && start2.isSameOrBefore(end1);
        } else {
            // Ranges overlap if: start1 < end2 AND start2 < end1 (strict overlap, no touching)
            overlaps = start1.isBefore(end2) && start2.isBefore(end1);
        }

        let overlapRange: DateRange | null = null;

        if (overlaps) {
            // Calculate the overlapping period
            // Overlap start is the later of the two start dates
            overlapStart = start1.isAfter(start2) ? start1 : start2;
            // Overlap end is the earlier of the two end dates
            overlapEnd = end1.isBefore(end2) ? end1 : end2;

            // Double-check that we have a valid overlap range
            if (opts.includeBoundaries ? overlapStart.isSameOrBefore(overlapEnd) : overlapStart.isBefore(overlapEnd)) {
                overlapRange = {
                    start: overlapStart.toDate(),
                    end: overlapEnd.toDate()
                };
            } else {
                // Edge case: ranges touch but don't overlap when boundaries are excluded
                overlaps = false;
            }
        }

        const result: OverlapResult = {
            overlaps,
            overlapRange
        };

        // Cache the result for future use
        OverlapCache.setOverlapResult(range1, range2, opts, result);

        return result;
    } catch (error) {
        if (error instanceof InvalidDateRangeError) {
            throw error;
        }
        throw new OverlapDetectionError(
            `Failed to detect overlap: ${error instanceof Error ? error.message : String(error)}`,
            [range1, range2]
        );
    }
}

// Augment the TemporalWrapper interface to include the new instance method
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Checks if this date range overlaps with another date range.
         * This method treats the current instance as a single-point range (start === end).
         * @param range - The date range to compare with
         * @param options - Configuration options for overlap detection
         * @returns OverlapResult containing overlap status and overlapping range
         * @example
         * const date = atemporal('2024-01-15');
         * const range = { start: '2024-01-10', end: '2024-01-20' };
         * const result = date.rangeOverlapsWith(range);
         * // Returns: { overlaps: true, overlapRange: { start: '2024-01-15', end: '2024-01-15' } }
         */
        rangeOverlapsWith(range: DateRange, options?: OverlapOptions): OverlapResult;

        /**
         * Creates a date range from this instance to another date.
         * @param endDate - The end date of the range
         * @returns DateRange object
         * @example
         * const start = atemporal('2024-01-01');
         * const range = start.to('2024-01-15');
         * // Returns: { start: Date('2024-01-01'), end: Date('2024-01-15') }
         */
        to(endDate: DateInput): DateRange;
    }
}

/**
 * The dateRangeOverlap plugin following atemporal's plugin architecture.
 */
const dateRangeOverlapPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    // Add static method to the atemporal factory
    atemporal.checkDateRangeOverlap = checkDateRangeOverlap;

    // Add instance methods to the TemporalWrapper prototype
    Atemporal.prototype.rangeOverlapsWith = function(
        this: TemporalWrapper,
        range: DateRange,
        options: OverlapOptions = {}
    ): OverlapResult {
        if (!this.isValid()) {
            throw new InvalidDateRangeError('Cannot check overlap with invalid date instance');
        }

        // Create a single-point range from the current instance
        const currentRange: DateRange = {
            start: this.toDate(),
            end: this.toDate()
        };

        return checkDateRangeOverlap(currentRange, range, options);
    };

    Atemporal.prototype.to = function(
        this: TemporalWrapper,
        endDate: DateInput
    ): DateRange {
        if (!this.isValid()) {
            throw new InvalidDateRangeError('Cannot create range from invalid date instance');
        }

        return {
            start: this.toDate(),
            end: endDate
        };
    };
};

export default dateRangeOverlapPlugin;

// Export additional utilities for advanced use cases
export {
    OverlapCache,
    validateDateRange
};