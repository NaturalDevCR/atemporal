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