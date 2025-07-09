import atemporal from '../index';

describe('Atemporal: Unix Timestamps and Milliseconds', () => {
    // Known timestamp from Day.js docs for easy comparison
    const msTimestamp = 1318781876406; // Corresponds to 2011-10-16T16:17:56.406Z
    const sTimestamp = 1318781876;    // Corresponds to 2011-10-16T16:17:56.000Z

    describe('Parsing from Milliseconds', () => {
        it('should create an instance from a millisecond timestamp passed to the main function', () => {
            const date = atemporal(msTimestamp);
            expect(date.isValid()).toBe(true);
            expect(date.toString()).toBe('2011-10-16T16:17:56.406Z');
        });
    });

    describe('Parsing from Seconds with .unix()', () => {
        it('should create an instance from a Unix timestamp in seconds using .unix()', () => {
            const date = atemporal.unix(sTimestamp);
            expect(date.isValid()).toBe(true);
            expect(date.toString()).toBe('2011-10-16T16:17:56Z');
        });

        it('.unix(seconds) should produce the same result as atemporal(milliseconds)', () => {
            const fromSeconds = atemporal.unix(sTimestamp);
            const fromMilliseconds = atemporal(sTimestamp * 1000);

            expect(fromSeconds.isSame(fromMilliseconds)).toBe(true);
            expect(fromSeconds.toString()).toEqual(fromMilliseconds.toString());
        });
    });

    describe('Edge Cases', () => {
        it('should correctly handle a timestamp of 0 for both methods', () => {
            const epochFromMs = atemporal(0);
            const epochFromS = atemporal.unix(0);

            expect(epochFromMs.toString()).toBe('1970-01-01T00:00:00Z');
            expect(epochFromS.toString()).toBe('1970-01-01T00:00:00Z');
        });

        it('should correctly handle negative timestamps for dates before 1970', () => {
            // Corresponds to 1969-12-31T00:00:00Z
            const negativeSeconds = -86400;
            const date = atemporal.unix(negativeSeconds);

            expect(date.year).toBe(1969);
            expect(date.month).toBe(12);
            expect(date.day).toBe(31);
            expect(date.toString()).toBe('1969-12-31T00:00:00Z');
        });

        it('should handle floating point numbers correctly in .unix()', () => {
            // 1.5 seconds after the epoch
            const date = atemporal.unix(1.5);
            expect(date.toString()).toBe('1970-01-01T00:00:01.500Z');
            expect(date.millisecond).toBe(500);
        });
    });
});