import atemporal from '../index';
import { InvalidTimeZoneError, InvalidAtemporalInstanceError } from '../errors';
import { Temporal } from '@js-temporal/polyfill';

/**
 * Unified Atemporal Test Suite
 * 
 * This file consolidates tests from:
 * - atemporal.core.tests.ts
 * - atemporal.edge-cases.tests.ts  
 * - atemporal.comparision.test.ts
 * 
 * Eliminates duplicates and provides comprehensive coverage
 */
describe('Atemporal: Unified Test Suite', () => {
    // Common test data
    const date1 = atemporal('2024-02-15T10:30:00Z'); // Thursday, leap year
    const date2 = atemporal('2020-02-29T12:00:00Z'); // Leap year, Feb 29
    const invalidDate = atemporal('invalid date');

    describe('Factory and Creation', () => {
        it('should create dates from various input types', () => {
            // String input
            const fromString = atemporal('2024-01-01T12:00:00Z');
            expect(fromString.isValid()).toBe(true);
            expect(fromString.format('YYYY-MM-DD')).toBe('2024-01-01');

            // Array input
            const fromArray = atemporal([2024, 8, 15, 10, 30, 25]);
            expect(fromArray.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-08-15 10:30:25');

            // Object input
            const fromObject = atemporal({ year: 2023, month: 11, day: 20, hour: 22, minute: 5 });
            expect(fromObject.format('YYYY-MM-DD HH:mm')).toBe('2023-11-20 22:05');

            // Temporal.PlainDateTime input
            const pdt = new Temporal.PlainDateTime(2025, 7, 26, 10, 30);
            const fromTemporal = atemporal(pdt, 'America/New_York');
            expect(fromTemporal.format('YYYY-MM-DD HH:mm')).toBe('2025-07-26 10:30');
            expect(fromTemporal.raw.timeZoneId).toBe('America/New_York');
        });

        it('should handle existing atemporal instances', () => {
            const original = atemporal('2024-01-01T12:00:00Z');
            
            // Clone without timezone change
            const cloned = atemporal(original);
            expect(cloned.toString()).toBe(original.toString());
            expect(cloned).not.toBe(original); // Should be new instance

            // Clone with timezone change
            const changedTz = atemporal(original, 'Asia/Tokyo');
            expect(changedTz.raw.timeZoneId).toBe('Asia/Tokyo');
        });

        it('should handle ISO strings with offsets', () => {
            // Preserve offset when no timezone specified
            const withOffset = atemporal('2024-10-27T10:00:00+02:00');
            expect(withOffset.format('Z')).toBe('+02:00');
            expect(withOffset.timeZoneName).not.toBe('UTC');

            // Override offset with specified timezone
            const overrideOffset = atemporal('2024-10-27T10:00:00+02:00', 'America/Los_Angeles');
            expect(overrideOffset.format('YYYY-MM-DD HH:mm Z')).toBe('2024-10-27 01:00 -07:00');
        });

        it('should create invalid instances for unsupported inputs', () => {
            // @ts-expect-error - Intentionally testing invalid types
            expect(atemporal(true).isValid()).toBe(false);
            // @ts-expect-error
            expect(atemporal({ a: 1 }).isValid()).toBe(false);
            
            // Invalid arrays and objects
            expect(atemporal([2024, 2, 30]).isValid()).toBe(false); // Feb 30 doesn't exist
            expect(atemporal({ year: 2024, month: 13, day: 1 }).isValid()).toBe(false);
            expect(atemporal('This will definitely fail').isValid()).toBe(false);
        });

        it('should respect timezone in object creation', () => {
            const date = atemporal({ year: 2024, month: 1, day: 1 }, 'America/New_York');
            expect(date.timeZoneName).toBe('America/New_York');
        });
    });

    describe('Manipulation Methods', () => {
        it('should set units to new values', () => {
            const newDate = date1.set('year', 2025);
            expect(newDate.year).toBe(2025);
            expect(newDate.format('YYYY-MM-DD')).toBe('2025-02-15');

            // Test quarter setting
            const date = atemporal('2024-05-20');
            expect(date.set('quarter', 4).format('YYYY-MM-DD')).toBe('2024-10-01');
            expect(date.set('quarter', 2).format('YYYY-MM-DD')).toBe('2024-04-01');

            // Invalid quarter should return same instance
            expect(date.quarter(5)).toBe(date);
        });

        it('should handle startOf and endOf for all units', () => {
            const date = atemporal('2024-03-15T10:30:45.500Z');
            
            // Year
            expect(date.startOf('year').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-01-01 00:00:00.000');
            expect(date.endOf('year').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-12-31 23:59:59.999');
            
            // Month
            expect(date1.startOf('month').format('YYYY-MM-DD HH:mm:ss')).toBe('2024-02-01 00:00:00');
            
            // Week
            expect(date.startOf('week').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-11 00:00:00.000');
            expect(date.endOf('week').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-17 23:59:59.999');
            
            // Hour, minute, second
            expect(date.startOf('hour').format('HH:mm:ss.SSS')).toBe('10:00:00.000');
            expect(date.endOf('hour').format('HH:mm:ss.SSS')).toBe('10:59:59.999');
            expect(date.startOf('minute').format('HH:mm:ss.SSS')).toBe('10:30:00.000');
            expect(date.endOf('minute').format('HH:mm:ss.SSS')).toBe('10:30:59.999');
            expect(date.startOf('second').format('HH:mm:ss.SSS')).toBe('10:30:45.000');
            expect(date.endOf('second').format('HH:mm:ss.SSS')).toBe('10:30:45.999');
        });

        it('should handle add and subtract with all unit aliases', () => {
            const baseDate = atemporal('2024-01-10T10:00:00Z');

            // Year aliases
            expect(baseDate.add(1, 'y').year).toBe(2025);
            expect(baseDate.add(1, 'year').year).toBe(2025);
            expect(baseDate.add(1, 'years').year).toBe(2025);

            // Month aliases
            expect(baseDate.add(1, 'month').month).toBe(2);
            expect(baseDate.add(1, 'months').month).toBe(2);

            // Day aliases
            expect(baseDate.add(2, 'd').day).toBe(12);
            expect(baseDate.add(2, 'day').day).toBe(12);
            expect(baseDate.add(2, 'days').day).toBe(12);

            // Week aliases
            expect(baseDate.subtract(1, 'w').day).toBe(3);
            expect(baseDate.subtract(1, 'week').day).toBe(3);
            expect(baseDate.subtract(1, 'weeks').day).toBe(3);

            // Hour aliases
            expect(baseDate.add(3, 'h').hour).toBe(13);
            expect(baseDate.add(3, 'hour').hour).toBe(13);
            expect(baseDate.add(3, 'hours').hour).toBe(13);

            // Minute aliases
            expect(baseDate.add(10, 'm').minute).toBe(10);
            expect(baseDate.add(10, 'minute').minute).toBe(10);
            expect(baseDate.add(10, 'minutes').minute).toBe(10);

            // Second aliases
            const d = baseDate.set('second', 30);
            expect(d.subtract(10, 's').second).toBe(20);
            expect(d.subtract(10, 'second').second).toBe(20);
            expect(d.subtract(10, 'seconds').second).toBe(20);

            // Millisecond
            expect(baseDate.add(100, 'ms').millisecond).toBe(100);
        });

        it('should throw error for invalid units', () => {
            const date = atemporal();
            const invalidUnit = 'non-existent-unit' as any;
            expect(() => date.add(1, invalidUnit)).toThrow();
        });
    });

    describe('Comparison Methods', () => {
        const d1 = atemporal('2024-01-10T12:00:00Z');
        const d2 = atemporal('2024-01-10T12:00:00Z');
        const d3 = atemporal('2024-01-15T12:00:00Z');

        it('should handle isSame with different units', () => {
            const date1 = atemporal('2024-03-15T10:30:45Z');
            const date2 = atemporal('2024-03-15T11:00:00Z'); // Same day
            const date3 = atemporal('2024-04-15T10:30:45Z'); // Same year, different month
            const date4 = atemporal('2025-03-15T10:30:45Z'); // Different year
            const sameInstant = atemporal('2024-03-15T10:30:45Z');

            // Year comparisons
            expect(date1.isSame(date3, 'year')).toBe(true);
            expect(date1.isSame(date4, 'year')).toBe(false);
            
            // Month comparisons
            expect(date1.isSame(date2, 'month')).toBe(true);
            expect(date1.isSame(date3, 'month')).toBe(false);
            
            // Day comparisons
            expect(date1.isSame(date2, 'day')).toBe(true);
            expect(date1.isSame(date4, 'day')).toBe(false);
            
            // Default (millisecond) comparison
            expect(date1.isSame(sameInstant)).toBe(true);
            expect(date1.isSame(date2)).toBe(false);

            // Test with millisecond precision
            const d1ms = atemporal('2024-01-10T12:00:00.500Z');
            const d2ms = atemporal('2024-01-10T12:00:00.500Z');
            const d3ms = atemporal('2024-01-10T12:00:00.501Z');
            expect(d1ms.isSame(d2ms)).toBe(true);
            expect(d1ms.isSame(d3ms)).toBe(false);
        });

        it('should handle isSameOrBefore and isSameOrAfter', () => {
            // isSameOrBefore
            expect(d1.isSameOrBefore(d2)).toBe(true); // Same date
            expect(d1.isSameOrBefore(d3)).toBe(true); // Before
            expect(d3.isSameOrBefore(d1)).toBe(false); // After
            expect(d1.isSameOrBefore('2024-01-10T12:00:00Z')).toBe(true); // String input
            expect(d1.isSameOrBefore(new Date('2024-01-15T12:00:00Z'))).toBe(true); // Date input

            // isSameOrAfter
            expect(d1.isSameOrAfter(d2)).toBe(true); // Same date
            expect(d3.isSameOrAfter(d1)).toBe(true); // After
            expect(d1.isSameOrAfter(d3)).toBe(false); // Before
            expect(d1.isSameOrAfter('2024-01-10T12:00:00Z')).toBe(true); // String input
            expect(d3.isSameOrAfter(new Date('2024-01-01T12:00:00Z'))).toBe(true); // Date input
        });

        it('should handle isBetween with different inclusivity', () => {
            const start = atemporal('2024-01-15');
            const end = atemporal('2024-01-20');
            const dateOnBoundary = atemporal('2024-01-15');
            const dateInMiddle = atemporal('2024-01-17');

            // Test all inclusivity options
            expect(dateOnBoundary.isBetween(start, end, '()')).toBe(false); // Exclusive
            expect(dateOnBoundary.isBetween(start, end, '(]')).toBe(false); // Start exclusive
            expect(dateOnBoundary.isBetween(start, end, '[)')).toBe(true);  // End exclusive
            expect(dateOnBoundary.isBetween(start, end, '[]')).toBe(true);  // Inclusive
            
            // Middle date should always be true
            expect(dateInMiddle.isBetween(start, end)).toBe(true);
            expect(date1.isBetween(atemporal('2024-01-01'), atemporal('2024-03-01'))).toBe(true);
            expect(date1.isBetween(date1, atemporal('2024-03-01'), '()')).toBe(false); // Exclusive
        });

        it('should handle isSameDay', () => {
            const sameDay = atemporal('2024-02-15T23:59:59Z');
            expect(date1.isSame(sameDay, 'day')).toBe(true);
            expect(date1.isSameDay(sameDay)).toBe(true);
        });

        it('should handle isLeapYear', () => {
            expect(atemporal('2024-01-01').isLeapYear()).toBe(true);  // 2024 is leap
            expect(atemporal('2000-01-01').isLeapYear()).toBe(true);  // 2000 is leap
            expect(atemporal('2023-01-01').isLeapYear()).toBe(false); // 2023 is not leap
            expect(atemporal('2100-01-01').isLeapYear()).toBe(false); // 2100 is not leap
            expect(date1.isLeapYear()).toBe(true);  // 2024 is leap
            expect(date2.isLeapYear()).toBe(true);  // 2020 is leap
        });

        it('should handle invalid inputs in comparisons', () => {
            const validDate = atemporal();
            
            // All comparison methods should return false for invalid inputs
            expect(validDate.isBefore('garbage')).toBe(false);
            expect(validDate.isAfter('garbage')).toBe(false);
            expect(validDate.isSame('garbage')).toBe(false);
            expect(validDate.isSameOrBefore('garbage')).toBe(false);
            expect(validDate.isSameOrAfter('garbage')).toBe(false);
            expect(validDate.isBetween('garbage', atemporal().add(1, 'day'))).toBe(false);
            expect(validDate.isBetween(atemporal().subtract(1, 'day'), 'garbage')).toBe(false);
            expect(validDate.isSameDay('garbage')).toBe(false);
        });
    });

    describe('Utility Methods', () => {
        it('should calculate differences between dates', () => {
            const futureDate = date1.add(3, 'day');
            expect(futureDate.diff(date1, 'day')).toBe(3);
            expect(futureDate.diff(date1, 'hour')).toBe(72);
            
            // Test diff with invalid input
            expect(date1.diff('invalid')).toBeNaN();
        });

        it('should get specific unit values', () => {
            expect(date1.get('month')).toBe(2);
            expect(date1.get('hour')).toBe(10);
            expect(date1.get('quarter')).toBe(1); // February is Q1
            
            const q2Date = atemporal('2024-05-20');
            expect(q2Date.get('quarter')).toBe(2);
        });

        it('should handle dayOfWeek operations', () => {
            const wednesday = atemporal('2024-08-14'); // Wednesday
            
            // Valid day changes
            expect(wednesday.dayOfWeek(1).format('YYYY-MM-DD')).toBe('2024-08-12'); // Monday
            expect(wednesday.dayOfWeek(7).format('YYYY-MM-DD')).toBe('2024-08-18'); // Sunday
            
            // Same day should return clone
            const sameWednesday = wednesday.dayOfWeek(3);
            expect(sameWednesday.format('YYYY-MM-DD')).toBe('2024-08-14');
            expect(sameWednesday).not.toBe(wednesday); // Should be new instance
            
            // Invalid days should return same instance
            expect(wednesday.dayOfWeek(0)).toBe(wednesday);
            expect(wednesday.dayOfWeek(8)).toBe(wednesday);
            expect(wednesday.dayOfWeek(-1)).toBe(wednesday);
        });
    });

    describe('Formatting', () => {
        const date = atemporal('2024-07-04T15:08:09.123Z'); // Thursday, 3:08 PM

        it('should format year, month, and day tokens', () => {
            expect(date.format('YYYY')).toBe('2024');
            expect(date.format('YY')).toBe('24');
            expect(date.format('MMMM')).toBe('July');
            expect(date.format('MMM')).toBe('Jul');
            expect(date.format('MM')).toBe('07');
            expect(date.format('M')).toBe('7');
            expect(date.format('DD')).toBe('04');
            expect(date.format('D')).toBe('4');
        });

        it('should format day of week tokens', () => {
            expect(date.format('dddd')).toBe('Thursday');
            expect(date.format('ddd')).toBe('Thu');
            const narrowDay = date.format('dd', 'en-US');
            expect(['T', 'Th']).toContain(narrowDay);
            expect(date.format('d')).toBe('4');
        });

        it('should format hour tokens', () => {
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

            expect(noonDate.format('h')).toBe('12');
            expect(midnightDate.format('h')).toBe('12');
        });

        it('should format minute, second, and millisecond tokens', () => {
            expect(date.format('mm')).toBe('08');
            expect(date.format('m')).toBe('8');
            expect(date.format('ss')).toBe('09');
            expect(date.format('s')).toBe('9');
            expect(date.format('SSS')).toBe('123');
        });

        it('should format AM/PM tokens', () => {
            const pmDate = atemporal('2024-01-01T13:00:00Z');
            const amDate = atemporal('2024-01-01T09:00:00Z');

            expect(pmDate.format('A')).toBe('PM');
            expect(pmDate.format('a')).toBe('pm');
            expect(amDate.format('A')).toBe('AM');
            expect(amDate.format('a')).toBe('am');
        });

        it('should handle timezone tokens', () => {
            const nyDate = atemporal('2024-01-15T10:00:00', 'America/New_York');
            expect(nyDate.format('z')).toBe('America/New_York');
            expect(nyDate.format('Z')).toBe('-05:00');
            expect(nyDate.format('ZZ')).toBe('-0500');
        });

        it('should handle literal brackets and complex formats', () => {
            expect(date.format('[The year is] YYYY')).toBe('The year is 2024');
            
            const complexFormat = 'dddd, MMMM D, YYYY [at] h:mm:ss a (z)';
            const expected = 'Thursday, July 4, 2024 at 3:08:09 pm (UTC)';
            expect(date.format(complexFormat)).toBe(expected);
        });

        it('should handle single-digit tokens', () => {
            const d = atemporal('2024-07-09T05:06:07Z');
            expect(d.format('M/D/YY H:m:s')).toBe('7/9/24 5:6:7');
        });

        it('should handle Intl.DateTimeFormatOptions', () => {
            const formatted = date1.format({ dateStyle: 'full', timeStyle: 'short' }, 'en-US');
            expect(formatted).toContain('Thursday, February 15, 2024');
            
            const d = atemporal('2024-01-05T12:00:00Z');
            const formatted2 = d.format({ year: '2-digit', month: 'numeric', day: 'numeric' });
            expect(formatted2).toBe('1/5/24');
        });

        it('should use format cache', () => {
            const d = atemporal();
            const format1 = d.format('YYYY-MM-DD');
            const format2 = d.format('YYYY-MM-DD');
            expect(format1).toBe(format2);
            
            // Test cache with different locales
            d.format('dddd', 'es');
            d.format('dddd', 'fr');
            const format3 = d.format('dddd', 'es');
            const format4 = d.format('dddd', 'es');
            expect(format3).toBe(format4);
        });

        it('should handle format without arguments', () => {
            const formatted = date1.format();
            expect(typeof formatted).toBe('string');
            expect(formatted.length).toBeGreaterThan(0);
        });
    });

    describe('Timezone Operations', () => {
        afterEach(() => {
            atemporal.setDefaultTimeZone('UTC');
        });

        it('should handle timezone changes', () => {
            const utcDate = atemporal('2024-01-01T00:00:00.000Z');
            const saoPauloDate = utcDate.timeZone('America/Sao_Paulo');
            expect(saoPauloDate.hour).toBe(21);
            expect(saoPauloDate.format('Z')).toBe('-03:00');
        });

        it('should handle DST transitions', () => {
            const beforeDST = atemporal('2024-11-03T01:00:00-04:00', 'America/New_York');
            const afterDST = beforeDST.add(1, 'hour');
            expect(afterDST.format('HH:mm Z')).toBe('01:00 -05:00');
        });

        it('should allow setting default timezone', () => {
            atemporal.setDefaultTimeZone('Asia/Tokyo');
            const nowInTokyo = atemporal();
            expect(nowInTokyo.raw.timeZoneId).toBe('Asia/Tokyo');
        });

        it('should preserve ISO string offsets', () => {
            const isoStringWithOffset = '2024-05-15T10:00:00+08:00';
            const date = atemporal(isoStringWithOffset);
            expect(date.isValid()).toBe(true);
            expect(date.format('Z')).toBe('+08:00');
            expect(date.toString()).toBe('2024-05-15T10:00:00+08:00');
        });
    });

    describe('String Representation', () => {
        it('should handle toString for different timezone scenarios', () => {
            // UTC date
            const utcDate = atemporal('2024-01-15T12:30:00Z', 'UTC');
            expect(utcDate.toString()).toBe('2024-01-15T12:30:00Z');
            
            const utcDateWithMs = atemporal('2024-01-15T12:30:00.500Z', 'UTC');
            expect(utcDateWithMs.toString()).toBe('2024-01-15T12:30:00.500Z');
            
            // Non-UTC date
            const nyDate = atemporal('2024-01-15T12:00:00', 'America/New_York');
            expect(nyDate.toString()).toBe('2024-01-15T12:00:00-05:00');
        });
    });

    describe('Invalid Instance Behavior', () => {
        it('should return false for all boolean methods', () => {
            const validDate = atemporal();
            expect(invalidDate.isBefore(validDate)).toBe(false);
            expect(invalidDate.isAfter(validDate)).toBe(false);
            expect(invalidDate.isSame(validDate)).toBe(false);
            expect(invalidDate.isSameOrBefore(validDate)).toBe(false);
            expect(invalidDate.isSameOrAfter(validDate)).toBe(false);
            expect(invalidDate.isBetween(validDate, validDate)).toBe(false);
            expect(invalidDate.isSameDay(validDate)).toBe(false);
            expect(invalidDate.isLeapYear()).toBe(false);
        });

        it('should return NaN for all number methods', () => {
            expect(invalidDate.diff(new Date())).toBeNaN();
            expect(invalidDate.get('year')).toBeNaN();
            expect(invalidDate.year).toBeNaN();
            expect(invalidDate.month).toBeNaN();
            expect(invalidDate.day).toBeNaN();
            expect(invalidDate.hour).toBeNaN();
            expect(invalidDate.minute).toBeNaN();
            expect(invalidDate.second).toBeNaN();
            expect(invalidDate.millisecond).toBeNaN();
            expect(invalidDate.quarter()).toBeNaN();
            expect(invalidDate.weekOfYear).toBeNaN();
            expect(invalidDate.daysInMonth).toBeNaN();
        });

        it('should return "Invalid Date" for string methods', () => {
            expect(invalidDate.format('YYYY-MM-DD')).toBe('Invalid Date');
            expect(invalidDate.toString()).toBe('Invalid Date');
            expect(invalidDate.dayOfWeekName).toBe('Invalid Date');
        });

        it('should return invalid Date for toDate()', () => {
            const date = invalidDate.toDate();
            expect(date.getTime()).toBeNaN();
        });

        it('should return same invalid instance for manipulation methods', () => {
            expect(invalidDate.add(1, 'day')).toBe(invalidDate);
            expect(invalidDate.subtract(1, 'hour')).toBe(invalidDate);
            expect(invalidDate.set('year', 2025)).toBe(invalidDate);
            expect(invalidDate.startOf('day')).toBe(invalidDate);
            expect(invalidDate.endOf('month')).toBe(invalidDate);
            expect(invalidDate.timeZone('America/New_York')).toBe(invalidDate);
            expect(invalidDate.clone()).toBe(invalidDate);
            expect(invalidDate.dayOfWeek(3)).toBe(invalidDate);
        });

        it('should throw errors when accessing raw or datetime', () => {
            expect(() => invalidDate.raw).toThrow(InvalidAtemporalInstanceError);
            expect(() => invalidDate.datetime).toThrow(InvalidAtemporalInstanceError);
        });
    });

    describe('Error Handling', () => {
        it('should throw InvalidTimeZoneError for invalid timezones', () => {
            expect(() => {
                atemporal.setDefaultTimeZone('Mars/Olympus_Mons');
            }).toThrow(InvalidTimeZoneError);
        });

        it('should throw InvalidAtemporalInstanceError for invalid datetime access', () => {
            expect(() => {
                const dt = invalidDate.datetime;
            }).toThrow(InvalidAtemporalInstanceError);
        });
    });

    describe('Immutability', () => {
        it('should maintain immutability after timezone operations', () => {
            const originalDate = atemporal('2000-01-01T06:01:02Z');
            const originalValue = originalDate.raw.epochMilliseconds;

            // Perform timezone operation
            const modifiedDate = originalDate.timeZone('+01:00');
            const valueAfterOperation = originalDate.raw.epochMilliseconds;

            // Original should be unchanged
            expect(valueAfterOperation).toBe(originalValue);
            expect(modifiedDate).not.toBe(originalDate);
            expect(modifiedDate.raw.timeZoneId).not.toBe(originalDate.raw.timeZoneId);
        });
    });
});