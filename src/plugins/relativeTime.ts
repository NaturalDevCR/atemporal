// Importamos la clase para poder tipar 'this' y los tipos que creamos.
import { TemporalWrapper } from '../TemporalWrapper';
import type { Plugin, TimeUnit } from '../types';

// Definimos nuestra función de plugin usando el tipo 'Plugin' para seguridad de tipos.
const relativeTimePlugin: Plugin = (Atemporal, atemporal) => {
    // Una lista priorizada de unidades, de la más grande a la más pequeña.
    const UNITS: TimeUnit[] = ['year', 'month', 'day', 'hour', 'minute', 'second'];

    // Añadimos el nuevo método .fromNow() al prototipo de la clase Atemporal
    // Se añade 'this: TemporalWrapper' para indicarle a TypeScript el tipo de 'this'
    Atemporal.prototype.fromNow = function (this: TemporalWrapper, withoutSuffix = false) {
        // 'this' es la instancia de atemporal que llama al método.
        const dateToCompare = this;
        const now = atemporal(); // La fecha y hora actual.

        let bestUnit: TimeUnit = 'second';
        let bestDiff = 0;

        // 1. Encontrar la mejor unidad para mostrar la diferencia.
        // Iteramos desde 'year' hacia 'second'.
        for (const unit of UNITS) {
            // Usamos el método .diff() de nuestra propia librería.
            const diff = now.diff(dateToCompare, unit);

            // Si la diferencia absoluta es 1 o más, hemos encontrado la unidad ideal.
            if (Math.abs(diff) >= 1) {
                bestUnit = unit;
                bestDiff = Math.round(diff);
                break; // Detenemos el bucle.
            }
        }

        // 2. Usar la API de Internacionalización para formatear.
        // Obtenemos el locale configurado en la librería.
        const locale = atemporal.getDefaultLocale();
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        // Intl.RelativeTimeFormat se encarga del pasado (diff > 0) y futuro (diff < 0).
        // También maneja el caso de "now" si bestDiff es 0.
        let result = rtf.format(bestDiff, bestUnit);

        // 3. (Opcional) Quitar el sufijo si el usuario lo pide.
        if (withoutSuffix) {
            // Esta es una forma simple de quitar los prefijos/sufijos comunes.
            result = result
                .replace(/^hace\s/, '')
                .replace(/^en\s/, '')
                .replace(/\sago$/, '')
                .replace(/^in\s/, '');
        }

        return result;
    };

    // El método .toNow() es un alias de .fromNow(), ya que nuestra implementación
    // de .fromNow() ya maneja correctamente las fechas en el pasado y en el futuro.
    Atemporal.prototype.toNow = function (this: TemporalWrapper, withoutSuffix = false) {
        return this.fromNow(withoutSuffix);
    };
};

export default relativeTimePlugin;