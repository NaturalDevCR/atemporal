import atemporal from '../index';
import relativeTimePlugin from '../plugins/relativeTime';

// Extend atemporal with the plugin once for all tests in this file.
atemporal.extend(relativeTimePlugin);

describe('relativeTime plugin', () => {
    // Define a fixed point in time to be "now" for all tests.
    const MOCK_NOW_ISO = '2023-10-27T10:00:00Z';
    const now = atemporal(MOCK_NOW_ISO);

    // Before each test, mock the system time.
    // This ensures that any call to `atemporal()` inside the plugin returns our fixed time.
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date(MOCK_NOW_ISO));
        // Set a consistent locale for predictable output.
        atemporal.setDefaultLocale('en-US');
    });

    // After each test, restore the real timers.
    afterEach(() => {
        jest.useRealTimers();
    });

    describe('fromNow()', () => {
        it('should handle past times correctly', () => {
            expect(now.subtract(5, 'second').fromNow()).toBe('5 seconds ago');
            expect(now.subtract(1, 'minute').fromNow()).toBe('1 minute ago');
            expect(now.subtract(10, 'minute').fromNow()).toBe('10 minutes ago');
            expect(now.subtract(1, 'hour').fromNow()).toBe('1 hour ago');
            expect(now.subtract(3, 'hour').fromNow()).toBe('3 hours ago');
            expect(now.subtract(1, 'day').fromNow()).toBe('yesterday');
            expect(now.subtract(5, 'day').fromNow()).toBe('5 days ago');
            expect(now.subtract(1, 'month').fromNow()).toBe('last month');
            expect(now.subtract(4, 'month').fromNow()).toBe('4 months ago');
            expect(now.subtract(1, 'year').fromNow()).toBe('last year');
            expect(now.subtract(2, 'year').fromNow()).toBe('2 years ago');
        });

        it('should handle future times correctly', () => {
            expect(now.add(5, 'second').fromNow()).toBe('in 5 seconds');
            expect(now.add(1, 'minute').fromNow()).toBe('in 1 minute');
            expect(now.add(1, 'hour').fromNow()).toBe('in 1 hour');
            expect(now.add(1, 'day').fromNow()).toBe('tomorrow');
            expect(now.add(4, 'month').fromNow()).toBe('in 4 months');
            expect(now.add(2, 'year').fromNow()).toBe('in 2 years');
        });

        it('should remove suffix for past times when withoutSuffix is true', () => {
            expect(now.subtract(15, 'minute').fromNow(true)).toBe('15 minutes');
            expect(now.subtract(2, 'day').fromNow(true)).toBe('2 days');
        });

        it('should remove suffix for future times when withoutSuffix is true', () => {
            expect(now.add(15, 'minute').fromNow(true)).toBe('15 minutes');
            expect(now.add(2, 'day').fromNow(true)).toBe('2 days');
        });

        it('should return "Invalid Date" for an invalid instance', () => {
            const invalidDate = atemporal('not a real date');
            expect(invalidDate.fromNow()).toBe('Invalid Date');
        });
    });

    describe('toNow()', () => {
        it('should handle past times correctly (inverse of fromNow)', () => {
            expect(now.subtract(5, 'second').toNow()).toBe('in 5 seconds');
            expect(now.subtract(1, 'minute').toNow()).toBe('in 1 minute');
            expect(now.subtract(3, 'hour').toNow()).toBe('in 3 hours');
            expect(now.subtract(1, 'day').toNow()).toBe('tomorrow');
            expect(now.subtract(2, 'year').toNow()).toBe('in 2 years');
        });

        it('should handle future times correctly (inverse of fromNow)', () => {
            expect(now.add(5, 'second').toNow()).toBe('5 seconds ago');
            expect(now.add(1, 'minute').toNow()).toBe('1 minute ago');
            expect(now.add(1, 'hour').toNow()).toBe('1 hour ago');
            expect(now.add(1, 'day').toNow()).toBe('yesterday');
            expect(now.add(2, 'year').toNow()).toBe('2 years ago');
        });

        it('should remove suffix for past times when withoutSuffix is true', () => {
            expect(now.subtract(15, 'minute').toNow(true)).toBe('15 minutes');
        });

        it('should remove suffix for future times when withoutSuffix is true', () => {
            expect(now.add(15, 'minute').toNow(true)).toBe('15 minutes');
        });

        it('should return "Invalid Date" for an invalid instance', () => {
            const invalidDate = atemporal('not a real date');
            expect(invalidDate.toNow()).toBe('Invalid Date');
        });
    });
});