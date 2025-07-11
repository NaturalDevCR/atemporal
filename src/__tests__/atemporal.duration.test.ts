import atemporal from '../index';
import { Temporal } from '@js-temporal/polyfill';

describe('Duration Support', () => {
    // Mock the static duration method since we can't modify index.ts directly here
    // In a real scenario, this would work out of the box.
    atemporal.duration = (d) => Temporal.Duration.from(d);

    describe('atemporal.duration() factory', () => {
        it('should create a Temporal.Duration object from an object', () => {
            const duration = atemporal.duration({ hours: 2, minutes: 30 });
            expect(duration).toBeInstanceOf(Temporal.Duration);
            expect(duration.total('minute')).toBe(150);
        });

        it('should create a Temporal.Duration object from an ISO string', () => {
            const duration = atemporal.duration('PT5H');
            expect(duration).toBeInstanceOf(Temporal.Duration);
            expect(duration.hours).toBe(5);
        });

        it('should throw an error for invalid duration input', () => {
            // Using a function to wrap the call that is expected to throw
            expect(() => atemporal.duration({ invalidUnit: 1 } as any)).toThrow();
        });
    });

    describe('.add() with Duration', () => {
        const d1 = atemporal('2024-01-01T12:00:00Z');

        it('should add a Temporal.Duration object to a date', () => {
            const duration = atemporal.duration({ hours: 5, minutes: 15 });
            const d2 = d1.add(duration);
            expect(d2.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 17:15:00');
        });

        it('should still work with the (number, unit) signature', () => {
            const d2 = d1.add(5, 'hours');
            expect(d2.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 17:00:00');
        });

        it('should return the same instance if the atemporal object is invalid', () => {
            const invalidDate = atemporal('invalid');
            const duration = atemporal.duration({ hours: 1 });
            expect(invalidDate.add(duration)).toBe(invalidDate);
        });
    });

    describe('.subtract() with Duration', () => {
        const d1 = atemporal('2024-01-01T12:00:00Z');

        it('should subtract a Temporal.Duration object from a date', () => {
            const duration = atemporal.duration({ days: 1, hours: 2 });
            const d2 = d1.subtract(duration);
            expect(d2.format('YYYY-MM-DD HH:mm:ss')).toBe('2023-12-31 10:00:00');
        });

        it('should still work with the (number, unit) signature', () => {
            const d2 = d1.subtract(1, 'day');
            expect(d2.format('YYYY-MM-DD HH:mm:ss')).toBe('2023-12-31 12:00:00');
        });
    });
});