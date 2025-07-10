import atemporal from '../index';

describe('Comparison Methods', () => {
    const d1 = atemporal('2024-01-10T12:00:00Z');
    const d2 = atemporal('2024-01-10T12:00:00Z');
    const d3 = atemporal('2024-01-15T12:00:00Z'); // after d1
    const invalidDate = atemporal('invalid date');

    describe('.isSameOrBefore()', () => {
        it('should be true for the same date', () => {
            expect(d1.isSameOrBefore(d2)).toBe(true);
        });

        it('should be true for a date that is after', () => {
            expect(d1.isSameOrBefore(d3)).toBe(true);
        });

        it('should be false for a date that is before', () => {
            expect(d3.isSameOrBefore(d1)).toBe(false);
        });

        it('should handle different date input types', () => {
            expect(d1.isSameOrBefore('2024-01-10T12:00:00Z')).toBe(true);
            expect(d1.isSameOrBefore(new Date('2024-01-15T12:00:00Z'))).toBe(true);
        });

        it('should return false for an invalid instance', () => {
            expect(invalidDate.isSameOrBefore(d1)).toBe(false);
        });

        it('should return false when comparing against an invalid date', () => {
            expect(d1.isSameOrBefore('not a date')).toBe(false);
        });
    });

    describe('.isSameOrAfter()', () => {
        it('should be true for the same date', () => {
            expect(d1.isSameOrAfter(d2)).toBe(true);
        });

        it('should be true for a date that is before', () => {
            expect(d3.isSameOrAfter(d1)).toBe(true);
        });

        it('should be false for a date that is after', () => {
            expect(d1.isSameOrAfter(d3)).toBe(false);
        });

        it('should handle different date input types', () => {
            expect(d1.isSameOrAfter('2024-01-10T12:00:00Z')).toBe(true);
            expect(d3.isSameOrAfter(new Date('2024-01-01T12:00:00Z'))).toBe(true);
        });

        it('should return false for an invalid instance', () => {
            expect(invalidDate.isSameOrAfter(d1)).toBe(false);
        });

        it('should return false when comparing against an invalid date', () => {
            expect(d1.isSameOrAfter('not a date')).toBe(false);
        });
    });

    // Also test the refined `isSame` method to improve coverage
    describe('.isSame() with units', () => {
        const date1 = atemporal('2024-03-15T10:30:45Z');
        const date2 = atemporal('2024-03-15T11:00:00Z'); // Same day
        const date3 = atemporal('2024-04-15T10:30:45Z'); // Same year, different month
        const date4 = atemporal('2025-03-15T10:30:45Z'); // Different year

        it('should be true for the same day', () => {
            expect(date1.isSame(date2, 'day')).toBe(true);
        });

        it('should be true for the same month', () => {
            expect(date1.isSame(date2, 'month')).toBe(true);
        });

        it('should be false for different months', () => {
            expect(date1.isSame(date3, 'month')).toBe(false);
        });

        it('should be true for the same year', () => {
            expect(date1.isSame(date3, 'year')).toBe(true);
        });

        it('should be false for different years', () => {
            expect(date1.isSame(date4, 'year')).toBe(false);
        });
    });
    describe('isSame() default case and invalid comparison', () => {
        const d1 = atemporal('2024-01-10T12:00:00.500Z');
        const d2 = atemporal('2024-01-10T12:00:00.500Z');
        const d3 = atemporal('2024-01-10T12:00:00.501Z');

        it('should compare to the millisecond by default', () => {
            expect(d1.isSame(d2)).toBe(true);
            expect(d1.isSame(d3)).toBe(false);
        });

        it('should return false when comparing against an invalid date', () => {
            expect(d1.isSame('not a date')).toBe(false);
        });
    });

    describe('isLeapYear()', () => {
        it('should return true for a leap year', () => {
            expect(atemporal('2024-01-01').isLeapYear()).toBe(true);
            expect(atemporal('2000-01-01').isLeapYear()).toBe(true);
        });

        it('should return false for a non-leap year', () => {
            expect(atemporal('2023-01-01').isLeapYear()).toBe(false);
            expect(atemporal('2100-01-01').isLeapYear()).toBe(false);
        });

        it('should return false for an invalid instance', () => {
            expect(atemporal('invalid').isLeapYear()).toBe(false);
        });
    });

    describe('Comparison methods with invalid inputs (for catch blocks)', () => {
        const validDate = atemporal();
        it('.isBefore should return false for invalid comparison date', () => {
            expect(validDate.isBefore('garbage')).toBe(false);
        });
        it('.isAfter should return false for invalid comparison date', () => {
            expect(validDate.isAfter('garbage')).toBe(false);
        });
        it('.isBetween should return false for invalid comparison date', () => {
            expect(validDate.isBetween('garbage', atemporal().add(1, 'day'))).toBe(false);
            expect(validDate.isBetween(atemporal().subtract(1, 'day'), 'garbage')).toBe(false);
        });
        it('.isSameDay should return false for invalid comparison date', () => {
            expect(validDate.isSameDay('garbage')).toBe(false);
        });
    });
});