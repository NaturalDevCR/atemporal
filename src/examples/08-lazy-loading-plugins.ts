/**
 * @file 08 - Lazy Loading Plugins (TypeScript)
 *
 * Demonstrates how to use lazy loading for plugins to reduce initial bundle size.
 * This approach loads plugins on-demand only when they are needed.
 *
 * To run: node -r ts-node/register examples/08-lazy-loading-plugins.ts
 */

import atemporal from '../index';

// Función asíncrona para demostrar la carga perezosa
async function demoLazyLoading() {
    console.log('--- 8. Lazy Loading Plugins Example ---');

    // Inicialmente no hay plugins cargados
    console.log('\nInitially loaded plugins:', atemporal.getLoadedPlugins());
    console.log('Available plugins:', atemporal.getAvailablePlugins());

    // Cargar el plugin relativeTime bajo demanda
    console.log('\nLoading relativeTime plugin...');
    await atemporal.lazyLoad('relativeTime');
    
    // Ahora podemos usar la funcionalidad del plugin
    const twoHoursAgo = atemporal().subtract(2, 'hour');
    // Usamos una aserción de tipo para ayudar a TypeScript
    console.log(`Two hours ago: "${(twoHoursAgo as any).fromNow()}"`); // "2 hours ago"

    // Verificar que el plugin está cargado
    console.log('\nIs relativeTime loaded?', atemporal.isPluginLoaded('relativeTime'));
    console.log('Currently loaded plugins:', atemporal.getLoadedPlugins());

    // Cargar otro plugin bajo demanda
    console.log('\nLoading durationHumanizer plugin...');
    await atemporal.lazyLoad('durationHumanizer');
    
    // Usar la funcionalidad del segundo plugin
    const myDuration = atemporal.duration({ years: 1, months: 6, days: 15 });
    // Usamos una aserción de tipo para ayudar a TypeScript
    console.log(`Humanized duration: "${(atemporal as any).humanize(myDuration)}"`); 

    // Probar la carga múltiple
    console.log('\nLoading multiple plugins at once...');
    await atemporal.lazyLoadMultiple(['advancedFormat', 'weekDay']);
    console.log('All loaded plugins:', atemporal.getLoadedPlugins());

    // Intentar cargar un plugin ya cargado (no debería hacer nada)
    console.log('\nTrying to load relativeTime again...');
    await atemporal.lazyLoad('relativeTime');
    console.log('Loaded plugins remain the same:', atemporal.getLoadedPlugins());
}

// Ejecutar la demostración
demoLazyLoading().catch(error => {
    console.error('Error in lazy loading demo:', error);
});