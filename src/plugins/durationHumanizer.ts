/**
 * @file This plugin adds a `humanize` static method to the atemporal factory,
 * allowing for the conversion of `Temporal.Duration` objects into human-readable,
 * localized strings (e.g., "2 hours and 30 minutes").
 * Optimized with intelligent caching systems and enhanced error handling for better performance.
 */

import { Temporal } from "@js-temporal/polyfill";
import { IntlCache, LRUCache, GlobalCacheCoordinator } from "../TemporalUtils";
import { LocaleUtils } from "../core/locale";
import type { Plugin, AtemporalFactory } from "../types";

/**
 * Cache for duration formatting results to improve performance.
 * @internal
 */
class DurationFormatCache {
  private static readonly MAX_SIZE = 200;
  private static cache = new LRUCache<string, string>(
    DurationFormatCache.MAX_SIZE
  );

  /**
   * Gets cached duration format or generates and caches new one.
   * @param value - Numeric value
   * @param unit - Duration unit
   * @param locale - Locale code
   * @param unitDisplay - Unit display style
   * @returns Formatted duration string
   */
  static getFormattedDuration(
    value: number,
    unit: string,
    locale: string,
    unitDisplay: string
  ): string {
    const cacheKey = `${value}:${unit}:${locale}:${unitDisplay}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = this.generateFormattedDuration(
      value,
      unit,
      locale,
      unitDisplay
    );
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generates formatted duration for given parameters.
   * @param value - Numeric value
   * @param unit - Duration unit
   * @param locale - Locale code
   * @param unitDisplay - Unit display style
   * @returns Generated formatted duration
   */
  private static generateFormattedDuration(
    value: number,
    unit: string,
    locale: string,
    unitDisplay: string
  ): string {
    try {
      // Use cached NumberFormat for better performance
      const nf = IntlCache.getNumberFormatter(locale, {
        style: "unit",
        unit: unit,
        unitDisplay: unitDisplay as any,
        useGrouping: false,
      });
      return nf.format(value);
    } catch (error) {
      // Enhanced error handling: log the error for debugging
      console.warn(
        `DurationFormatCache: Error formatting ${value} ${unit} with locale ${locale}:`,
        error
      );
      // Fallback for units not supported by Intl.NumberFormat
      return this.getFallbackFormat(value, unit, locale, unitDisplay);
    }
  }

  /**
   * Provides fallback formatting for unsupported units.
   * @param value - Numeric value
   * @param unit - Duration unit
   * @param locale - Locale code
   * @param unitDisplay - Unit display style
   * @returns Fallback formatted string
   */
  private static getFallbackFormat(
    value: number,
    unit: string,
    locale: string,
    unitDisplay: string
  ): string {
    try {
      // Get localized unit name
      const localizedUnit = getLocalizedUnit(
        unit,
        locale,
        unitDisplay as "long" | "short" | "narrow"
      );

      // Format the number without grouping
      const numberFormatter = IntlCache.getNumberFormatter(locale, {
        useGrouping: false,
      });
      const formattedNumber = numberFormatter.format(value);

      // Enhanced pluralization support for multiple languages
      const pluralRules = this.getPluralRules(locale);
      const isPlural = pluralRules
        ? pluralRules.select(value) !== "one"
        : value !== 1;
      const suffix = isPlural && locale.startsWith("en") ? "s" : "";
      return `${formattedNumber} ${localizedUnit}${suffix}`;
    } catch (error) {
      // Ultimate fallback
      const formattedValue =
        typeof value === "number" ? value.toString() : String(value);
      const suffix = value !== 1 ? "s" : "";
      return `${formattedValue} ${unit}${suffix}`;
    }
  }

  /**
   * Gets plural rules for a locale with caching.
   * @param locale - Locale code
   * @returns Intl.PluralRules instance or null if unsupported
   */
  private static getPluralRules(locale: string): Intl.PluralRules | null {
    try {
      return new Intl.PluralRules(locale);
    } catch {
      return null;
    }
  }

  /**
   * Clears the duration format cache.
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics.
   */
  static getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
    };
  }
}

// Register with global cache coordinator
GlobalCacheCoordinator.registerCache("durationHumanizer", {
  clear: () => DurationFormatCache.clear(),
  getStats: () => DurationFormatCache.getStats(),
});

/**
 * Enhanced unit mapping with multi-language support.
 * @internal
 */
const ENHANCED_UNIT_MAPPING: {
  [locale: string]: {
    [unit: string]: { long: string; short: string; narrow: string };
  };
} = {
  en: {
    year: { long: "year", short: "yr", narrow: "y" },
    month: { long: "month", short: "mo", narrow: "M" },
    week: { long: "week", short: "wk", narrow: "w" },
    day: { long: "day", short: "day", narrow: "d" },
    hour: { long: "hour", short: "hr", narrow: "h" },
    minute: { long: "minute", short: "min", narrow: "m" },
    second: { long: "second", short: "sec", narrow: "s" },
    millisecond: { long: "millisecond", short: "ms", narrow: "ms" },
  },
  es: {
    year: { long: "año", short: "a", narrow: "a" },
    month: { long: "mes", short: "m", narrow: "M" },
    week: { long: "semana", short: "sem", narrow: "s" },
    day: { long: "día", short: "d", narrow: "d" },
    hour: { long: "hora", short: "h", narrow: "h" },
    minute: { long: "minuto", short: "min", narrow: "m" },
    second: { long: "segundo", short: "seg", narrow: "s" },
    millisecond: { long: "milisegundo", short: "ms", narrow: "ms" },
  },
  fr: {
    year: { long: "année", short: "an", narrow: "a" },
    month: { long: "mois", short: "mois", narrow: "M" },
    week: { long: "semaine", short: "sem", narrow: "s" },
    day: { long: "jour", short: "j", narrow: "j" },
    hour: { long: "heure", short: "h", narrow: "h" },
    minute: { long: "minute", short: "min", narrow: "m" },
    second: { long: "seconde", short: "sec", narrow: "s" },
    millisecond: { long: "milliseconde", short: "ms", narrow: "ms" },
  },
  de: {
    year: { long: "Jahr", short: "J", narrow: "J" },
    month: { long: "Monat", short: "Mon", narrow: "M" },
    week: { long: "Woche", short: "Wo", narrow: "W" },
    day: { long: "Tag", short: "T", narrow: "T" },
    hour: { long: "Stunde", short: "Std", narrow: "h" },
    minute: { long: "Minute", short: "Min", narrow: "m" },
    second: { long: "Sekunde", short: "Sek", narrow: "s" },
    millisecond: { long: "Millisekunde", short: "ms", narrow: "ms" },
  },
  it: {
    year: { long: "anno", short: "a", narrow: "a" },
    month: { long: "mese", short: "m", narrow: "M" },
    week: { long: "settimana", short: "sett", narrow: "s" },
    day: { long: "giorno", short: "g", narrow: "g" },
    hour: { long: "ora", short: "h", narrow: "h" },
    minute: { long: "minuto", short: "min", narrow: "m" },
    second: { long: "secondo", short: "sec", narrow: "s" },
    millisecond: { long: "millisecondo", short: "ms", narrow: "ms" },
  },
  pt: {
    year: { long: "ano", short: "a", narrow: "a" },
    month: { long: "mês", short: "m", narrow: "M" },
    week: { long: "semana", short: "sem", narrow: "s" },
    day: { long: "dia", short: "d", narrow: "d" },
    hour: { long: "hora", short: "h", narrow: "h" },
    minute: { long: "minuto", short: "min", narrow: "m" },
    second: { long: "segundo", short: "seg", narrow: "s" },
    millisecond: { long: "milissegundo", short: "ms", narrow: "ms" },
  },
  ru: {
    year: { long: "год", short: "г", narrow: "г" },
    month: { long: "месяц", short: "мес", narrow: "М" },
    week: { long: "неделя", short: "нед", narrow: "н" },
    day: { long: "день", short: "д", narrow: "д" },
    hour: { long: "час", short: "ч", narrow: "ч" },
    minute: { long: "минута", short: "мин", narrow: "м" },
    second: { long: "секунда", short: "сек", narrow: "с" },
    millisecond: { long: "миллисекунда", short: "мс", narrow: "мс" },
  },
  ja: {
    year: { long: "年", short: "年", narrow: "年" },
    month: { long: "月", short: "月", narrow: "月" },
    week: { long: "週", short: "週", narrow: "週" },
    day: { long: "日", short: "日", narrow: "日" },
    hour: { long: "時間", short: "時間", narrow: "時" },
    minute: { long: "分", short: "分", narrow: "分" },
    second: { long: "秒", short: "秒", narrow: "秒" },
    millisecond: { long: "ミリ秒", short: "ms", narrow: "ms" },
  },
  ko: {
    year: { long: "년", short: "년", narrow: "년" },
    month: { long: "월", short: "월", narrow: "월" },
    week: { long: "주", short: "주", narrow: "주" },
    day: { long: "일", short: "일", narrow: "일" },
    hour: { long: "시간", short: "시간", narrow: "시" },
    minute: { long: "분", short: "분", narrow: "분" },
    second: { long: "초", short: "초", narrow: "초" },
    millisecond: { long: "밀리초", short: "ms", narrow: "ms" },
  },
  zh: {
    year: { long: "年", short: "年", narrow: "年" },
    month: { long: "月", short: "月", narrow: "月" },
    week: { long: "周", short: "周", narrow: "周" },
    day: { long: "天", short: "天", narrow: "天" },
    hour: { long: "小时", short: "小时", narrow: "时" },
    minute: { long: "分钟", short: "分钟", narrow: "分" },
    second: { long: "秒", short: "秒", narrow: "秒" },
    millisecond: { long: "毫秒", short: "ms", narrow: "ms" },
  },
};

/**
 * Defines the options for customizing the output of the `humanize` function.
 */
interface HumanizeOptions {
  /** The locale to use for formatting (e.g., 'en-US', 'es-CR'). Defaults to 'en'. */
  locale?: string;
  /** The style for formatting the list of duration parts, per `Intl.ListFormat`. */
  listStyle?: "long" | "short" | "narrow";
  /** The display style for the units, per `Intl.NumberFormat`. */
  unitDisplay?: "long" | "short" | "narrow";
}

/**
 * A list of `Temporal.Duration` units, intentionally ordered by magnitude.
 * This constant is kept local to the plugin because its primary purpose is to
 * define a specific visual order for humanization, which is a concern
 * exclusive to this plugin.
 */
const DURATION_UNITS_ORDERED: (keyof Temporal.DurationLike)[] = [
  "years",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
];

// Note: validateAndNormalizeLocale function has been moved to LocaleUtils in TemporalUtils
// for centralized locale handling across all plugins

/**
 * Gets the appropriate unit name for a given locale.
 * @param unit - Duration unit
 * @param locale - Locale code
 * @param unitDisplay - Unit display style
 * @returns Localized unit name or original unit
 * @internal
 */
function getLocalizedUnit(
  unit: string,
  locale: string,
  unitDisplay: "long" | "short" | "narrow" = "long"
): string {
  const baseLang = locale.split(/[-_]/)[0];
  const mapping = ENHANCED_UNIT_MAPPING[baseLang];

  if (mapping && mapping[unit]) {
    const unitMapping = mapping[unit];
    if (unitDisplay === "narrow" && unitMapping.narrow) {
      return unitMapping.narrow;
    } else if (unitDisplay === "short" && unitMapping.short) {
      return unitMapping.short;
    } else {
      return unitMapping.long || unit;
    }
  }

  return unit;
}

/**
 * Converts a `Temporal.Duration` or a duration-like object into a human-readable string.
 *
 * @param durationLike The duration object or a plain object like `{ hours: 2 }`.
 * @param options - Optional configuration for localization and formatting.
 * @returns A formatted, human-readable string representing the duration.
 * @example
 * atemporal.humanize({ years: 1, months: 6 }); // "1 year and 6 months"
 * atemporal.humanize({ minutes: 5 }, { locale: 'es' }); // "5 minutos"
 */
function humanize(
  durationLike: Temporal.Duration | Temporal.DurationLike,
  options: HumanizeOptions = {}
): string {
  // Enhanced validation: check for null, undefined, or invalid inputs
  if (
    !durationLike ||
    (!(durationLike instanceof Temporal.Duration) &&
      typeof durationLike === "object" &&
      Object.keys(durationLike).length === 0)
  ) {
    try {
      const { locale = "en", unitDisplay = "long" } = options;
      const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
      // Use cached NumberFormat for better performance
      const nf = IntlCache.getNumberFormatter(normalizedLocale, {
        style: "unit",
        unit: "second",
        unitDisplay,
      });
      return nf.format(0);
    } catch (e) {
      console.warn("DurationHumanizer: Error formatting zero duration:", e);
      return "0 seconds"; // Final fallback
    }
  }

  try {
    const duration = Temporal.Duration.from(durationLike);
    const { locale = "en", listStyle = "long", unitDisplay = "long" } = options;
    const normalizedLocale = LocaleUtils.validateAndNormalize(locale);

    const parts: string[] = [];

    for (const unit of DURATION_UNITS_ORDERED) {
      const value = duration[unit as keyof typeof duration];

      if (typeof value === "number" && value !== 0) {
        // `Intl.NumberFormat` requires the singular form of the unit.
        const singularUnit = unit.endsWith("s") ? unit.slice(0, -1) : unit;

        // Handle fractional values by rounding to avoid precision issues
        const roundedValue = Math.round(value * 100) / 100;

        // Use intelligent caching for better performance
        // DurationFormatCache handles its own error fallback mechanism
        const formattedPart = DurationFormatCache.getFormattedDuration(
          roundedValue,
          singularUnit,
          normalizedLocale,
          unitDisplay
        );
        parts.push(formattedPart);
      }
    }

    if (parts.length === 0) {
      // Handles cases like `{ seconds: 0 }` where the duration is valid but has no value.
      return "0 seconds";
    }

    try {
      // Use cached ListFormat for better performance
      const listFormatter = IntlCache.getListFormatter(normalizedLocale, {
        style: listStyle,
        type: "conjunction",
      });
      return listFormatter.format(parts);
    } catch (e) {
      console.warn("DurationHumanizer: Error formatting list:", e);
      // Simple fallback: join with 'and'
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
      return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
    }
  } catch (error) {
    console.warn("DurationHumanizer: Error processing duration:", error);
    return "0 seconds"; // Ultimate fallback
  }
}

/**
 * The plugin object that conforms to the `Plugin` type.
 * It extends the `atemporal` factory with the `humanize` static method.
 */
const durationHumanizer: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
  atemporal.humanize = humanize;

  // Expose cache management methods for testing and optimization
  if (atemporal) {
    (atemporal as any).clearDurationHumanizerCache = function () {
      DurationFormatCache.clear();
    };

    (atemporal as any).getDurationHumanizerCacheStats = function () {
      return {
        durationFormat: DurationFormatCache.getStats(),
      };
    };
  }
};

/**
 * Augments the `AtemporalFactory` interface via TypeScript's module declaration merging.
 * This makes the new `humanize` method visible and type-safe on the `atemporal` factory.
 */
declare module "../types" {
  interface AtemporalFactory {
    humanize(
      durationLike: Temporal.Duration | Temporal.DurationLike,
      options?: HumanizeOptions
    ): string;
    clearDurationHumanizerCache?(): void;
    getDurationHumanizerCacheStats?(): {
      durationFormat: { size: number; maxSize: number };
    };
  }
}

export default durationHumanizer;
