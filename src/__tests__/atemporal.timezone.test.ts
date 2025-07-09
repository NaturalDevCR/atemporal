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

    it('should allow setting and using a default time zone', () => {
        atemporal.setDefaultTimeZone('Asia/Tokyo');
        const nowInTokyo = atemporal(); // Should be created with Tokyo's timezone

        expect(nowInTokyo.raw.timeZoneId).toBe('Asia/Tokyo');
    });
});