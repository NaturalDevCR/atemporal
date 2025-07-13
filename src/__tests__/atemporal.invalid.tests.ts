// src/__tests__/atemporal.invalid.tests.ts

import atemporal from '../index';
import { InvalidAtemporalInstanceError } from '../errors';
// Importamos los plugins para asegurarnos de que sus métodos también se prueban
import relativeTime from '../plugins/relativeTime';

atemporal.extend(relativeTime);

describe('Atemporal: Operations on Invalid Instances', () => {
    const invalidDate = atemporal('this is not a date');
    const validDate = atemporal(); // Para usar en comparaciones

    it('should correctly identify itself as invalid', () => {
        expect(invalidDate.isValid()).toBe(false);
    });

    // ▼▼▼ Pruebas para métodos que deben devolver la misma instancia inválida ▼▼▼
    it('all manipulation methods should return the same invalid instance', () => {
        expect(invalidDate.add(5, 'day')).toBe(invalidDate);
        expect(invalidDate.subtract(2, 'hour')).toBe(invalidDate);
        expect(invalidDate.set('year', 2025)).toBe(invalidDate);
        expect(invalidDate.startOf('month')).toBe(invalidDate);
        expect(invalidDate.endOf('day')).toBe(invalidDate);
        expect(invalidDate.timeZone('America/New_York')).toBe(invalidDate);
        expect(invalidDate.clone()).toBe(invalidDate);
        expect(invalidDate.dayOfWeek(3)).toBe(invalidDate);
        expect(invalidDate.quarter(2)).toBe(invalidDate);
    });

    // ▼▼▼ Pruebas para getters y métodos que devuelven números ▼▼▼
    it('all numeric getters and methods should return NaN', () => {
        // Getters de propiedades
        expect(invalidDate.weekOfYear).toBeNaN();
        expect(invalidDate.daysInMonth).toBeNaN();

        // Métodos que devuelven número
        expect(invalidDate.get('year')).toBeNaN();
        expect(invalidDate.quarter()).toBeNaN();
        expect(invalidDate.dayOfWeek()).toBeNaN();
        expect(invalidDate.diff(validDate)).toBeNaN();
    });

    // ▼▼▼ Pruebas para métodos que devuelven strings ▼▼▼
    it('all string-returning methods should return "Invalid Date"', () => {
        expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
        expect(invalidDate.toString()).toBe('Invalid Date');
        expect(invalidDate.dayOfWeekName).toBe('Invalid Date');
        expect(invalidDate.timeZoneName).toBe('Invalid TimeZone'); // Tiene su propio mensaje
        expect(invalidDate.fromNow()).toBe('Invalid Date'); // Método del plugin
        expect(invalidDate.toNow()).toBe('Invalid Date');   // Método del plugin
    });

    // ▼▼▼ Pruebas para métodos que devuelven objetos ▼▼▼
    it('methods returning objects should return invalid or null values', () => {
        // .toDate()
        const dateObject = invalidDate.toDate();
        expect(dateObject.getTime()).toBeNaN();
    });

    // ▼▼▼ Pruebas para getters que deben lanzar un error ▼▼▼
    it('should throw an error when accessing raw getters', () => {
        expect(() => invalidDate.raw).toThrow(InvalidAtemporalInstanceError);
        expect(() => invalidDate.datetime).toThrow(InvalidAtemporalInstanceError);
    });
});