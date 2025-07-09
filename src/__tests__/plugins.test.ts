import atemporal from '../index';
import customParseFormat from '../plugins/customParseFormat';
import relativeTime from '../plugins/relativeTime';

// Extend once for all tests in this file
atemporal.extend(customParseFormat);
atemporal.extend(relativeTime);

describe('Atemporal Plugins', () => {

    describe('customParseFormat', () => {
        it('should parse a date with a custom format', () => {
            const date = atemporal.fromFormat('15/03/2025 10:30', 'DD/MM/YYYY HH:mm');
            expect(date.isValid()).toBe(true);
            expect(date.year).toBe(2025);
            expect(date.month).toBe(3);
            expect(date.hour).toBe(10);
        });

        it('should return an invalid instance for a mismatched format', () => {
            const date = atemporal.fromFormat('2025-03-15', 'DD/MM/YYYY');
            expect(date.isValid()).toBe(false);
        });
    });

    describe('relativeTime', () => {
        it('should return relative time from now', () => {
            const twoHoursAgo = atemporal().subtract(2, 'hour');
            expect(twoHoursAgo.fromNow()).toBe('2 hours ago');
        });

        it('should return relative time without a suffix', () => {
            const inThreeDays = atemporal().add(3, 'day');
            expect(inThreeDays.fromNow(true)).toBe('3 days');
        });
    });
});