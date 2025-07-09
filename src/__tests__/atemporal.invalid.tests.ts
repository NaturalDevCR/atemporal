import atemporal from '../index';

describe('Atemporal: Robustness and Invalid Inputs', () => {

    it('should identify an invalid date string and return an invalid instance', () => {
        const invalidDate = atemporal('this is not a date');
        expect(invalidDate.isValid()).toBe(false);
    });

    it('should return "Invalid Date" when formatting an invalid instance', () => {
        const invalidDate = atemporal('2024-99-99');
        expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
    });

    it('all manipulation methods on an invalid instance should return the same invalid instance', () => {
        // Create an invalid instance using a known unparseable string.
        const invalidDate = atemporal('not a date');
        const manipulated = invalidDate.add(5, 'day').subtract(2, 'hour').startOf('month');

        expect(manipulated.isValid()).toBe(false);
        // Ensure it returns the same instance for chaining, preserving the invalid state.
        expect(manipulated).toBe(invalidDate);
    });

    it('should correctly handle adding a month to the end of a long month', () => {
        // January 31st + 1 month should result in the last day of February
        const date = atemporal('2023-01-31').add(1, 'month');
        expect(date.format('YYYY-MM-DD')).toBe('2023-02-28');
    });
});