import { TemporalWrapper } from '../TemporalWrapper';
import atemporal from '../index';

describe('TemporalWrapper Coverage Tests', () => {
    describe('Basic Coverage Tests', () => {
        it('should create TemporalWrapper instances', () => {
            const date = atemporal('2024-01-01');
            expect(date).toBeInstanceOf(TemporalWrapper);
            expect(date.isValid()).toBe(true);
        });

        it('should handle invalid dates', () => {
            const invalidDate = atemporal('invalid-date');
            expect(invalidDate.isValid()).toBe(false);
        });

        it('should perform basic operations', () => {
            const date = atemporal('2024-01-01');
            const nextDay = date.add(1, 'day');
            expect(nextDay.format('YYYY-MM-DD')).toBe('2024-01-02');
        });
    });
});