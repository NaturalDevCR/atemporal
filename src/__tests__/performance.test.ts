/**
 * @file Performance tests to measure the impact of Intl caching.
 */

import atemporal from '../index';
import relativeTimePlugin from '../plugins/relativeTime';
import advancedFormatPlugin from '../plugins/advancedFormat';
import durationHumanizer from '../plugins/durationHumanizer';
import { IntlCache } from '../TemporalUtils';

// Extend atemporal with plugins
atemporal.extend(relativeTimePlugin);
atemporal.extend(advancedFormatPlugin);
atemporal.extend(durationHumanizer);

describe('Performance Tests', () => {
    beforeEach(() => {
        // Clear cache before each test
        IntlCache.clearAll();
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
    });
});