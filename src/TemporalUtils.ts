/**
 * @file This file provides a collection of low-level, static utility functions
 * for creating and manipulating Temporal objects. It serves as the internal
 * engine for the atemporal library, handling parsing, formatting, and comparisons.
 */

import { Temporal } from '@js-temporal/polyfill';
import { RegexCache } from './RegexCache';
import type { DateInput, TimeUnit, PlainDateTimeObject } from './types';
import { InvalidTimeZoneError, InvalidDateError } from './errors';

// Variable to hold the start of the week setting. Default to 1 (Monday) for ISO 8601 compliance.
let weekStart = 1;

export class TemporalUtils {
    // Private static properties to hold the global default settings.
    private static _defaultTimeZone = 'UTC';
    private static _defaultLocale = 'en-US';

    /**
     * Sets the default locale for all new atemporal instances. Used for formatting.
     */
    static setDefaultLocale(code: string) {
        TemporalUtils._defaultLocale = code;
    }

    /**
     * Gets the currently configured default locale.
     */
    static getDefaultLocale(): string {
        return TemporalUtils._defaultLocale;
    }

    /**
     * Sets the default IANA time zone for all new atemporal instances.
     * It validates the time zone identifier before setting it.
     */
    static setDefaultTimeZone(tz: string) {
        try {
            // Validate the time zone by attempting to use it in a formatter.
            // This is the standard way to check if a time zone is supported.
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            TemporalUtils._defaultTimeZone = tz;
        } catch (e) {
            throw new InvalidTimeZoneError(`Invalid time zone: ${tz}`);
        }
    }

    /**
     * Gets the currently configured default time zone.
     */
    static get defaultTimeZone() {
        return TemporalUtils._defaultTimeZone;
    }

