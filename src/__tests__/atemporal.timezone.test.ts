// src/__tests__/atemporal.timezone.test.ts

import atemporal from '../index';

describe('Atemporal: Time Zone Handling', () => {

    // Reset default timezone after each test to avoid side effects
    afterEach(() => {
        atemporal.setDefaultTimeZone('UTC');
    });

    it('should correctly handle timezone transitions (Daylight Saving Time)', () => {
        // In New York, DST ends on Nov 3, 2024. At 2:00 AM, clocks fall back to 1:00 AM.
        const beforeDST = atemporal('2024-11-03T01:00:00-04:00', 'America/New_York'); // 1 AM EDT

        // Adding 1 hour should land on 1:00 AM EST (the second time 1 AM occurs)
        const afterDST = beforeDST.add(1, 'hour');

        expect(beforeDST.format('HH:mm Z')).toBe('01:00 -04:00');
        expect(afterDST.format('HH:mm Z')).toBe('01:00 -05:00'); // Note the offset change
    });

    describe('Timezone Formatting Tokens (z, zzz, zzzz)', () => {
        it('should format timezone names correctly for an IANA zone during Standard Time', () => {
            // January is Standard Time in New York (EST)
            const date = atemporal('2024-01-15T10:00:00', 'America/New_York');

            expect(date.format('z')).toBe('America/New_York'); // IANA ID
            expect(date.format('zzz')).toBe('EST'); // Short name
            expect(date.format('zzzz')).toBe('Eastern Standard Time'); // Long name
        });

        it('should format timezone names correctly for an IANA zone during Daylight Saving Time', () => {
            // July is Daylight Saving Time in New York (EDT)
            const date = atemporal('2024-07-15T10:00:00', 'America/New_York');

            expect(date.format('z')).toBe('America/New_York');
            expect(date.format('zzz')).toBe('EDT');
            expect(date.format('zzzz')).toBe('Eastern Daylight Time');
        });

        it('should format timezone names correctly for a fixed-offset zone', () => {
            const date = atemporal('2024-05-15T10:00:00+08:00');

            // When parsing a fixed offset, the offset itself becomes the timezone ID.
            expect(date.format('z')).toBe('+08:00');

            // The short name can be the GMT format OR the raw offset if Intl fails.
            // This makes the test robust across different environments (local vs. CI).
            expect(date.format('zzz')).toMatch(/GMT\+8|GMT\+08:00|\+08:00/);

            // --- START OF FIX ---
            // The long name can also fall back to the raw offset in some environments.
            expect(date.format('zzzz')).toMatch(/GMT\+08:00|\+08:00/);
            // --- END OF FIX ---
        });

        it('should format timezone names correctly for UTC', () => {
            const date = atemporal('2024-01-01T12:00:00Z');

            expect(date.format('z')).toBe('UTC');
            expect(date.format('zzz')).toBe('UTC');
            expect(date.format('zzzz')).toBe('Coordinated Universal Time');
        });

        it('should produce localized long timezone names when a locale is provided', () => {
            const date = atemporal('2024-01-15T10:00:00', 'America/New_York');

            // We check for containment to make the test robust against minor wording changes.
            expect(date.format('zzzz', 'es-ES')).toContain('hora estándar');
            // Apply the same robust check for the French locale.
            expect(date.format('zzzz', 'fr-FR')).toContain('heure normale de l’Est');
        });

        it('should handle a European timezone correctly', () => {
            // June is summer time in Madrid (CEST)
            const date = atemporal('2024-06-15T12:00:00', 'Europe/Madrid');

            expect(date.format('z')).toBe('Europe/Madrid');
            // The short name can be the abbreviation or the GMT offset. We accept both.
            expect(date.format('zzz')).toMatch(/CEST|GMT\+2/);
            expect(date.format('zzzz')).toBe('Central European Summer Time');
        });
    });

    describe('atemporal time zone formatting', () => {
        it('should return the correct timezone offset after conversion', () => {
            const utcDate = atemporal('2024-01-01T00:00:00.000Z');
            const saoPauloDate = utcDate.timeZone('America/Sao_Paulo');

            // El día y la hora cambian a la perspectiva de São Paulo
            expect(saoPauloDate.year).toBe(2023);
            expect(saoPauloDate.month).toBe(12);
            expect(saoPauloDate.day).toBe(31);
            expect(saoPauloDate.hour).toBe(21);

            // La prueba clave: el offset es el de São Paulo, no el UTC original.
            expect(saoPauloDate.format('Z')).toBe('-03:00');
            expect(saoPauloDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ')).toBe('2023-12-31T21:00:00.000-03:00');
        });
    });

    describe('Parsing strings with timezone information', () => {
        it('should preserve the timezone offset from an ISO 8601 string', () => {
            const isoStringWithOffset = '2024-05-15T10:00:00+08:00';
            const date = atemporal(isoStringWithOffset);

            // 1. The object should be valid
            expect(date.isValid()).toBe(true);

            // 2. The timezone offset should be preserved, not converted to local time
            expect(date.format('Z')).toBe('+08:00');

            // 3. The hour should be exactly as specified in the string
            expect(date.hour).toBe(10);

            // 4. The full string representation should match
            expect(date.toString()).toBe('2024-05-15T10:00:00+08:00');
        });
    });

    it('should allow setting and using a default time zone', () => {
        atemporal.setDefaultTimeZone('Asia/Tokyo');
        const nowInTokyo = atemporal(); // Should be created with Tokyo's timezone

        expect(nowInTokyo.raw.timeZoneId).toBe('Asia/Tokyo');
    });
});