/**
 * @file Date Range Overlap Detection Plugin
 * This plugin extends the atemporal library with date range overlap detection capabilities.
 * It provides methods to check if two date ranges intersect and retrieve the overlapping period.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils, LRUCache, GlobalCacheCoordinator } from '../TemporalUtils';
import type { AtemporalFactory, Plugin, DateRange, OverlapResult, OverlapOptions, DateInput } from '../types';
import { markAsPlugin } from '../typeGuards';

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
    private static readonly MAX_SIZE = 200;
    private static cache = new LRUCache<string, { overlaps: boolean; bounds: [number, number] | null }>(this.MAX_SIZE);

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
        const instants = [range1.start, range1.end, range2.start, range2.end].map((value) => {
            const date = value instanceof TemporalWrapper ? value.raw : TemporalUtils.from(value, options.timezone);
            return date.epochNanoseconds.toString();
        });
        return JSON.stringify([instants, options.includeBoundaries, options.strictValidation]);
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
        if (!result) return null;

        const { overlaps, bounds } = result;
        const overlapRange = bounds ? { start: new Date(bounds[0]), end: new Date(bounds[1]) } : null;
        return { overlaps, overlapRange };
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
        const { overlaps, overlapRange } = result;
        const epochMilliseconds = (value: DateInput) => value instanceof Date
            ? value.getTime()
            : TemporalUtils.from(value, options.timezone).epochMilliseconds;
        const bounds: [number, number] | null = overlapRange ? [
            epochMilliseconds(overlapRange.start),
            epochMilliseconds(overlapRange.end),
        ] : null;
        this.cache.set(key, { overlaps, bounds });
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
    if (options.strictValidation && start.raw.epochNanoseconds > end.raw.epochNanoseconds) {
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

    try {
        // Validate both date ranges
        const normalized1 = validateDateRange(range1, opts);
        const normalized2 = validateDateRange(range2, opts);
        const cachedResult = OverlapCache.getOverlapResult(normalized1, normalized2, opts);
        if (cachedResult !== null) return cachedResult;

        const { start: start1, end: end1 } = normalized1;
        const { start: start2, end: end2 } = normalized2;

        const overlapStart = start1.raw.epochNanoseconds > start2.raw.epochNanoseconds ? start1 : start2;
        const overlapEnd = end1.raw.epochNanoseconds < end2.raw.epochNanoseconds ? end1 : end2;
        const start = overlapStart.raw.epochNanoseconds;
        const end = overlapEnd.raw.epochNanoseconds;
        const overlaps = start < end || (opts.includeBoundaries && start === end);
        const overlapRange = overlaps ? { start: overlapStart.toDate(), end: overlapEnd.toDate() } : null;
        const result: OverlapResult = { overlaps, overlapRange };

        // Cache the result for future use
        OverlapCache.setOverlapResult(normalized1, normalized2, opts, result);

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
            start: this,
            end: this
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

export default markAsPlugin(dateRangeOverlapPlugin, {
    name: 'dateRangeOverlap',
    official: true,
});

// Export additional utilities for advanced use cases
export {
    OverlapCache,
    validateDateRange
};
