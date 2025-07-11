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
});