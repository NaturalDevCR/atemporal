/**
 * Sistema centralizado de caché para expresiones regulares.
 * Mejora el rendimiento al precompilar y reutilizar expresiones regulares comunes.
 * @internal
 */
import { LRUCache } from './core/caching/lru-cache';

export class RegexCache {
    // Tamaño máximo configurable para el caché
    private static readonly MAX_CACHE_SIZE = 100;
    
    // Caché para expresiones regulares dinámicas
    private static _dynamicRegexCache: LRUCache<string, RegExp> | null = null;
    
    // Expresiones regulares precompiladas estáticas
    private static _precompiledRegex: Map<string, RegExp> = new Map();
    
    // Inicialización de expresiones regulares precompiladas
    static {
        // Formato de fecha/hora - ordered by length to prevent single char matches
        this._precompiledRegex.set('tokenRegex', /\[([^\]]+)]|YYYY|MMMM|dddd|MMM|ddd|YY|MM|DD|HH|hh|mm|ss|SSS|ZZ|dd|(?<!\w)[MDAHhmsZaz](?!\w)/g);
        
        // Validación ISO UTC
        this._precompiledRegex.set('isoUtcRegex', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
        
        // Formato personalizado - UPDATED to include bracket handling
        this._precompiledRegex.set('customFormatTokenRegex', /\[([^\]]+)]|YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D|WWW|WW|W|HH|H|hh|h|mm|m|ss|s|SSS|SS|S|A|a/g);
        this._precompiledRegex.set('escapeRegexChars', /[-/\\^$*+?.()|[\]{}]/g);
        
        // Formato avanzado
        this._precompiledRegex.set('advancedTokenRegex', /Qo|Do|zzzz|zzz/g);
    }
    
    /**
     * Gets the precompiled custom format token regex.
     * @returns The custom format token regex for parsing format strings
     */
    static getCustomFormatTokenRegex(): RegExp {
        const regex = this._precompiledRegex.get('customFormatTokenRegex');
        if (!regex) {
            throw new Error('Custom format token regex not found in precompiled cache');
        }
        return regex;
    }
    
    /**
     * Obtiene una expresión regular precompilada por su nombre.
     * @param name Nombre de la expresión regular precompilada
     * @returns La expresión regular precompilada o undefined si no existe
     */
    static getPrecompiled(name: string): RegExp | undefined {
        return this._precompiledRegex.get(name);
    }
    
    /**
     * Obtiene o crea una expresión regular dinámica.
     * @param pattern Patrón de la expresión regular
     * @param flags Flags de la expresión regular (por defecto: ninguno)
     * @returns La expresión regular cacheada
     */
    static getDynamic(pattern: string, flags?: string): RegExp {
        const key = `${pattern}|${flags || ''}`;
        
        // Inicializar el caché si es necesario
        if (!this._dynamicRegexCache) {
            this._dynamicRegexCache = new LRUCache<string, RegExp>(this.MAX_CACHE_SIZE);
        }
        
        // Verificar si ya existe en el caché
        let regex = this._dynamicRegexCache.get(key);
        if (!regex) {
            // Crear nueva expresión regular y almacenarla en el caché
            regex = new RegExp(pattern, flags);
            this._dynamicRegexCache.set(key, regex);
        }
        
        return regex;
    }
    
    /**
     * Limpia el caché de expresiones regulares dinámicas.
     */
    static clear(): void {
        if (this._dynamicRegexCache) {
            this._dynamicRegexCache.clear();
        }
    }
    
    /**
     * Configura el tamaño máximo del caché.
     * @param size Nuevo tamaño máximo para el caché
     */
    static setMaxCacheSize(size: number): void {
        if (size < 1) throw new Error('Cache size must be at least 1');
        
        // Crear un nuevo caché con el tamaño actualizado
        this._dynamicRegexCache = new LRUCache<string, RegExp>(size);
    }
    
    /**
     * Obtiene estadísticas del caché para monitoreo.
     */
    static getStats() {
        return {
            precompiled: this._precompiledRegex.size,
            dynamic: this._dynamicRegexCache ? this._dynamicRegexCache.size : 0,
            maxSize: this.MAX_CACHE_SIZE
        };
    }
}