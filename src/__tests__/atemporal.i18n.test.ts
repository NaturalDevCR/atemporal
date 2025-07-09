import atemporal from '../index';
import relativeTime from '../plugins/relativeTime';

atemporal.extend(relativeTime);

describe('Atemporal: Localization (i18n)', () => {

    afterEach(() => {
        // Reset to default after each test
        atemporal.setDefaultLocale('en-US');
    });

    it('should format day names in the specified locale', () => {
        const date = atemporal('2024-07-10'); // A Wednesday

        atemporal.setDefaultLocale('es-ES');
        expect(date.format('dddd')).toBe('miércoles');

        atemporal.setDefaultLocale('fr-FR');
        expect(date.format('dddd')).toBe('mercredi');
    });

    it('should provide relative time in the specified locale', () => {
        const yesterday = atemporal().subtract(1, 'day');

        atemporal.setDefaultLocale('es-ES');
        // The Intl.RelativeTimeFormat API correctly uses "ayer" for a 1-day difference.
        // This is the expected, more natural output.
        expect(yesterday.fromNow()).toBe('ayer');
    });

    // It's good practice to test other timeframes and locales.
    it('should provide future relative time in French', () => {
        const tomorrow = atemporal().add(1, 'day');
        atemporal.setDefaultLocale('fr-FR');
        expect(tomorrow.fromNow()).toBe('demain');
    });

    it('should provide plural relative time in Spanish', () => {
        const twoDaysAgo = atemporal().subtract(2, 'day');
        atemporal.setDefaultLocale('es-ES');
        expect(twoDaysAgo.fromNow()).toBe('anteayer');
    });
});