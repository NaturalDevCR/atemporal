import atemporal from '../index';
import { InvalidTimeZoneError, InvalidAtemporalInstanceError } from '../errors';

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
            }).toThrow(InvalidTimeZoneError);
        });

        it('should throw when accessing .datetime on an invalid instance', () => {
            const invalidDate = atemporal('invalid');
            expect(() => {
                // This tests the error boundary within the `datetime` getter.
                const dt = invalidDate.datetime;
            }).toThrow(InvalidAtemporalInstanceError);
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

    describe('Atemporal: Creation from various inputs', () => {
        it('should create a date from an array of numbers [Y, M, D]', () => {
            const date = atemporal([2024, 8, 15]);
            expect(date.isValid()).toBe(true);
            expect(date.format('YYYY-MM-DD')).toBe('2024-08-15');
        });

        it('should create a date and time from a full array', () => {
            const date = atemporal([2024, 8, 15, 10, 30, 25]);
            expect(date.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-08-15 10:30:25');
        });

        it('should create a date from a plain object {year, month, day}', () => {
            const date = atemporal({ year: 2023, month: 11, day: 20 });
            expect(date.isValid()).toBe(true);
            expect(date.format('YYYY-MM-DD')).toBe('2023-11-20');
        });

        it('should create a date and time from a plain object', () => {
            const date = atemporal({ year: 2023, month: 11, day: 20, hour: 22, minute: 5 });
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2023-11-20 22:05');
        });

        it('should respect the timezone when creating from an object', () => {
            const date = atemporal({ year: 2024, month: 1, day: 1 }, 'America/New_York');
            expect(date.timeZoneName).toBe('America/New_York');
        });

        it('should handle invalid array/object inputs gracefully by creating an invalid instance', () => {
            const invalidDateObj = atemporal({ year: 2024, month: 13, day: 1 });
            expect(invalidDateObj.isValid()).toBe(false);

            const invalidDateArr = atemporal([2024, 2, 30]); // February 30th does not exist
            expect(invalidDateArr.isValid()).toBe(false);
        });
    });
    // --- NUEVA SECCIÓN DE TESTS PARA EL FORMATEO ---
    describe('Formatting with Day.js-compatible tokens', () => {
        const date = atemporal('2024-07-04T15:08:09.123Z'); // Thursday, 3:08 PM

        it('should format year, month, and day tokens (YYYY, YY, MMMM, MMM, MM, M, DD, D)', () => {
            expect(date.format('YYYY')).toBe('2024');
            expect(date.format('YY')).toBe('24');
            expect(date.format('MMMM')).toBe('July');
            expect(date.format('MMM')).toBe('Jul');
            expect(date.format('MM')).toBe('07');
            expect(date.format('M')).toBe('7');
            expect(date.format('DD')).toBe('04');
            expect(date.format('D')).toBe('4');
        });

        it('should format day of the week tokens (dddd, ddd, dd, d)', () => {
            // Note: 2024-07-04 is a Thursday.
            // Temporal's dayOfWeek is 4. Sunday (day 7) % 7 = 0. Thursday (day 4) % 7 = 4.
            expect(date.format('dddd')).toBe('Thursday');
            expect(date.format('ddd')).toBe('Thu');
            // expect(date.format('dd', 'en-US')).toBe('Th'); // 'narrow' can vary slightly by locale data
            const narrowDay = date.format('dd', 'en-US');
            expect(['T', 'Th']).toContain(narrowDay);
            expect(date.format('d')).toBe('4');
        });

        it('should format hour tokens (HH, H, hh, h)', () => {
            const pmDate = atemporal('2024-01-01T14:00:00Z'); // 2 PM
            const amDate = atemporal('2024-01-01T08:00:00Z'); // 8 AM
            const noonDate = atemporal('2024-01-01T12:00:00Z'); // 12 PM
            const midnightDate = atemporal('2024-01-01T00:00:00Z'); // 12 AM

            expect(pmDate.format('HH')).toBe('14');
            expect(pmDate.format('H')).toBe('14');
            expect(pmDate.format('hh')).toBe('02');
            expect(pmDate.format('h')).toBe('2');

            expect(amDate.format('hh')).toBe('08');
            expect(amDate.format('h')).toBe('8');

            expect(noonDate.format('h')).toBe('12'); // Correctly handles 12 PM
            expect(midnightDate.format('h')).toBe('12'); // Correctly handles 12 AM
        });

        it('should format minute, second, and millisecond tokens (mm, m, ss, s, SSS)', () => {
            expect(date.format('mm')).toBe('08');
            expect(date.format('m')).toBe('8');
            expect(date.format('ss')).toBe('09');
            expect(date.format('s')).toBe('9');
            expect(date.format('SSS')).toBe('123');
        });

        it('should format AM/PM tokens (A, a)', () => {
            const pmDate = atemporal('2024-01-01T13:00:00Z');
            const amDate = atemporal('2024-01-01T09:00:00Z');

            expect(pmDate.format('A')).toBe('PM');
            expect(pmDate.format('a')).toBe('pm');
            expect(amDate.format('A')).toBe('AM');
            expect(amDate.format('a')).toBe('am');
        });

        it('should handle a complex format string with mixed tokens', () => {
            const complexFormat = 'dddd, MMMM D, YYYY [at] h:mm:ss a (z)';
            const expected = 'Thursday, July 4, 2024 at 3:08:09 pm (UTC)';
            expect(date.format(complexFormat)).toBe(expected);
        });
    });

    describe('Atemporal: Core Time Zone Functionality', () => {

        afterEach(() => {
            atemporal.setDefaultTimeZone('UTC');
        });

        it('should format basic timezone tokens (z, Z, ZZ)', () => {
            const nyDate = atemporal('2024-01-15T10:00:00', 'America/New_York'); // EST is -05:00
            expect(nyDate.format('z')).toBe('America/New_York'); // IANA ID
            expect(nyDate.format('Z')).toBe('-05:00'); // Offset with colon
            expect(nyDate.format('ZZ')).toBe('-0500'); // Offset without colon
        });

        it('should correctly handle timezone transitions (Daylight Saving Time)', () => {
            const beforeDST = atemporal('2024-11-03T01:00:00-04:00', 'America/New_York');
            const afterDST = beforeDST.add(1, 'hour');
            expect(afterDST.format('HH:mm Z')).toBe('01:00 -05:00');
        });

        it('should parse an ISO string with offset and preserve it', () => {
            const isoStringWithOffset = '2024-05-15T10:00:00+08:00';
            const date = atemporal(isoStringWithOffset);
            expect(date.isValid()).toBe(true);
            expect(date.format('Z')).toBe('+08:00');
            expect(date.toString()).toBe('2024-05-15T10:00:00+08:00');
        });

        it('should correctly change timezone with .timeZone()', () => {
            const utcDate = atemporal('2024-01-01T00:00:00.000Z');
            const saoPauloDate = utcDate.timeZone('America/Sao_Paulo');
            expect(saoPauloDate.hour).toBe(21);
            expect(saoPauloDate.format('Z')).toBe('-03:00');
        });

        it('should allow setting and using a default time zone', () => {
            atemporal.setDefaultTimeZone('Asia/Tokyo');
            const nowInTokyo = atemporal();
            expect(nowInTokyo.raw.timeZoneId).toBe('Asia/Tokyo');
        });
    });
    describe('Core Method Branch Coverage', () => {
        it('should cover the original startOf("week") implementation', () => {
            // This test ensures the original implementation in TemporalWrapper is covered,
            // as the weekDay plugin overrides it. This test should NOT import weekDay.
            // 2024-02-15 is a Thursday (day 4). The original logic subtracts dayOfWeek - 1.
            // 4 - 1 = 3 days. 15 - 3 = 12. So it should be Monday the 12th.
            const date = atemporal('2024-02-15T12:00:00Z');
            const startOfWeek = date.startOf('week');
            expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-02-12');
        });

        it('should handle setting an invalid quarter', () => {
            // This covers the `if (quarter < 1 || quarter > 4)` branch in the quarter() method.
            const date = atemporal('2024-05-20');
            const invalidQuarter = date.quarter(5);
            // Should return the original instance unmodified
            expect(invalidQuarter).toBe(date);
        });

        it('should handle month aliases for add/subtract', () => {
            const date = atemporal('2024-01-15');
            expect(date.add(1, 'month').month).toBe(2);
            expect(date.add(1, 'months').month).toBe(2);
        });
    });
    describe('Atemporal: Immutability Guarantees', () => {
        it('should remain immutable after timezone manipulation operations', () => {
            // Este test replica un conocido bug de mutabilidad en Day.js
            // relacionado con .utcOffset() para asegurar que atemporal no lo sufre.

            // 1. Creamos la instancia original
            const originalDate = atemporal('2000-01-01T06:01:02Z');
            const originalValue = originalDate.raw.epochMilliseconds;

            // 2. Realizamos una operación que en Day.js mutaba el original.
            // El equivalente en atemporal es .timeZone().
            const modifiedDate = originalDate.timeZone('+01:00');

            // 3. Verificamos el valor de la instancia original OTRA VEZ.
            const valueAfterOperation = originalDate.raw.epochMilliseconds;

            // --- Aserciones Clave ---

            // A. La instancia original NO debe haber cambiado su valor.
            expect(valueAfterOperation).toBe(originalValue);

            // B. La nueva instancia debe ser una referencia de objeto diferente.
            expect(modifiedDate).not.toBe(originalDate);

            // C. El IDENTIFICADOR DE ZONA HORARIA de la nueva instancia debe ser diferente.
            // ESTO prueba que la operación tuvo efecto, sin cambiar el instante de tiempo.
            expect(modifiedDate.raw.timeZoneId).not.toBe(originalDate.raw.timeZoneId);
        });
    });
});