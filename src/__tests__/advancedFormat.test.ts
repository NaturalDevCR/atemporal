import atemporal from '../index';
import advancedFormatPlugin from '../plugins/advancedFormat';

// Extend atemporal with the plugin for all tests in this file.
atemporal.extend(advancedFormatPlugin);

describe('AdvancedFormat Plugin', () => {

    describe('Ordinal Tokens (Do, Qo)', () => {
        it('should format day-of-month ordinals correctly in English (en)', () => {
            expect(atemporal('2024-01-01').format('Do MMMM')).toBe('1st January');
            expect(atemporal('2024-01-02').format('Do MMMM')).toBe('2nd January');
            expect(atemporal('2024-01-11').format('Do MMMM')).toBe('11th January');
        });

        it('should format quarter ordinals correctly in English (en)', () => {
            expect(atemporal('2024-01-15').format('Qo [Quarter]')).toBe('1st Quarter');
            expect(atemporal('2024-08-15').format('Qo')).toBe('3rd');
        });

        it('should format ordinals correctly in other locales', () => {
            expect(atemporal('2024-01-01').format('Do [de] MMMM', 'es')).toBe('1º de enero');
            expect(atemporal('2024-01-01').format('Do MMMM', 'fr')).toBe('1er janvier');
        });
    });

    describe('Error handling and fallbacks', () => {
        it('should fallback to timezone ID if Intl API throws', () => {
            // Mock the Intl API to force the catch block to execute
            const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
                throw new Error('Forced error for testing');
            });

            const date = atemporal('2024-01-01T00:00:00Z', 'America/New_York');

            // The catch block should return the raw timeZoneId
            expect(date.format('zzz')).toBe('America/New_York');
            expect(date.format('zzzz')).toBe('America/New_York');

            spy.mockRestore(); // Clean up the mock
        });
    });

    describe('Timezone Name Tokens (zzz, zzzz)', () => {
        it('should fallback gracefully for invalid locales', () => {
            const date = atemporal('2024-01-01T00:00:00Z', 'America/New_York');
            // The Intl API is resilient and often falls back to a default locale
            // instead of throwing. The test should expect the formatted result.
            expect(date.format('zzz', 'xx-INVALID')).toBe('EST');
            expect(date.format('zzzz', 'xx-INVALID')).toBe('Eastern Standard Time');
        });

        it('should fallback gracefully for ordinal generation with invalid locale', () => {
            // This will trigger the catch block in getOrdinal, as Intl.PluralRules is stricter.
            const date = atemporal('2024-01-01');
            expect(date.format('Do', 'xx-INVALID')).toBe('1');
        });

        it('should format names correctly for an IANA zone (Standard Time)', () => {
            const date = atemporal('2024-01-15T10:00:00', 'America/New_York');
            expect(date.format('zzz')).toBe('EST');
            expect(date.format('zzzz')).toBe('Eastern Standard Time');
        });

        it('should format names correctly for an IANA zone (Daylight Time)', () => {
            const date = atemporal('2024-07-15T10:00:00', 'America/New_York');
            expect(date.format('zzz')).toBe('EDT');
            expect(date.format('zzzz')).toBe('Eastern Daylight Time');
        });

        // ▼▼▼ CASO DE PRUEBA RESTAURADO ▼▼▼
        it('should format names correctly for a European timezone', () => {
            const date = atemporal('2024-06-15T12:00:00', 'Europe/Madrid');
            expect(date.format('zzz')).toMatch(/CEST|GMT\+2/);
            expect(date.format('zzzz')).toBe('Central European Summer Time');
        });

        // ▼▼▼ CASO DE PRUEBA RESTAURADO ▼▼▼
        it('should format names correctly for a fixed-offset zone', () => {
            const date = atemporal('2024-05-15T10:00:00+08:00');
            expect(date.format('zzz')).toMatch(/GMT\+8|GMT\+08:00|\+08:00/);
            expect(date.format('zzzz')).toMatch(/GMT\+08:00|\+08:00/);
        });

        it('should format names correctly for UTC', () => {
            const date = atemporal('2024-01-01T12:00:00Z');
            expect(date.format('zzz')).toBe('UTC');
            expect(date.format('zzzz')).toBe('Coordinated Universal Time');
        });

        it('should produce localized timezone names', () => {
            const date = atemporal('2024-01-15T10:00:00', 'America/New_York');
            expect(date.format('zzzz', 'es-ES')).toContain('hora estándar');
        });

        it('should fallback gracefully for invalid locales', () => {
            const date = atemporal('2024-01-01T00:00:00Z', 'America/New_York');
            expect(date.format('zzzz', 'xx-INVALID')).toBe('Eastern Standard Time');
        });
    });

    it('should not interfere with core formatting tokens', () => {
        const date = atemporal('2024-12-25T10:00:00', 'America/New_York');
        // El core se encarga de estos
        expect(date.format('YYYY-MM-DD (z)')).toBe('2024-12-25 (America/New_York)');
        // El plugin se encarga de este
        expect(date.format('Do of MMMM [at] zzzz')).toBe('25th of December at Eastern Standard Time');
    });
});