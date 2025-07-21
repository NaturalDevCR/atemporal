/**
 * @file This plugin extends the TemporalWrapper class with relative time formatting,
 * allowing for human-readable strings like "5 minutes ago" or "in 2 hours".
 * It leverages the native `Intl` APIs for robust localization.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { IntlCache } from '../TemporalUtils'; // Importar el cache
import type { AtemporalFactory, Plugin, TimeUnit } from '../types';

// Augment the TemporalWrapper interface to include the new methods.
// This provides full type safety and autocompletion for consumers of the plugin.
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Calculates the relative time from the instance to now.
         * @param withoutSuffix - If true, removes the "ago" or "in" prefix/suffix.
         * @example
         * atemporal().subtract(5, 'minutes').fromNow(); // "5 minutes ago"
         * atemporal().add(2, 'hours').fromNow(); // "in 2 hours"
         */
        fromNow(withoutSuffix?: boolean): string;

        /**
         * Calculates the relative time from now to the instance.
         * This is the inverse of `fromNow`.
         * @param withoutSuffix - If true, removes the "ago" or "in" prefix/suffix.
         * @example
         * atemporal().subtract(5, 'minutes').toNow(); // "in 5 minutes"
         * atemporal().add(2, 'hours').toNow(); // "2 hours ago"
         */
        toNow(withoutSuffix?: boolean): string;
    }
}

/**
 * A robust helper function to calculate relative time.
 * This version uses a threshold-based logic (similar to Day.js/Moment.js) to select
 * the most appropriate human-readable unit.
 *
 * @param instance - The atemporal instance to format.
 * @param comparisonDate - The date to compare against (typically "now").
 * @param withoutSuffix - Whether to strip the "ago"/"in" suffix.
 * @param locale - The locale to use for formatting.
 * @returns The formatted relative time string.
 */
const getRelativeTime = (
    instance: TemporalWrapper,
    comparisonDate: TemporalWrapper,
    withoutSuffix: boolean,
    locale: string
): string => {
    if (!instance.isValid() || !comparisonDate.isValid()) {
        return 'Invalid Date';
    }

    // Thresholds for unit selection, to provide more natural language.
    const THRESHOLDS = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11,  // months to year
    };

    // Optimización: Calcular solo el diff en segundos primero
    const diffSeconds = instance.diff(comparisonDate, 'second', true);
    const absDiffSeconds = Math.abs(diffSeconds);

    let bestUnit: Intl.RelativeTimeFormatUnit;
    let bestDiff: number;

    // Optimización: Usar el diff en segundos para determinar la unidad
    // y solo calcular el diff específico cuando sea necesario
    if (absDiffSeconds < THRESHOLDS.s) {
        bestUnit = 'second';
        bestDiff = Math.round(diffSeconds);
    } else if (absDiffSeconds < THRESHOLDS.s * 60) { // < 45 minutos
        bestUnit = 'minute';
        bestDiff = Math.round(diffSeconds / 60);
    } else if (absDiffSeconds < THRESHOLDS.s * 60 * THRESHOLDS.h) { // < 22 horas
        bestUnit = 'hour';
        bestDiff = Math.round(diffSeconds / 3600);
    } else if (absDiffSeconds < THRESHOLDS.s * 60 * 24 * THRESHOLDS.d) { // < 26 días
        bestUnit = 'day';
        bestDiff = Math.round(diffSeconds / 86400);
    } else {
        // Para períodos más largos, usar los métodos específicos
        const diffMonths = instance.diff(comparisonDate, 'month', true);
        if (Math.abs(diffMonths) < THRESHOLDS.M) {
            bestUnit = 'month';
            bestDiff = Math.round(diffMonths);
        } else {
            const diffYears = instance.diff(comparisonDate, 'year', true);
            bestUnit = 'year';
            bestDiff = Math.round(diffYears);
        }
    }

    if (withoutSuffix) {
        // Use cached Intl.NumberFormat for better performance
        const nf = IntlCache.getNumberFormatter(locale, {
            style: 'unit',
            unit: bestUnit,
            unitDisplay: 'long',
        });
        return nf.format(Math.abs(bestDiff));
    }

    // Use cached Intl.RelativeTimeFormat for better performance
    const rtf = IntlCache.getRelativeTimeFormatter(locale, { numeric: 'auto' });
    return rtf.format(bestDiff, bestUnit);
};


const relativeTimePlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    Atemporal.prototype.fromNow = function (this: TemporalWrapper, withoutSuffix = false) {
        const now = atemporal();
        const locale = atemporal.getDefaultLocale();
        return getRelativeTime(this, now, withoutSuffix, locale);
    };

    Atemporal.prototype.toNow = function (this: TemporalWrapper, withoutSuffix = false) {
        const now = atemporal();
        const locale = atemporal.getDefaultLocale();
        return getRelativeTime(now, this, withoutSuffix, locale);
    };
};

export default relativeTimePlugin;