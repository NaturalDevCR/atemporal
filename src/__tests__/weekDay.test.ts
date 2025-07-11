import atemporal from '../index';
import weekDayPlugin from '../plugins/weekDay';

// Extend atemporal with the plugin for all tests in this file.
atemporal.extend(weekDayPlugin);

// A known Wednesday to make tests predictable
const wednesday = '2024-08-14T12:00:00Z';

describe('WeekDay Plugin', () => {
    // Reset the week start day after each test to ensure isolation
    afterEach(() => {
        atemporal.setWeekStartsOn(1); // Reset to default (Monday)
    });

    describe('Configuration: atemporal.setWeekStartsOn()', () => {
        it('should allow setting the start of the week to Sunday (0)', () => {
            atemporal.setWeekStartsOn(0);
            const date = atemporal(wednesday); // A Wednesday
            // With week starting on Sunday, Wednesday is the 3rd day (0-indexed)
            expect(date.weekday()).toBe(3);
        });

        it('should allow setting the start of the week to Saturday (6)', () => {
            atemporal.setWeekStartsOn(6);
            const date = atemporal(wednesday); // A Wednesday
            // With week starting on Saturday, Wednesday is the 4th day (0-indexed)
            expect(date.weekday()).toBe(4);
        });

        it('should ignore invalid day numbers', () => {
            atemporal.setWeekStartsOn(1); // Start with Monday
            atemporal.setWeekStartsOn(7 as any); // Invalid
            const date = atemporal(wednesday);
            // Should still be based on Monday (day 2)
            expect(date.weekday()).toBe(2);

            atemporal.setWeekStartsOn(-1 as any); // Invalid
            expect(date.weekday()).toBe(2);
        });
    });

    describe('Method: .weekday()', () => {
        it('should return the correct day with default setting (Monday=0)', () => {
            atemporal.setWeekStartsOn(1); // Monday is the start
            expect(atemporal('2024-08-12').weekday()).toBe(0); // Monday
            expect(atemporal('2024-08-14').weekday()).toBe(2); // Wednesday
            expect(atemporal('2024-08-18').weekday()).toBe(6); // Sunday
        });

        it('should return the correct day when week starts on Sunday (Sunday=0)', () => {
            atemporal.setWeekStartsOn(0); // Sunday is the start
            expect(atemporal('2024-08-11').weekday()).toBe(0); // Sunday
            expect(atemporal('2024-08-12').weekday()).toBe(1); // Monday
            expect(atemporal('2024-08-14').weekday()).toBe(3); // Wednesday
        });
    });

    describe('Method: .startOf("week")', () => {
        it('should find the previous Monday with default settings', () => {
            const date = atemporal(wednesday); // 2024-08-14
            const startOfWeek = date.startOf('week');
            expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-08-12'); // The previous Monday
            expect(startOfWeek.hour).toBe(0);
        });

        it('should find the previous Sunday when week starts on Sunday', () => {
            atemporal.setWeekStartsOn(0); // Sunday is the start
            const date = atemporal(wednesday); // 2024-08-14
            const startOfWeek = date.startOf('week');
            expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-08-11'); // The previous Sunday
        });

        it('should return the same day if it is the start of the week (Sunday)', () => {
            atemporal.setWeekStartsOn(0);
            const sunday = atemporal('2024-08-11T12:00:00Z');
            const startOfWeek = sunday.startOf('week');
            expect(startOfWeek.format('YYYY-MM-DD')).toBe('2024-08-11');
        });
    });

    describe('Method: .endOf("week")', () => {
        it('should find the next Sunday with default settings', () => {
            const date = atemporal(wednesday); // 2024-08-14
            const endOfWeek = date.endOf('week');
            expect(endOfWeek.format('YYYY-MM-DD')).toBe('2024-08-18'); // The next Sunday
            expect(endOfWeek.format('HH:mm:ss.SSS')).toBe('23:59:59.999');
        });

        it('should find the next Saturday when week starts on Sunday', () => {
            atemporal.setWeekStartsOn(0);
            const date = atemporal(wednesday); // 2024-08-14
            const endOfWeek = date.endOf('week');
            expect(endOfWeek.format('YYYY-MM-DD')).toBe('2024-08-17'); // The next Saturday
        });
    });

    describe('Plugin Delegation', () => {
        it('should not affect startOf for other units', () => {
            atemporal.setWeekStartsOn(0); // Change the week setting
            const date = atemporal('2024-08-14T12:30:45Z');
            expect(date.startOf('month').format('YYYY-MM-DD')).toBe('2024-08-01');
            expect(date.startOf('year').format('YYYY-MM-DD')).toBe('2024-01-01');
        });

        it('should not affect endOf for other units', () => {
            atemporal.setWeekStartsOn(0); // Change the week setting
            const date = atemporal('2024-02-15T12:00:00Z'); // A leap year
            expect(date.endOf('month').format('YYYY-MM-DD')).toBe('2024-02-29');
        });
    });
});