/**
 * @file This plugin adds locale-aware week functionality. It allows for setting
 * the start of the week and provides methods that respect that setting.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils, LRUCache, LocaleUtils, GlobalCacheCoordinator } from '../TemporalUtils';
import type { AtemporalFactory, Plugin } from '../types';

/**
 * Cache for week-related calculations to improve performance.
 * Stores weekday calculations and week start/end computations.
 */
class WeekCache {
    private static weekdayCache = new LRUCache<string, number>(100); // Cache for weekday calculations
    private static weekBoundaryCache = new LRUCache<string, string>(50); // Cache for week start/end calculations
    private static readonly MAX_WEEKDAY_SIZE = 100;
    private static readonly MAX_BOUNDARY_SIZE = 50;

    /**
     * Gets a cached weekday result or generates and caches a new one.
     * @param isoDay - The ISO day (1=Mon, 7=Sun)
     * @param weekStartsOn - The week start day (0=Sun, 1=Mon, etc.)
     * @returns Calculated weekday number
     */
    static getWeekday(isoDay: number, weekStartsOn: number): number | null {
        const key = `${isoDay}:${weekStartsOn}`;
        const result = this.weekdayCache.get(key);
        return result !== undefined ? result : null;
    }

    /**
     * Caches a weekday calculation result.
     * @param isoDay - The ISO day (1=Mon, 7=Sun)
     * @param weekStartsOn - The week start day (0=Sun, 1=Mon, etc.)
     * @param result - The calculated weekday
     */
    static setWeekday(isoDay: number, weekStartsOn: number, result: number): void {
        const key = `${isoDay}:${weekStartsOn}`;
        this.weekdayCache.set(key, result);
    }

    /**
     * Gets a cached week boundary result.
     * @param dateKey - Unique key for the date and operation
     * @returns Cached result string
     */
    static getWeekBoundary(dateKey: string): string | null {
        const result = this.weekBoundaryCache.get(dateKey);
        return result !== undefined ? result : null;
    }

    /**
     * Caches a week boundary calculation result.
     * @param dateKey - Unique key for the date and operation
     * @param result - The calculated boundary date string
     */
    static setWeekBoundary(dateKey: string, result: string): void {
        this.weekBoundaryCache.set(dateKey, result);
    }

    /**
     * Clears all week-related caches.
     */
    static clear(): void {
        this.weekdayCache.clear();
        this.weekBoundaryCache.clear();
    }

    /**
     * Gets cache statistics for all week caches.
     * @returns Object with cache sizes and max sizes
     */
    static getStats(): { 
        weekday: { size: number; maxSize: number };
        weekBoundary: { size: number; maxSize: number };
    } {
        return {
            weekday: {
                size: this.weekdayCache.size,
                maxSize: this.MAX_WEEKDAY_SIZE
            },
            weekBoundary: {
                size: this.weekBoundaryCache.size,
                maxSize: this.MAX_BOUNDARY_SIZE
            }
        };
    }
}

// Register with global cache coordinator
GlobalCacheCoordinator.registerCache('weekDay', {
    clear: () => WeekCache.clear(),
    getStats: () => WeekCache.getStats()
});

// Augment the interfaces to document the new functionality
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Returns a new instance set to the start of the week, respecting the
         * locale's configured start day (set via `atemporal.setWeekStartsOn`).
         */
        startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;

        /**
         * Returns a new instance set to the end of the week, respecting the
         * locale's configured start day.
         */
        endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;

        /**
         * Gets the day of the week according to the locale's configured start day.
         * (e.g., 0 for Sunday, 1 for Monday, ..., if week starts on Sunday).
         */
        weekday(): number;
    }
}

declare module '../types' {
    interface AtemporalFactory {
        /**
         * Sets the global start of the week for all atemporal instances.
         * @param day - The day to set as the start of the week (0 for Sunday, 1 for Monday, etc.).
         */
        setWeekStartsOn(day: 0 | 1 | 2 | 3 | 4 | 5 | 6): void;
    }
}

const weekDayPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    // --- 1. Expose the static configuration method ---
    atemporal.setWeekStartsOn = TemporalUtils.setWeekStartsOn;

    // --- 2. Save original methods ---
    const originalStartOf = Atemporal.prototype.startOf;
    const originalEndOf = Atemporal.prototype.endOf;

    // --- 3. Implement optimized weekday() method with caching ---
    Atemporal.prototype.weekday = function (this: TemporalWrapper): number {
        if (!this.isValid()) return NaN;

        try {
            const weekStartsOn = TemporalUtils.getWeekStartsOn(); // 0=Sun, 1=Mon, ...
            // Temporal's dayOfWeek is 1=Mon, ..., 7=Sun. We convert it to 0=Sun, ..., 6=Sat.
            const isoDay = this.raw.dayOfWeek % 7;

            // Check cache first for performance
            const cachedResult = WeekCache.getWeekday(isoDay, weekStartsOn);
            if (cachedResult !== null) {
                return cachedResult;
            }

            // Calculate and cache the result
            const result = (isoDay - weekStartsOn + 7) % 7;
            WeekCache.setWeekday(isoDay, weekStartsOn, result);
            
            return result;
        } catch (error) {
            console.warn('WeekDay: Error calculating weekday:', error);
            return NaN;
        }
    };

    // --- 4. Wrap startOf() method with caching ---
    Atemporal.prototype.startOf = function (
        this: TemporalWrapper,
        unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'
    ): TemporalWrapper {
        if (!this.isValid()) return this;

        if (unit === 'week') {
            try {
                const weekStartsOn = TemporalUtils.getWeekStartsOn();
                const dateKey = `startOf:${this.raw.toString()}:${weekStartsOn}`;
                
                // Check cache first for performance
                const cachedResult = WeekCache.getWeekBoundary(dateKey);
                if (cachedResult !== null) {
                    return atemporal(cachedResult);
                }

                // Use our optimized .weekday() to find out how many days we are into the custom week.
                const daysToSubtract = this.weekday();
                // Subtract that many days and go to the start of that day.
                const result = this.subtract(daysToSubtract, 'days').startOf('day');
                
                // Cache the result
                WeekCache.setWeekBoundary(dateKey, result.raw.toString());
                
                return result;
            } catch (error) {
                console.warn('WeekDay: Error calculating week start:', error);
                // Fallback to original calculation without caching
                const daysToSubtract = this.weekday();
                return this.subtract(daysToSubtract, 'days').startOf('day');
            }
        }

        // For all other units, delegate to the original method.
        return originalStartOf.call(this, unit);
    };

    // --- 5. Wrap endOf() method with caching ---
    Atemporal.prototype.endOf = function (
        this: TemporalWrapper,
        unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'
    ): TemporalWrapper {
        if (!this.isValid()) return this;

        if (unit === 'week') {
            try {
                const weekStartsOn = TemporalUtils.getWeekStartsOn();
                const dateKey = `endOf:${this.raw.toString()}:${weekStartsOn}`;
                
                // Check cache first for performance
                const cachedResult = WeekCache.getWeekBoundary(dateKey);
                if (cachedResult !== null) {
                    return atemporal(cachedResult);
                }

                // The logic is to find the start of the current week, add a week, and subtract a millisecond.
                // This correctly uses our newly wrapped `startOf` method.
                const result = this.startOf('week').add(1, 'week').subtract(1, 'millisecond');
                
                // Cache the result
                WeekCache.setWeekBoundary(dateKey, result.raw.toString());
                
                return result;
            } catch (error) {
                console.warn('WeekDay: Error calculating week end:', error);
                // Fallback to original calculation without caching
                return this.startOf('week').add(1, 'week').subtract(1, 'millisecond');
            }
        }

        // For all other units, delegate to the original method.
        return originalEndOf.call(this, unit);
    };
    
    // Expose cache management methods for testing and optimization
    if (atemporal) {
        (atemporal as any).clearWeekDayCache = function() {
            WeekCache.clear();
        };
        
        (atemporal as any).getWeekDayCacheStats = function() {
            return {
                weekDay: WeekCache.getStats()
            };
        };
    }
};

/**
 * Augments the `AtemporalFactory` interface via TypeScript's module declaration merging.
 * This makes the cache management methods visible and type-safe on the `atemporal` factory.
 */
declare module '../types' {
    interface AtemporalFactory {
        clearWeekDayCache?(): void;
        getWeekDayCacheStats?(): { 
            weekDay: { 
                weekday: { size: number; maxSize: number };
                weekBoundary: { size: number; maxSize: number };
            }
        };
    }
}

export default weekDayPlugin;