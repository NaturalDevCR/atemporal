/**
 * @file This plugin adds locale-aware week functionality. It allows for setting
 * the start of the week and provides methods that respect that setting.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils } from '../TemporalUtils';
import type { AtemporalFactory, Plugin } from '../types';

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

    // --- 3. Implement new weekday() method ---
    Atemporal.prototype.weekday = function (this: TemporalWrapper): number {
        if (!this.isValid()) return NaN;

        const weekStartsOn = TemporalUtils.getWeekStartsOn(); // 0=Sun, 1=Mon, ...
        // Temporal's dayOfWeek is 1=Mon, ..., 7=Sun. We convert it to 0=Sun, ..., 6=Sat.
        const isoDay = this.raw.dayOfWeek % 7;

        return (isoDay - weekStartsOn + 7) % 7;
    };

    // --- 4. Wrap startOf() method ---
    Atemporal.prototype.startOf = function (
        this: TemporalWrapper,
        unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'
    ): TemporalWrapper {
        if (!this.isValid()) return this;

        if (unit === 'week') {
            // Use our new .weekday() to find out how many days we are into the custom week.
            const daysToSubtract = this.weekday();
            // Subtract that many days and go to the start of that day.
            return this.subtract(daysToSubtract, 'days').startOf('day');
        }

        // For all other units, delegate to the original method.
        return originalStartOf.call(this, unit);
    };

    // --- 5. Wrap endOf() method ---
    Atemporal.prototype.endOf = function (
        this: TemporalWrapper,
        unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'
    ): TemporalWrapper {
        if (!this.isValid()) return this;

        if (unit === 'week') {
            // The logic is to find the start of the current week, add a week, and subtract a millisecond.
            // This correctly uses our newly wrapped `startOf` method.
            return this.startOf('week').add(1, 'week').subtract(1, 'millisecond');
        }

        // For all other units, delegate to the original method.
        return originalEndOf.call(this, unit);
    };
};

export default weekDayPlugin;