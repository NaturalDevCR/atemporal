/**
 * @file Performance tests to measure the impact of Intl caching.
 */

import atemporal from '../index';
import relativeTimePlugin from '../plugins/relativeTime';
import advancedFormatPlugin from '../plugins/advancedFormat';
import durationHumanizer from '../plugins/durationHumanizer';
import customParseFormatPlugin from '../plugins/customParseFormat';
import { IntlCache } from '../TemporalUtils';

// Extend atemporal with plugins
atemporal.extend(relativeTimePlugin);
atemporal.extend(advancedFormatPlugin);
atemporal.extend(durationHumanizer);
atemporal.extend(customParseFormatPlugin);

describe('Performance Tests', () => {
    beforeEach(() => {
        // Clear cache before each test
        IntlCache.clearAll();
        (atemporal as any).clearFormatCache?.();
    });

    test('relativeTime performance with cache', () => {
        const instance = atemporal().subtract(5, 'minutes');
        
        // Warm up
        instance.fromNow();
        
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            instance.fromNow();
        }
        
        const end = performance.now();
        const duration = end - start;
        
        console.log(`RelativeTime: ${iterations} iterations took ${duration.toFixed(2)}ms`);
        console.log('Cache stats:', IntlCache.getStats());
        
        // Ajustar threshold más realista después de optimización
        expect(duration).toBeLessThan(500); // 500ms para 1000 iteraciones
    });

    test('advancedFormat performance with cache', () => {
        const instance = atemporal('2023-12-25T15:30:00Z');
        
        // Warm up
        instance.format('Do MMMM YYYY [at] HH:mm zzz');
        
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            instance.format('Do MMMM YYYY [at] HH:mm zzz');
        }
        
        const end = performance.now();
        const duration = end - start;
        
        console.log(`AdvancedFormat: ${iterations} iterations took ${duration.toFixed(2)}ms`);
        console.log('Cache stats:', IntlCache.getStats());
        
        expect(duration).toBeLessThan(1000);
    });

    test('durationHumanizer performance with cache', () => {
        const duration = { hours: 2, minutes: 30, seconds: 15 };
        
        // Warm up
        atemporal.humanize(duration);
        
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            atemporal.humanize(duration);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`DurationHumanizer: ${iterations} iterations took ${executionTime.toFixed(2)}ms`);
        console.log('Cache stats:', IntlCache.getStats());
        
        expect(executionTime).toBeLessThan(1000);
    });
    
    test('customParseFormat performance with regex cache', () => {
        const dateString = '2023-12-25 15:30:45';
        const formatString = 'YYYY-MM-DD HH:mm:ss';
        
        // Warm up - primera llamada crea el cache
        atemporal.fromFormat(dateString, formatString);
        
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            atemporal.fromFormat(dateString, formatString);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`CustomParseFormat: ${iterations} iterations took ${executionTime.toFixed(2)}ms`);
        console.log('Format cache size:', (atemporal as any).getFormatCacheSize?.());
        
        expect(executionTime).toBeLessThan(1000);
    });
    
    test('customParseFormat with multiple formats', () => {
        // Probar con múltiples formatos para verificar el comportamiento del cache
        const formats = [
            'YYYY-MM-DD',
            'MM/DD/YYYY',
            'DD.MM.YYYY',
            'YYYY-MM-DD HH:mm',
            'MM/DD/YYYY HH:mm:ss',
            'DD.MM.YYYY HH:mm:ss.SSS'
        ];
        
        const dateStrings = [
            '2023-12-25',
            '12/25/2023',
            '25.12.2023',
            '2023-12-25 15:30',
            '12/25/2023 15:30:45',
            '25.12.2023 15:30:45.123'
        ];
        
        // Warm up - cargar todos los formatos en el cache
        for (let i = 0; i < formats.length; i++) {
            atemporal.fromFormat(dateStrings[i], formats[i]);
        }
        
        const cacheSize = (atemporal as any).getFormatCacheSize?.();
        console.log('Format cache size after loading multiple formats:', cacheSize);
        
        // Verificar que el cache tiene el tamaño esperado
        expect(cacheSize).toBe(formats.length);
        
        // Medir rendimiento con cache lleno
        const iterations = 100;
        const start = performance.now();
        
        for (let j = 0; j < iterations; j++) {
            for (let i = 0; i < formats.length; i++) {
                atemporal.fromFormat(dateStrings[i], formats[i]);
            }
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`Multiple formats: ${iterations * formats.length} parses took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(1000);
    });

    test('cache effectiveness', () => {
        // Test that cache is actually being used
        const instance = atemporal();
        
        // Multiple calls with same locale should reuse cached formatters
        instance.fromNow();
        instance.fromNow();
        instance.format('Do MMMM');
        instance.format('Do MMMM');
        
        const stats = IntlCache.getStats();
        console.log('Final cache stats:', stats);
        
        // Should have cached formatters
        expect(stats.total).toBeGreaterThan(0);
        
        // Verificar que el tamaño no excede el máximo
        expect(stats.total).toBeLessThanOrEqual(stats.maxSize);
    });
    
    test('LRU cache behavior', () => {
        // Configurar un tamaño de cache muy pequeño para probar el comportamiento LRU
        IntlCache.setMaxCacheSize(3);
        
        // Crear más formateadores de los que caben en el cache
        const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'];
        
        for (const locale of locales) {
            IntlCache.getDateTimeFormatter(locale, { dateStyle: 'full' });
        }
        
        const stats = IntlCache.getStats();
        console.log('LRU test cache stats:', stats);
        
        // El cache debería mantener solo 3 elementos (el tamaño máximo configurado)
        expect(stats.dateTimeFormatters).toBe(3);
        
        // Restaurar el tamaño del cache para otros tests
        IntlCache.setMaxCacheSize(50);
    });
});