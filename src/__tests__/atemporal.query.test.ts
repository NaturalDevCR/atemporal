import atemporal from '../index';

describe('Query Methods', () => {
    describe('.daysInMonth', () => {
        it('should return the correct number of days for a 31-day month', () => {
            expect(atemporal('2023-12-10').daysInMonth).toBe(31);
        });

        it('should return the correct number of days for a 30-day month', () => {
            expect(atemporal('2023-11-20').daysInMonth).toBe(30);
        });

        it('should return 29 for February in a leap year', () => {
            expect(atemporal('2024-02-15').daysInMonth).toBe(29);
        });

        it('should return 28 for February in a non-leap year', () => {
            expect(atemporal('2023-02-05').daysInMonth).toBe(28);
        });

        it('should return NaN for an invalid atemporal instance', () => {
            expect(atemporal('invalid date').daysInMonth).toBeNaN();
        });
    });

    describe('.dayOfWeek()', () => {
        const wednesday = atemporal('2024-08-14'); // This is a Wednesday (day 3)

        it('should move to a future day in the same week', () => {
            const friday = wednesday.dayOfWeek(5); // 5 is Friday
            expect(friday.format('YYYY-MM-DD')).toBe('2024-08-16');
        });

        it('should move to a past day in the same week', () => {
            const monday = wednesday.dayOfWeek(1); // 1 is Monday
            expect(monday.format('YYYY-MM-DD')).toBe('2024-08-12');
        });

        it('should return a clone of the same day if the day is the same', () => {
            const sameWednesday = wednesday.dayOfWeek(3);
            expect(sameWednesday.format('YYYY-MM-DD')).toBe('2024-08-14');
            // Check for immutability
            expect(sameWednesday).not.toBe(wednesday);
        });

        it('should handle the end of the week (Sunday)', () => {
            const sunday = wednesday.dayOfWeek(7); // 7 is Sunday
            expect(sunday.format('YYYY-MM-DD')).toBe('2024-08-18');
        });

        it('should return the same instance if the input day is invalid', () => {
            const invalidDay0 = wednesday.dayOfWeek(0);
            const invalidDay8 = wednesday.dayOfWeek(8);
            expect(invalidDay0).toBe(wednesday);
            expect(invalidDay8).toBe(wednesday);
        });

        it('should return the same instance if the atemporal object is invalid', () => {
            const invalidAtemporal = atemporal('invalid date');
            const result = invalidAtemporal.dayOfWeek(5);
            expect(result).toBe(invalidAtemporal);
        });
    });
});