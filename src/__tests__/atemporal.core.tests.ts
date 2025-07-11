import atemporal from '../index';

describe('Atemporal: Core Manipulation and Comparison', () => {
    const date1 = atemporal('2024-02-15T10:30:00Z'); // Not a leap year
    const date2 = atemporal('2020-02-29T12:00:00Z'); // A leap year

    // 1. Test Manipulation Methods (set, startOf, endOf)
    describe('Manipulation', () => {
        it('should set a unit to a new value', () => {
            const newDate = date1.set('year', 2025);
            expect(newDate.year).toBe(2025);
            expect(newDate.format('YYYY-MM-DD')).toBe('2025-02-15');
        });

        it('should find the start of the month', () => {
            const startOfMonth = date1.startOf('month');
            expect(startOfMonth.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-02-01 00:00:00');
        });

        it('should find the end of the week (Sunday)', () => {
            // 2024-02-15 is a Thursday. Week starts Monday. End of week is Sunday 2024-02-18.
            const endOfWeek = date1.endOf('week');
            expect(endOfWeek.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-02-18 23:59:59.999');
        });
    });

    // 2. Test Comparison Methods (isSame, isBetween, isLeapYear)
    describe('Comparison', () => {
        it('should check if two dates are the same day', () => {
            const sameDay = atemporal('2024-02-15T23:59:59Z');
            expect(date1.isSame(sameDay, 'day')).toBe(true);
            expect(date1.isSameDay(sameDay)).toBe(true);
        });

        it('should check if a date is between two others', () => {
            const start = atemporal('2024-01-01');
            const end = atemporal('2024-03-01');
            expect(date1.isBetween(start, end)).toBe(true);
            expect(date1.isBetween(date1, end, '()')).toBe(false); // Exclusive check
        });

        it('should correctly identify a leap year', () => {
            const nonLeapYearDate = atemporal('2023-01-01'); // 2023 is not a leap year.

            // Correct the assertion: 2024 IS a leap year.
            expect(date1.isLeapYear()).toBe(true);
            // This assertion was already correct: 2020 IS a leap year.
            expect(date2.isLeapYear()).toBe(true);
            // Add a new assertion for a non-leap year to be thorough.
            expect(nonLeapYearDate.isLeapYear()).toBe(false);
        });
    });

    // 3. Test Utility Methods (diff, get, format with options)
    describe('Utilities', () => {
        it('should format using the timezone name token (z)', () => {
            const nyDate = atemporal('2024-01-01T12:00:00', 'America/New_York');
            const tokyoDate = atemporal('2024-01-01T12:00:00', 'Asia/Tokyo');

            // Test the 'z' token directly to confirm it works.
            expect(tokyoDate.format('z')).toBe('Asia/Tokyo');

            // Test the 'z' token as part of a larger string.
            // Note that we use the 'z' token without brackets to get it replaced.
            expect(nyDate.format('YYYY-MM-DD HH:mm z')).toBe('2024-01-01 12:00 America/New_York');
        });

        it('should calculate the difference between two dates', () => {
            const futureDate = date1.add(3, 'day');
            expect(futureDate.diff(date1, 'day')).toBe(3);
            expect(futureDate.diff(date1, 'hour')).toBe(72);
        });

        it('should get a specific unit value', () => {
            expect(date1.get('month')).toBe(2);
            expect(date1.get('hour')).toBe(10);
        });

        it('should format using Intl.DateTimeFormatOptions', () => {
            const formatted = date1.format({ dateStyle: 'full', timeStyle: 'short' }, 'en-US');
            // The exact output can vary slightly by Node version, so we check for containment.
            expect(formatted).toContain('Thursday, February 15, 2024');
        });
    });

    // 4. Test Error Handling and Edge Cases
    describe('Error Handling', () => {
        it('should throw an error for an invalid timezone', () => {
            expect(() => {
                atemporal.setDefaultTimeZone('Mars/Olympus_Mons');
            }).toThrow('Invalid time zone: Mars/Olympus_Mons');
        });

        it('should throw when accessing .datetime on an invalid instance', () => {
            const invalidDate = atemporal('invalid');
            expect(() => {
                // This tests the error boundary within the `datetime` getter.
                const dt = invalidDate.datetime;
            }).toThrow('Cannot perform operations on an invalid Atemporal object.');
        });
    });

    describe('Generic .get() and .set() for special units', () => {
        const date = atemporal('2024-05-20'); // Q2

        it('should get quarter using the generic get() method', () => {
            expect(date.get('quarter')).toBe(2);
        });

        it('should set quarter using the generic set() method', () => {
            // Test setting to a new quarter
            const startOfQ4 = date.set('quarter', 4);
            expect(startOfQ4.format('YYYY-MM-DD')).toBe('2024-10-01');

            // Test setting to the same quarter
            const startOfQ2 = date.set('quarter', 2);
            expect(startOfQ2.format('YYYY-MM-DD')).toBe('2024-04-01');
        });
    });

    describe('Manipulation with unit aliases', () => {
        const baseDate = atemporal('2024-01-10T10:00:00Z');

        it('should handle singular, plural, and short-hand units for .add()', () => {
            // Targets: All unit aliases in `getDurationUnit` in TemporalWrapper.ts
            // Year
            expect(baseDate.add(1, 'y').year).toBe(2025);
            expect(baseDate.add(1, 'year').year).toBe(2025);
            expect(baseDate.add(1, 'years').year).toBe(2025);

            // Day
            expect(baseDate.add(2, 'd').day).toBe(12);
            expect(baseDate.add(2, 'day').day).toBe(12);
            expect(baseDate.add(2, 'days').day).toBe(12);

            // Hour
            expect(baseDate.add(3, 'h').hour).toBe(13);
            expect(baseDate.add(3, 'hour').hour).toBe(13);
            expect(baseDate.add(3, 'hours').hour).toBe(13);

            // Minute
            expect(baseDate.add(10, 'm').minute).toBe(10);
            expect(baseDate.add(10, 'minute').minute).toBe(10);
            expect(baseDate.add(10, 'minutes').minute).toBe(10);

            // Millisecond
            expect(baseDate.add(100, 'ms').millisecond).toBe(100);
        });

        it('should handle singular, plural, and short-hand units for .subtract()', () => {
            // Targets: Remaining unit aliases in `getDurationUnit`
            // Week
            expect(baseDate.subtract(1, 'w').day).toBe(3);
            expect(baseDate.subtract(1, 'week').day).toBe(3);
            expect(baseDate.subtract(1, 'weeks').day).toBe(3);

            // Second
            const d = baseDate.set('second', 30);
            expect(d.subtract(10, 's').second).toBe(20);
            expect(d.subtract(10, 'second').second).toBe(20);
            expect(d.subtract(10, 'seconds').second).toBe(20);
        });
    });
});
