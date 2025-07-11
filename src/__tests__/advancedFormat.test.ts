import atemporal from '../index';
import advancedFormatPlugin from '../plugins/advancedFormat';

// Extend atemporal with the plugin for all tests in this file.
atemporal.extend(advancedFormatPlugin);

describe('AdvancedFormat Plugin (Ordinals)', () => {

    it('should format day-of-month ordinals correctly in English (en)', () => {
        expect(atemporal('2024-01-01').format('Do MMMM')).toBe('1st January');
        expect(atemporal('2024-01-02').format('Do MMMM')).toBe('2nd January');
        expect(atemporal('2024-01-03').format('Do MMMM')).toBe('3rd January');
        expect(atemporal('2024-01-04').format('Do MMMM')).toBe('4th January');
        expect(atemporal('2024-01-11').format('Do MMMM')).toBe('11th January');
        expect(atemporal('2024-01-21').format('Do MMMM')).toBe('21st January');
    });

    it('should format quarter ordinals correctly in English (en)', () => {
        expect(atemporal('2024-01-15').format('Qo [Quarter]')).toBe('1st Quarter');
        expect(atemporal('2024-04-15').format('Qo [Quarter]')).toBe('2nd Quarter');
        expect(atemporal('2024-08-15').format('Qo')).toBe('3rd');
    });

    it('should format ordinals correctly in Spanish (es)', () => {
        expect(atemporal('2024-01-01').format('Do [de] MMMM', 'es')).toBe('1º de enero');
        expect(atemporal('2024-01-03').format('Do [de] MMMM', 'es')).toBe('3º de enero');
    });

    it('should format ordinals correctly in French (fr)', () => {
        expect(atemporal('2024-01-01').format('Do MMMM', 'fr')).toBe('1er janvier');
        expect(atemporal('2024-01-02').format('Do MMMM', 'fr')).toBe('2e janvier');
    });

    it('should not interfere with standard formatting when chained', () => {
        // This test ensures the plugin correctly passes control to the core formatter.
        const date = atemporal('2024-12-25');
        expect(date.format('YYYY-MM-DD')).toBe('2024-12-25');
        expect(date.format('Do of MMMM')).toBe('25th of December');
    });
});