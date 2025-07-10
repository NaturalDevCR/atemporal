import atemporal from '../index';
import { Temporal } from '@js-temporal/polyfill';

describe('Type Guard and Validator Utilities', () => {
    describe('atemporal.isValid()', () => {
        it('should return true for valid date inputs', () => {
            expect(atemporal.isValid('2024-01-01')).toBe(true);
            expect(atemporal.isValid(new Date())).toBe(true);
            expect(atemporal.isValid(atemporal())).toBe(true);
            expect(atemporal.isValid(Date.now())).toBe(true);
        });

        it('should return false for invalid or unparsable inputs', () => {
            expect(atemporal.isValid('not a real date')).toBe(false);
            expect(atemporal.isValid('2024-13-01')).toBe(false); // Invalid month
            expect(atemporal.isValid(null)).toBe(false);
            expect(atemporal.isValid(undefined)).toBe(false);
            expect(atemporal.isValid({})).toBe(false);
        });
    });
    describe('atemporal.isAtemporal()', () => {
        it('should return true for an atemporal instance', () => {
            expect(atemporal.isAtemporal(atemporal())).toBe(true);
        });

        it('should return false for other object types and primitives', () => {
            expect(atemporal.isAtemporal(new Date())).toBe(false);
            expect(atemporal.isAtemporal({})).toBe(false);
            expect(atemporal.isAtemporal(null)).toBe(false);
            expect(atemporal.isAtemporal('2024-01-01')).toBe(false);
        });
    });

    describe('atemporal.isDuration()', () => {
        it('should return true for a Temporal.Duration instance', () => {
            const duration = Temporal.Duration.from({ hours: 5 });
            expect(atemporal.isDuration(duration)).toBe(true);
        });

        it('should return false for other types', () => {
            expect(atemporal.isDuration(atemporal())).toBe(false);
            expect(atemporal.isDuration({})).toBe(false);
            expect(atemporal.isDuration('PT5H')).toBe(false); // It's a string, not an instance
        });
    });

    describe('atemporal.isValidTimeZone()', () => {
        it('should return true for valid IANA time zone identifiers', () => {
            expect(atemporal.isValidTimeZone('UTC')).toBe(true);
            expect(atemporal.isValidTimeZone('America/New_York')).toBe(true);
            expect(atemporal.isValidTimeZone('Asia/Tokyo')).toBe(true);
        });

        it('should return false for invalid or unsupported time zone identifiers', () => {
            expect(atemporal.isValidTimeZone('Invalid/Zone')).toBe(false);
            expect(atemporal.isValidTimeZone('America/Fake_City')).toBe(false);
            expect(atemporal.isValidTimeZone('foo')).toBe(false);
            expect(atemporal.isValidTimeZone('')).toBe(false);
        });
    });

    describe('atemporal.isValidLocale()', () => {
        it('should return true for structurally valid locale codes', () => {
            expect(atemporal.isValidLocale('en-US')).toBe(true);
            expect(atemporal.isValidLocale('es-CR')).toBe(true);
            expect(atemporal.isValidLocale('fr')).toBe(true);
            expect(atemporal.isValidLocale('zh-Hant-TW')).toBe(true);
        });

        it('should return false for invalid or malformed locale codes', () => {
            expect(atemporal.isValidLocale('en_US')).toBe(false); // Underscore is invalid
            expect(atemporal.isValidLocale('123')).toBe(false);
            expect(atemporal.isValidLocale('')).toBe(false);
        });
    });

    describe('atemporal.isPlugin()', () => {
        it('should return true for functions with 2 or 3 arguments', () => {
            const plugin2Args = (a: any, b: any) => {};
            const plugin3Args = (a: any, b: any, c: any) => {};
            expect(atemporal.isPlugin(plugin2Args)).toBe(true);
            expect(atemporal.isPlugin(plugin3Args)).toBe(true);
        });

        it('should return false for functions with other argument counts', () => {
            const plugin1Arg = (a: any) => {};
            expect(atemporal.isPlugin(plugin1Arg)).toBe(false);
        });

        it('should return false for non-function inputs', () => {
            expect(atemporal.isPlugin({})).toBe(false);
            expect(atemporal.isPlugin(null)).toBe(false);
        });
    });
});