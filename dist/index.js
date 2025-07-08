"use strict";
// src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultTimeZone = exports.setDefaultLocale = exports.isValid = exports.Atemporal = void 0;
const TemporalWrapper_1 = require("./TemporalWrapper");
Object.defineProperty(exports, "Atemporal", { enumerable: true, get: function () { return TemporalWrapper_1.TemporalWrapper; } });
const TemporalUtils_1 = require("./TemporalUtils");
/**
 * Utilidades estáticas que son útiles para el usuario final.
 */
exports.isValid = TemporalUtils_1.TemporalUtils.isValid;
exports.setDefaultLocale = TemporalUtils_1.TemporalUtils.setDefaultLocale;
exports.setDefaultTimeZone = TemporalUtils_1.TemporalUtils.setDefaultTimeZone;
/**
 * La función principal y por defecto para crear una instancia.
 * Esto imita el uso de dayjs('...').
 */
const atemporal = TemporalUtils_1.TemporalUtils.wrap;
exports.default = atemporal;