    /**
     * The core parsing engine, optimized for performance with fast paths for common inputs.
     * Each input type is handled in a self-contained block that returns directly.
     * The order of checks has been optimized based on frequency of use.
     */
    static from(input?: DateInput, timeZone?: string): Temporal.ZonedDateTime {
        const tz = timeZone || TemporalUtils.defaultTimeZone;

        // FAST PATH 1: undefined/null (current time) - very common in real-world usage
        if (input === undefined || input === null) {
            return Temporal.Now.zonedDateTimeISO(tz);
        }

        // FAST PATH 2: ZonedDateTime - direct pass-through for the most efficient case
        if (input instanceof Temporal.ZonedDateTime) {
            return timeZone && input.timeZoneId !== timeZone ? input.withTimeZone(timeZone) : input;
        }

        // FAST PATH 3: String - most common input format from user interfaces
        if (typeof input === 'string') {
            // Optimization: Quick check for ISO format with Z (UTC) which is very common
            if (input.endsWith('Z') && RegexCache.getPrecompiled('isoUtcRegex')!.test(input)) {
                try {
                    const instant = Temporal.Instant.from(input);
                    return instant.toZonedDateTimeISO(tz);
                } catch (e) {
                    throw new InvalidDateError(`Invalid date string: ${input}`);
                }
            }
            
            try {
                // Try parsing as an Instant first (handles ISO strings with timezone info)
                const instant = Temporal.Instant.from(input);

                // Detect explicit offset in the string
                const offsetMatch = input.match(/([+-]\d{2}:\d{2})/);
                const hasOffset = offsetMatch !== null;

                if (hasOffset && !timeZone) {
                    const offset = offsetMatch![1];
                    return instant.toZonedDateTimeISO(offset);
                }

                return instant.toZonedDateTimeISO(tz);
            } catch (e) {
                try {
                    // If it's not an Instant, try as a PlainDateTime
                    const pdt = Temporal.PlainDateTime.from(input);
                    return pdt.toZonedDateTime(tz);
                } catch (e2) {
                    throw new InvalidDateError(`Invalid date string: ${input}`);
                }
            }
        }

        // FAST PATH 4: JavaScript Date - common when integrating with other libraries
        if (input instanceof Date) {
            return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(tz);
        }

        // FAST PATH 5: Number (epoch milliseconds) - common in APIs
        if (typeof input === 'number') {
            return Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO(tz);
        }

        // Handle TemporalWrapper objects
        if (typeof input === 'object' && 'raw' in input && (input as any).raw instanceof Temporal.ZonedDateTime) {
            const raw = (input as any).raw as Temporal.ZonedDateTime;
            return timeZone && raw.timeZoneId !== timeZone ? raw.withTimeZone(timeZone) : raw;
        }

        // Handle Temporal.PlainDateTime
        if (input instanceof Temporal.PlainDateTime) {
            return input.toZonedDateTime(tz);
        }

        // Handle Array inputs: [YYYY, MM, DD, hh, mm, ss]
        if (Array.isArray(input)) {
            const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = input;
            try {
                const pdt = Temporal.PlainDateTime.from({ year, month, day, hour, minute, second, millisecond }, { overflow: 'reject' });
                return pdt.toZonedDateTime(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid date array: [${input.join(', ')}]`);
            }
        }

        // Handle Object inputs with year property: { year: YYYY, month: MM, ... }
        if (typeof input === 'object' && 'year' in input) {
            try {
                const pdt = Temporal.PlainDateTime.from(input as PlainDateTimeObject, { overflow: 'reject' });
                return pdt.toZonedDateTime(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid date object: ${JSON.stringify(input)}`);
            }
        }

        // Handle Firebase Timestamp instances or compatible objects
        if (
            typeof input === 'object' &&
            input !== null &&
            'seconds' in input &&
            'nanoseconds' in input
        ) {
            // First try with toDate method if available
            if (typeof (input as any).toDate === 'function') {
                try {
                    const jsDate = (input as any).toDate();
                    return Temporal.Instant.fromEpochMilliseconds(jsDate.getTime()).toZonedDateTimeISO(tz);
                } catch (e) {
                    throw new InvalidDateError(`Invalid Firebase Timestamp object: ${JSON.stringify(input)}`);
                }
            }
            
            // Otherwise use seconds and nanoseconds directly
            try {
                const { seconds, nanoseconds } = input as { seconds: number; nanoseconds: number };
                const totalNanoseconds = BigInt(seconds) * 1_000_000_000n + BigInt(nanoseconds);
                const instant = Temporal.Instant.fromEpochNanoseconds(totalNanoseconds);
                return instant.toZonedDateTimeISO(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid date object: ${JSON.stringify(input)}`);
            }
        }

        // If the input type is none of the above, it's unsupported
        throw new InvalidDateError(`Unsupported date input type: ${typeof input}`);
    }

    /**
     * Converts a Temporal.ZonedDateTime object back to a legacy JavaScript Date.
     */
    static toDate(temporal: Temporal.ZonedDateTime): Date {
        return new Date(temporal.epochMilliseconds);
    }

    /**
     * Sets the global start of the week.
     * @param day - The day to set as the start of the week (0 for Sunday, 1 for Monday, etc.).
     */
    static setWeekStartsOn(day: 0 | 1 | 2 | 3 | 4 | 5 | 6): void {
        if (day >= 0 && day <= 6) {
            weekStart = day;
        }
    }

    /**
     * Gets the currently configured start of the week.
     * @returns The start of the week (0 for Sunday, 1 for Monday, etc.).
     */
    static getWeekStartsOn(): number {
        return weekStart;
    }

    /**
     * Calculates the difference between two dates in a specified unit.
     */
    static diff(a: DateInput, b: DateInput, unit: TimeUnit = 'millisecond'): number {
        const d1 = TemporalUtils.from(a);
        const d2 = TemporalUtils.from(b);

        // Use the DiffCache to get or calculate the result
        return DiffCache.getDiffResult(d1, d2, unit);
    }

    /**
     * Checks if date `a` is before date `b`.
     */
    static isBefore(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === -1;
    }

    /**
     * Checks if date `a` is after date `b`.
     */
    static isAfter(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === 1;
    }

    /**
     * Checks if date `a` is the same as or before date `b`.
     */
    static isSameOrBefore(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) <= 0;
    }

    /**
     * Checks if date `a` is the same as or after date `b`.
     */
    static isSameOrAfter(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) >= 0;
    }

    /**
     * Checks if date `a` is on the same calendar day as date `b`, ignoring time and timezone.
     */
    static isSameDay(a: DateInput, b: DateInput): boolean {
        return TemporalUtils.from(a).toPlainDate().equals(TemporalUtils.from(b).toPlainDate());
    }
}


/**
 * A Least Recently Used (LRU) cache implementation to limit memory usage.
 * @internal
 */
export class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;
    
    // Métricas para el ajuste dinámico
    private hits = 0;
    private misses = 0;
    private lastResize = Date.now();
    private resizeInterval = 60000; // 1 minuto por defecto
    
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }
    
    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value) {
            // Actualizar posición (LRU)
            this.cache.delete(key);
            this.cache.set(key, value);
            this.hits++;
        } else {
            this.misses++;
        }
        return value;
    }
    
    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Eliminar el elemento menos usado recientemente
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, value);
    }
    
    has(key: K): boolean {
        return this.cache.has(key);
    }
    
    clear(): void {
        this.cache.clear();
        // Reiniciar métricas al limpiar
        this.hits = 0;
        this.misses = 0;
    }
    
    get size(): number {
        return this.cache.size;
    }
    
    /**
     * Obtiene las métricas de uso del caché
     */
    getMetrics() {
        return {
            hits: this.hits,
            misses: this.misses,
            hitRatio: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
            size: this.size,
            maxSize: this.maxSize,
            utilization: this.size / this.maxSize
        };
    }
    
    /**
     * Ajusta el tamaño máximo del caché
     */
    setMaxSize(newSize: number): void {
        if (newSize < 1) throw new Error('Cache size must be at least 1');
        
        // Si el nuevo tamaño es menor que el actual, eliminar elementos hasta ajustar
        while (this.cache.size > newSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            } else {
                break; // Protección contra casos inesperados
            }
        }
        
        this.maxSize = newSize;
    }
    
    /**
     * Configura el intervalo de tiempo para el ajuste automático
     */
    setResizeInterval(milliseconds: number): void {
        // Permitir intervalos más cortos en entorno de prueba
        if (milliseconds < 1000 && process.env.NODE_ENV !== 'test') {
            throw new Error('Resize interval must be at least 1000ms');
        }
        this.resizeInterval = milliseconds;
    }
    
    /**
     * Verifica si es momento de ajustar el tamaño del caché
     */
    shouldResize(): boolean {
        return Date.now() - this.lastResize >= this.resizeInterval;
    }
    
    /**
     * Marca el tiempo del último ajuste
     */
    markResized(): void {
        this.lastResize = Date.now();
    }
}

/**
 * Cache for Intl objects to improve performance by avoiding repeated instantiation.
 * @internal
 */
class IntlCache {
    // Inicialización perezosa con límite de tamaño
    private static _dateTimeFormatters: LRUCache<string, Intl.DateTimeFormat> | null = null;
    private static _relativeTimeFormatters: LRUCache<string, Intl.RelativeTimeFormat> | null = null;
    private static _numberFormatters: LRUCache<string, Intl.NumberFormat> | null = null;
    private static _listFormatters: LRUCache<string, Intl.ListFormat> | null = null;
    
    // Tamaño máximo configurable para cada cache
    private static readonly MAX_CACHE_SIZE = 50;

    // Habilitar/deshabilitar el ajuste dinámico
    private static _dynamicSizing = true;
    
    private static get dateTimeFormatters(): LRUCache<string, Intl.DateTimeFormat> {
        if (!this._dateTimeFormatters) {
            this._dateTimeFormatters = new LRUCache<string, Intl.DateTimeFormat>(this.MAX_CACHE_SIZE);
        }
        return this._dateTimeFormatters;
    }
    
    private static get relativeTimeFormatters(): LRUCache<string, Intl.RelativeTimeFormat> {
        if (!this._relativeTimeFormatters) {
            this._relativeTimeFormatters = new LRUCache<string, Intl.RelativeTimeFormat>(this.MAX_CACHE_SIZE);
        }
        return this._relativeTimeFormatters;
    }
    
    private static get numberFormatters(): LRUCache<string, Intl.NumberFormat> {
        if (!this._numberFormatters) {
            this._numberFormatters = new LRUCache<string, Intl.NumberFormat>(this.MAX_CACHE_SIZE);
        }
        return this._numberFormatters;
    }
    
    private static get listFormatters(): LRUCache<string, Intl.ListFormat> {
        if (!this._listFormatters) {
            this._listFormatters = new LRUCache<string, Intl.ListFormat>(this.MAX_CACHE_SIZE);
        }
        return this._listFormatters;
    }

    /**
     * Verifica y ajusta el tamaño de los cachés si es necesario
     */
    static checkAndResizeCaches(): void {
        if (!this._dynamicSizing) return;
        
        // Verificar cada caché
        this.checkAndResizeCache(this._dateTimeFormatters);
        this.checkAndResizeCache(this._relativeTimeFormatters);
        this.checkAndResizeCache(this._numberFormatters);
        this.checkAndResizeCache(this._listFormatters);
    }

    /**
     * Verifica y ajusta el tamaño de un caché específico
     */
    private static checkAndResizeCache<K, V>(cache: LRUCache<K, V> | null): void {
        if (!cache || !cache.shouldResize()) return;
        
        const metrics = cache.getMetrics();
        const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, cache.getMetrics().maxSize);
        
        if (optimalSize !== metrics.maxSize) {
            cache.setMaxSize(optimalSize);
            cache.markResized();
        }
    }

    /**
     * Habilita o deshabilita el ajuste dinámico de tamaño
     */
    static setDynamicSizing(enabled: boolean): void {
        this._dynamicSizing = enabled;
    }
    
    /**
     * Obtiene el estado actual del ajuste dinámico
     */
    static isDynamicSizingEnabled(): boolean {
        return this._dynamicSizing;
    }

    /**
     * Gets detailed cache statistics for monitoring.
     */
    static getDetailedStats() {
        return {
            dateTimeFormatters: this._dateTimeFormatters ? this._dateTimeFormatters.getMetrics() : null,
            relativeTimeFormatters: this._relativeTimeFormatters ? this._relativeTimeFormatters.getMetrics() : null,
            numberFormatters: this._numberFormatters ? this._numberFormatters.getMetrics() : null,
            listFormatters: this._listFormatters ? this._listFormatters.getMetrics() : null,
            diffCache: DiffCache.getDetailedStats(),
            dynamicSizingEnabled: this._dynamicSizing
        };
    }

    /**
     * Gets a cached DateTimeFormat instance or creates a new one.
     */
    static getDateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        let formatter = this.dateTimeFormatters.get(key);
        
        // Verificar si es momento de ajustar el tamaño
        this.checkAndResizeCaches();
        
        if (!formatter) {
            formatter = new Intl.DateTimeFormat(locale, options);
            this.dateTimeFormatters.set(key, formatter);
        }
        return formatter;
    }

    /**
     * Gets a cached RelativeTimeFormat instance or creates a new one.
     */
    static getRelativeTimeFormatter(locale: string, options: Intl.RelativeTimeFormatOptions = {}): Intl.RelativeTimeFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        let formatter = this.relativeTimeFormatters.get(key);
        
        // Verificar si es momento de ajustar el tamaño
        this.checkAndResizeCaches();
        
        if (!formatter) {
            formatter = new Intl.RelativeTimeFormat(locale, options);
            this.relativeTimeFormatters.set(key, formatter);
        }
        return formatter;
    }

    /**
     * Gets a cached NumberFormat instance or creates a new one.
     */
    static getNumberFormatter(locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        let formatter = this.numberFormatters.get(key);
        
        // Verificar si es momento de ajustar el tamaño
        this.checkAndResizeCaches();
        
        if (!formatter) {
            formatter = new Intl.NumberFormat(locale, options);
            this.numberFormatters.set(key, formatter);
        }
        return formatter;
    }

    /**
     * Gets a cached ListFormat instance or creates a new one.
     */
    static getListFormatter(locale: string, options: Intl.ListFormatOptions = {}): Intl.ListFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        let formatter = this.listFormatters.get(key);
        
        // Verificar si es momento de ajustar el tamaño
        this.checkAndResizeCaches();
        
        if (!formatter) {
            formatter = new Intl.ListFormat(locale, options);
            this.listFormatters.set(key, formatter);
        }
        return formatter;
    }

    /**
     * Clears all caches. Useful for testing or memory management.
     */
    static clearAll(): void {
        if (this._dateTimeFormatters) this._dateTimeFormatters.clear();
        if (this._relativeTimeFormatters) this._relativeTimeFormatters.clear();
        if (this._numberFormatters) this._numberFormatters.clear();
        if (this._listFormatters) this._listFormatters.clear();
        DiffCache.clear(); // Clear the diff cache as well
    }

    /**
     * Gets cache statistics for monitoring.
     */
    static getStats() {
        const dtfSize = this._dateTimeFormatters ? this._dateTimeFormatters.size : 0;
        const rtfSize = this._relativeTimeFormatters ? this._relativeTimeFormatters.size : 0;
        const nfSize = this._numberFormatters ? this._numberFormatters.size : 0;
        const lfSize = this._listFormatters ? this._listFormatters.size : 0;
        const diffSize = DiffCache.getStats().diffCache;
        
        return {
            dateTimeFormatters: dtfSize,
            relativeTimeFormatters: rtfSize,
            numberFormatters: nfSize,
            listFormatters: lfSize,
            diffCache: diffSize,
            total: dtfSize + rtfSize + nfSize + lfSize + diffSize,
            maxSize: this.MAX_CACHE_SIZE * 4 + DiffCache.getStats().maxSize // Total maximum possible size
        };
    }
    
    /**
     * Configura el tamaño máximo para todos los caches.
     * @param size Nuevo tamaño máximo para cada cache
     */
    static setMaxCacheSize(size: number): void {
        if (size < 1) throw new Error('Cache size must be at least 1');
        
        // Crear nuevos caches con el tamaño actualizado
        this._dateTimeFormatters = new LRUCache<string, Intl.DateTimeFormat>(size);
        this._relativeTimeFormatters = new LRUCache<string, Intl.RelativeTimeFormat>(size);
        this._numberFormatters = new LRUCache<string, Intl.NumberFormat>(size);
        this._listFormatters = new LRUCache<string, Intl.ListFormat>(size);
    }
}

/**
 * Cache for diff calculations to improve performance by avoiding repeated calculations.
 * @internal
 */
class DiffCache {
    // Lazy initialization with size limit
    private static _diffCache: LRUCache<string, number> | null = null;
    
    // Configurable maximum size for the cache
    private static readonly MAX_CACHE_SIZE = 100;

     // Habilitar/deshabilitar el ajuste dinámico
    private static _dynamicSizing = true;
    
    private static get diffCache(): LRUCache<string, number> {
        if (!this._diffCache) {
            this._diffCache = new LRUCache<string, number>(this.MAX_CACHE_SIZE);
        }
        return this._diffCache;
    }

    /**
     * Gets detailed cache statistics for monitoring.
     */
    static getDetailedStats() {
        return this._diffCache ? this._diffCache.getMetrics() : null;
    }
    
    /**
     * Gets a cached diff result or calculates a new one.
     */
    static getDiffResult(d1: Temporal.ZonedDateTime, d2: Temporal.ZonedDateTime, unit: TimeUnit): number {
        // Create a unique key for this diff calculation
        const key = `${d1.toString()}-${d2.toString()}-${unit}`;

        // Verificar si es momento de ajustar el tamaño
        this.checkAndResizeCache();
        
        let result = this.diffCache.get(key);
        if (result === undefined) {
            // Calculate and cache the result
            type TotalUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
            result = d1.since(d2).total({ unit: unit as TotalUnit, relativeTo: d1 });
            this.diffCache.set(key, result);
        }
        return result;
    }

    /**
     * Verifica y ajusta el tamaño del caché si es necesario
     */
    private static checkAndResizeCache(): void {
        if (!this._dynamicSizing || !this._diffCache || !this._diffCache.shouldResize()) return;
        
        const metrics = this._diffCache.getMetrics();
        const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, metrics.maxSize);
        
        if (optimalSize !== metrics.maxSize) {
            this._diffCache.setMaxSize(optimalSize);
            this._diffCache.markResized();
        }
    }

    /**
     * Habilita o deshabilita el ajuste dinámico de tamaño
     */
    static setDynamicSizing(enabled: boolean): void {
        this._dynamicSizing = enabled;
    }
    
    /**
     * Obtiene el estado actual del ajuste dinámico
     */
    static isDynamicSizingEnabled(): boolean {
        return this._dynamicSizing;
    }
    
    /**
     * Clears the diff cache. Useful for testing or memory management.
     */
    static clear(): void {
        if (this._diffCache) this._diffCache.clear();
    }
    
    /**
     * Gets cache statistics for monitoring.
     */
    static getStats() {
        const cacheSize = this._diffCache ? this._diffCache.size : 0;
        
        return {
            diffCache: cacheSize,
            maxSize: this.MAX_CACHE_SIZE
        };
    }
    
    /**
     * Configures the maximum size for the diff cache.
     * @param size New maximum size for the cache
     */
    static setMaxCacheSize(size: number): void {
        if (size < 1) throw new Error('Cache size must be at least 1');
        
        // Create a new cache with the updated size
        this._diffCache = new LRUCache<string, number>(size);
    }
}

// Export the class for use in plugins and tests
export { IntlCache, DiffCache };

/**
 * Optimizador de caché que ajusta dinámicamente el tamaño basado en patrones de uso.
 * @internal
 */
class CacheOptimizer {
    // Configuración por defecto
    private static readonly MIN_CACHE_SIZE = 10;
    private static readonly MAX_CACHE_SIZE = 500;
    private static readonly TARGET_HIT_RATIO = 0.8; // 80% de aciertos
    private static readonly GROWTH_FACTOR = 1.5;
    private static readonly SHRINK_FACTOR = 0.8;
    
    /**
     * Calcula el tamaño óptimo de caché basado en las métricas de uso
     */
    static calculateOptimalSize(metrics: ReturnType<LRUCache<any, any>['getMetrics']>, currentSize: number): number {
        // In test environments, require fewer hits+misses
        const minSamples = typeof process !== 'undefined' && 
                          process.env && 
                          process.env.NODE_ENV === 'test' ? 10 : 100;
        
        // Si no hay suficientes datos, mantener el tamaño actual
        if (metrics.hits + metrics.misses < minSamples) {
            return currentSize;
        }
        
        let newSize = currentSize;
        
        // Ajustar según la tasa de aciertos
        if (metrics.hitRatio < this.TARGET_HIT_RATIO) {
            // Baja tasa de aciertos, aumentar el tamaño
            newSize = Math.min(
                Math.ceil(currentSize * this.GROWTH_FACTOR),
                this.MAX_CACHE_SIZE
            );
        } else if (metrics.utilization < 0.5 && metrics.size > this.MIN_CACHE_SIZE) {
            // Alta tasa de aciertos pero baja utilización, reducir el tamaño
            newSize = Math.max(
                Math.ceil(currentSize * this.SHRINK_FACTOR),
                this.MIN_CACHE_SIZE,
                metrics.size + 5 // Mantener un margen sobre el tamaño actual
            );
        }
        
        return newSize;
    }
}
