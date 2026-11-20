import atemporal from '../index';

describe('atemporal: ISO serialization', () => {
    it.each([
        ['UTC', '2026-12-08T18:00:00.000Z'],
        ['America/Puerto_Rico', '2026-12-08T22:00:00.000Z'],
        ['Asia/Kathmandu', '2026-12-08T12:15:00.000Z'],
        ['Pacific/Kiritimati', '2026-12-08T04:00:00.000Z'],
    ])('serializes local time in %s as UTC', (timeZone, expected) => {
        const start = atemporal('2026-12-08T18:00:00', timeZone);

        expect(start.toISOString()).toBe(expected);
    });

    it('preserves the original local time and offset after UTC serialization', () => {
        const start = atemporal('2026-12-08T18:00:00', 'America/Puerto_Rico');

        expect(start.toISOString()).toBe('2026-12-08T22:00:00.000Z');
        expect(start.toString()).toBe('2026-12-08T18:00:00-04:00');
        expect(start.timeZoneId).toBe('America/Puerto_Rico');
    });

    it('normalizes the same instant in different zones to the same string', () => {
        const start = atemporal('2026-12-08T22:00:00.120Z', 'UTC');

        expect(start.timeZone('America/Puerto_Rico').toISOString()).toBe(start.toISOString());
        expect(start.timeZone('Asia/Tokyo').toISOString()).toBe(start.toISOString());
        expect(start.toISOString()).toBe('2026-12-08T22:00:00.120Z');
    });

    it('matches native Date precision for sub-millisecond instants on either side of the epoch', () => {
        const dates = [
            ['2026-12-08T22:00:00.123456789Z', '2026-12-08T22:00:00.123Z'],
            ['1969-12-31T23:59:59.999999999Z', '1969-12-31T23:59:59.999Z'],
        ];

        for (const [input, expected] of dates) {
            const date = atemporal(atemporal.instant(input).toZonedDateTimeISO('UTC'));

            expect(date.toISOString()).toBe(expected);
            expect(date.toISOString()).toBe(date.toDate().toISOString());
        }
    });

    it('sorts UTC strings chronologically across offsets and fractional seconds', () => {
        const dates = [
            atemporal('2026-12-08T18:00:00-04:00'),
            atemporal('2026-12-08T22:00:00.001Z'),
            atemporal('2026-12-08T23:00:00+02:00'),
        ];

        expect(dates.map(date => date.toISOString()).sort()).toEqual([
            '2026-12-08T21:00:00.000Z',
            '2026-12-08T22:00:00.000Z',
            '2026-12-08T22:00:00.001Z',
        ]);
    });

    it('uses the applicable DST offset when converting local time to UTC', () => {
        const winter = atemporal('2026-01-15T18:00:00', 'America/New_York');
        const summer = atemporal('2026-07-15T18:00:00', 'America/New_York');

        expect(winter.toISOString()).toBe('2026-01-15T23:00:00.000Z');
        expect(summer.toISOString()).toBe('2026-07-15T22:00:00.000Z');
    });

    it('throws RangeError for invalid instances, matching native Date.toISOString()', () => {
        const invalid = atemporal('not a date');

        expect(() => invalid.toISOString()).toThrow(RangeError);
        expect(invalid.toString()).toBe('Invalid Date');
    });
});
