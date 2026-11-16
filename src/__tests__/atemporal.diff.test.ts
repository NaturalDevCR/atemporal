import atemporal from '../index';

describe('Difference Method (.diff)', () => {
    const d1 = atemporal('2024-01-01T12:00:00Z');
    const d2 = atemporal('2024-01-02T18:00:00Z'); // 30 hours later
    const invalid = atemporal('invalid');

    it('should calculate the difference in milliseconds by default', () => {
        // 30 hours * 60 mins * 60 secs * 1000 ms
        expect(d2.diff(d1)).toBe(30 * 60 * 60 * 1000);
    });

    it('should return a truncated integer by default', () => {
        expect(d2.diff(d1, 'day')).toBe(1);
        expect(d2.diff(d1, 'hour')).toBe(30);
    });

    it('should return a floating-point number when requested', () => {
        expect(d2.diff(d1, 'day', true)).toBe(1.25);
        expect(d1.diff(d2, 'hour', true)).toBe(-30);
    });

    it('should handle various units', () => {
        const d3 = atemporal('2025-02-01T12:00:00Z');
        expect(d3.diff(d1, 'year')).toBe(1);
        expect(d3.diff(d1, 'month')).toBe(13);
    });

    it.each([
        ['2023-03-01T00:00:00Z', '2023-02-01T00:00:00Z', 'month', 1],
        ['2024-03-01T00:00:00Z', '2024-02-01T00:00:00Z', 'months', 1],
        ['2023-02-01T00:00:00Z', '2023-04-01T00:00:00Z', 'month', -2],
        ['2023-02-28T00:00:00Z', '2023-01-31T00:00:00Z', 'month', 1],
        ['2024-01-01T00:00:00Z', '2023-01-01T00:00:00Z', 'year', 1],
        ['2025-01-01T00:00:00Z', '2024-01-01T00:00:00Z', 'years', 1],
        ['2023-01-01T00:00:00Z', '2024-01-01T00:00:00Z', 'year', -1],
    ] as const)('should measure %s minus %s in %s as %s', (end, start, unit, expected) => {
        const date = atemporal(end);
        expect(date.diff(start, unit)).toBe(expected);
        expect(date.diff(start, unit, true)).toBe(expected);
    });

    it('should preserve whole months and the remaining fractional month', () => {
        const end = atemporal('1995-04-25T10:00:00Z');
        const start = '1995-01-24T16:00:00Z';

        expect(end.diff(start, 'month')).toBe(3);
        // Three months to April 24, then 18 hours out of a 30-day month.
        expect(end.diff(start, 'month', true)).toBeCloseTo(3.025, 12);
    });

    it.each([
        ['2024-03-10', '2024-03-11', 23],
        ['2024-11-03', '2024-11-04', 25],
    ])('should count a calendar day across the DST transition on %s', (start, end, hours) => {
        const from = atemporal(`${start}T00:00:00`, 'America/New_York');
        const to = atemporal(`${end}T00:00:00`, 'America/New_York');

        expect(to.diff(from, 'hour', true)).toBe(hours);
        expect(to.diff(from, 'day')).toBe(1);
        expect(to.diff(from, 'day', true)).toBe(1);
        expect(from.diff(to, 'day', true)).toBe(-1);
    });

    it('should count calendar weeks across DST rather than fixed seven-day intervals', () => {
        const start = atemporal('2024-03-09T00:00:00', 'America/New_York');
        const end = start.add(1, 'week');

        expect(end.diff(start, 'hour', true)).toBe(167);
        expect(end.diff(start, 'week')).toBe(1);
        expect(end.diff(start, 'weeks', true)).toBe(1);
        expect(start.diff(end, 'week', true)).toBe(-1);
    });

    it('should return NaN for an invalid instance', () => {
        expect(invalid.diff(d1)).toBeNaN();
    });

    it('should return NaN when comparing against an invalid date', () => {
        expect(d1.diff('not a date')).toBeNaN();
    });
});
