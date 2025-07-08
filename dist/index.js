"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Atemporal = void 0;
const TemporalWrapper_1 = require("./TemporalWrapper");
Object.defineProperty(exports, "Atemporal", { enumerable: true, get: function () { return TemporalWrapper_1.TemporalWrapper; } });
const TemporalUtils_1 = require("./TemporalUtils");
// 1. Tomamos la función base que creará las instancias
const atemporalFn = TemporalUtils_1.TemporalUtils.wrap;
// 2. Le decimos a TypeScript que nuestro objeto final 'atemporal' se comportará
//    como nuestra factoría (una función con propiedades).
const atemporal = atemporalFn;
// 3. Le asignamos todas las propiedades estáticas que definimos en el tipo.
atemporal.isValid = TemporalUtils_1.TemporalUtils.isValid;
atemporal.setDefaultLocale = TemporalUtils_1.TemporalUtils.setDefaultLocale;
atemporal.setDefaultTimeZone = TemporalUtils_1.TemporalUtils.setDefaultTimeZone;
atemporal.getDefaultLocale = TemporalUtils_1.TemporalUtils.getDefaultLocale;
atemporal.extend = (plugin, options) => {
    plugin(TemporalWrapper_1.TemporalWrapper, atemporal, options);
};
// 4. Exportamos el objeto completo.
exports.default = atemporal;
