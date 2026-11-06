import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';

describe('Atemporal: .range() method', () => {
    const start = atemporal('2024-03-10');
    const end = atemporal('2024-03-13');

    describe('Output as Atemporal Instances', () => {
        it('should generate a default inclusive range of days', () => {
            const result = start.range(end, 'day'); // No options object
            expect(result[0]).toBeInstanceOf(TemporalWrapper); // Check instance type
            expect(result).toHaveLength(4);
            expect(result.map(d => (d as TemporalWrapper).format('YYYY-MM-DD'))).toEqual([
                '2024-03-10', '2024-03-11', '2024-03-12', '2024-03-13'
            ]);
        });

        it('should handle inclusivity options correctly', () => {
            const exclusiveResult = start.range(end, 'day', { inclusivity: '()' });
            expect(exclusiveResult).toHaveLength(2);
            expect(exclusiveResult.map(d => (d as TemporalWrapper).format('YYYY-MM-DD'))).toEqual(['2024-03-11', '2024-03-12']);

            const exclusiveEndResult = start.range(end, 'day', { inclusivity: '[)' });
            expect(exclusiveEndResult).toHaveLength(3);
            expect(exclusiveEndResult.map(d => (d as TemporalWrapper).format('YYYY-MM-DD'))).toEqual(['2024-03-10', '2024-03-11', '2024-03-12']);

            const exclusiveStartResult = start.range(end, 'day', { inclusivity: '(]' });
            expect(exclusiveStartResult).toHaveLength(3);
            expect(exclusiveStartResult.map(d => (d as TemporalWrapper).format('YYYY-MM-DD'))).toEqual(['2024-03-11', '2024-03-12', '2024-03-13']);
        });

        it('should return an empty array for invalid ranges', () => {
            expect(end.range(start, 'day')).toEqual([]);
            expect(atemporal('invalid').range(end, 'day')).toEqual([]);
            expect(start.range('invalid', 'day')).toEqual([]);
        });

        it('should generate a range by other units like week', () => {
            const multiWeekStart = atemporal('2024-01-01');
            const multiWeekEnd = atemporal('2024-01-20');
            const result = multiWeekStart.range(multiWeekEnd, 'week');
            expect(result).toHaveLength(3);
            expect(result.map(d => (d as TemporalWrapper).format('YYYY-MM-DD'))).toEqual([
                '2024-01-01', '2024-01-08', '2024-01-15'
            ]);
        });

        it('should correctly generate a range by month', () => {
            const startOfMonth = atemporal('2023-11-05');
            const endOfMonth = atemporal('2024-02-20');
            const result = startOfMonth.range(endOfMonth, 'month', { inclusivity: '[)' });
            expect(result).toHaveLength(4); // February 5 still precedes February 20.
            expect(result.map(d => (d as TemporalWrapper).format('YYYY-MM'))).toEqual([
                '2023-11', '2023-12', '2024-01', '2024-02'
            ]);
        });

        it('interprets a local endpoint in the start zone and preserves an explicit instant', () => {
            const local = atemporal('2024-01-01T23:00:00', 'America/New_York');
            const localEnd = '2024-01-02T23:00:00';
            expect(local.range(localEnd, 'day')).toHaveLength(2);
            expect(local.range(localEnd, 'day', { inclusivity: '[)' })).toHaveLength(1);
            expect(local.range('2024-01-03T03:59:59Z', 'day')).toHaveLength(1);
        });

        it('retains the final representable instant without advancing past it', () => {
            const maximum = new Date(8.64e15);
            const previous = atemporal(new Date(maximum.getTime() - 1), 'UTC');
            expect(previous.range(maximum, 'millisecond').map((date) => date.raw.epochMilliseconds)).toEqual([
                maximum.getTime() - 1, maximum.getTime(),
            ]);
            expect(previous.range(maximum, 'second')).toHaveLength(1);
        });

        it('should handle same start and end dates', () => {
            const inclusiveResult = start.range(start, 'day', { inclusivity: '[]' });
            expect(inclusiveResult).toHaveLength(1);
            expect((inclusiveResult[0] as TemporalWrapper).isSame(start)).toBe(true);

            const exclusiveResult = start.range(start, 'day', { inclusivity: '()' });
            expect(exclusiveResult).toEqual([]);
        });
    });

    describe('Output as Formatted Strings', () => {
        it('should return an array of strings when a format string is provided', () => {
            const result = start.range(end, 'day', { format: 'MM/DD/YYYY' });
            expect(typeof result[0]).toBe('string');
            expect(result).toEqual([
                '03/10/2024',
                '03/11/2024',
                '03/12/2024',
                '03/13/2024'
            ]);
        });

        it('should return an array of strings using Intl options', () => {
            const multiMonthStart = atemporal('2023-12-15');
            const multiMonthEnd = atemporal('2024-02-15');
            const result = multiMonthStart.range(multiMonthEnd, 'month', {
                format: { month: 'long', year: 'numeric' }
            });
            expect(result).toEqual(['December 2023', 'January 2024', 'February 2024']);
        });

        it('should respect inclusivity when formatting', () => {
            const result = start.range(end, 'day', {
                inclusivity: '()',
                format: 'dddd'
            });
            expect(result).toHaveLength(2);
            expect(result).toEqual(['Monday', 'Tuesday']);
        });

        it('should return an empty array for an invalid range when formatting', () => {
            const result = end.range(start, 'day', { format: 'YYYY' });
            expect(result).toEqual([]);
        });
    });
});
