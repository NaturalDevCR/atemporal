/**
 * @file LRU Cache implementation for efficient memory management
 * @internal
 */

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
        if (maxSize < 1) throw new Error('Cache size must be at least 1');
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
    
    delete(key: K): boolean {
        const deleted = this.cache.delete(key);
        return deleted;
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
    
    get capacity(): number {
        return this.maxSize;
    }
    
    keys(): IterableIterator<K> {
        return this.cache.keys();
    }
    
    values(): IterableIterator<V> {
        return this.cache.values();
    }
    
    entries(): IterableIterator<[K, V]> {
        return this.cache.entries();
    }
    
    forEach(callbackfn: (value: V, key: K, map: this) => void): void {
        this.cache.forEach((value, key) => {
            callbackfn(value, key, this);
        });
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
 * Cache metrics interface
 */
export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRatio: number;
    size: number;
    maxSize: number;
    utilization: number;
}

/**
 * Enhanced LRU cache with resizing capabilities
 * @internal
 */
export class ResizableLRUCache<K, V> extends Map<K, V> {
    private _maxSize: number;
    private hits = 0;
    private misses = 0;
    private lastResize = Date.now();
    private resizeInterval = 60000;

    constructor(maxSize = 100) {
        super();
        if (maxSize < 1) throw new Error('Cache size must be at least 1');
        this._maxSize = maxSize;
    }

    get maxSize(): number {
        return this._maxSize;
    }

    get capacity(): number {
        return this._maxSize;
    }

    get(key: K): V | undefined {
        const value = super.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.delete(key);
            super.set(key, value);
            this.hits++;
        } else {
            this.misses++;
        }
        return value;
    }

    set(key: K, value: V): this {
        if (this.has(key)) {
            this.delete(key);
        } else if (this.size >= this._maxSize) {
            // Remove least recently used (first item)
            const firstKey = this.keys().next().value;
            if (firstKey !== undefined) {
                this.delete(firstKey);
            }
        }
        return super.set(key, value);
    }

    setMaxSize(newSize: number): void {
        if (newSize < 1) throw new Error('Cache size must be at least 1');
        
        // Remove excess items if new size is smaller
        while (this.size > newSize) {
            const firstKey = this.keys().next().value;
            if (firstKey !== undefined) {
                this.delete(firstKey);
            } else {
                break;
            }
        }
        
        this._maxSize = newSize;
    }

    getMetrics(): CacheMetrics {
        return {
            hits: this.hits,
            misses: this.misses,
            hitRatio: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
            size: this.size,
            maxSize: this._maxSize,
            utilization: this.size / this._maxSize
        };
    }

    clear(): void {
        super.clear();
        this.hits = 0;
        this.misses = 0;
    }

    setResizeInterval(milliseconds: number): void {
        if (milliseconds < 1000 && process.env.NODE_ENV !== 'test') {
            throw new Error('Resize interval must be at least 1000ms');
        }
        this.resizeInterval = milliseconds;
    }

    shouldResize(): boolean {
        return Date.now() - this.lastResize >= this.resizeInterval;
    }

    markResized(): void {
        this.lastResize = Date.now();
    }
}