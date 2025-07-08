import '@js-temporal/polyfill';

import {Temporal} from "@js-temporal/polyfill";

import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
import type { DateInput, Plugin, AtemporalFactory, AtemporalFunction } from './types';

export { TemporalWrapper as Atemporal };
export type { DateInput, TimeUnit, SettableUnit, Plugin } from './types';

// La función 'wrap' ahora vive aquí dentro de nuestra función principal.
const atemporalFn: AtemporalFunction = (input?: DateInput, timeZone?: string) => {
    if (input instanceof TemporalWrapper) {
        return timeZone ? input.timeZone(timeZone) : input;
    }

    // --- LA SOLUCIÓN ESTÁ AQUÍ ---
    // Si el usuario llama a atemporal() sin argumentos, 'input' será undefined.
    // En ese caso, queremos devolver la fecha y hora actuales.
    if (input === undefined) {
        // Usamos la API nativa de Temporal para obtener la fecha y hora actuales
        // en la zona horaria por defecto que el usuario haya configurado.
        const now = Temporal.Now.zonedDateTimeISO(TemporalUtils.defaultTimeZone);
        return new TemporalWrapper(now);
    }

    // Si 'input' no es undefined, TypeScript ahora sabe que es un DateInput válido
    // y podemos pasarlo directamente al constructor.
    return new TemporalWrapper(input, timeZone);
};

// Construimos el objeto final
const atemporal = atemporalFn as AtemporalFactory;

atemporal.isValid = TemporalUtils.isValid;
atemporal.setDefaultLocale = TemporalUtils.setDefaultLocale;
atemporal.setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;
atemporal.getDefaultLocale = TemporalUtils.getDefaultLocale;

atemporal.extend = (plugin: Plugin, options) => {
    plugin(TemporalWrapper, atemporal, options);
};

export default atemporal;