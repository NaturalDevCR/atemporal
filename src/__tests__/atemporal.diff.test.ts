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

    it('should return NaN for an invalid instance', () => {
        expect(invalid.diff(d1)).toBeNaN();
    });

    it('should return NaN when comparing against an invalid date', () => {
        expect(d1.diff('not a date')).toBeNaN();
    });
});