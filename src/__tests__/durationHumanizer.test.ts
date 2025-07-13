import atemporal from '../index';
import durationHumanizer from '../plugins/durationHumanizer';
import { Temporal } from '@js-temporal/polyfill';

// To test the plugin, we must extend the atemporal instance
// just as a consumer of the library would.
atemporal.extend(durationHumanizer);

describe('Duration Humanizer Plugin', () => {

    describe('Core Functionality', () => {
        it('should humanize a simple duration in English', () => {
            const duration = { hours: 1, minutes: 30 };
            // `Intl.ListFormat` correctly uses "and" for two items.
            expect(atemporal.humanize(duration)).toBe('1 hour and 30 minutes');
        });

        it('should handle pluralization correctly', () => {
            const duration = { years: 2, days: 5 };
            expect(atemporal.humanize(duration)).toBe('2 years and 5 days');
        });

        it('should handle a single unit correctly', () => {
            const duration = { days: 1 };
            expect(atemporal.humanize(duration)).toBe('1 day');
        });

        it('should handle a complex duration with multiple parts', () => {
            const duration = { years: 1, months: 2, days: 3, hours: 4 };
            // `Intl.ListFormat` uses commas and "and" for longer lists in 'en-US'.
            expect(atemporal.humanize(duration, { locale: 'en-US' })).toBe('1 year, 2 months, 3 days, and 4 hours');
        });
    });

    describe('Coverage and Error Handling', () => {
        it('should trigger catch blocks by using an invalid locale', () => {
            // The Intl.NumberFormat constructor will throw a RangeError for an invalid locale,
            // triggering our catch blocks and testing the final fallback paths.
            const duration = { hours: 1 };
            const options = { locale: 'xx-XX-invalid' }; // An invalid locale code

            // This tests the catch block inside the main loop
            expect(atemporal.humanize(duration, options)).toBe('1 hour');

            // This tests the catch block for the zero-duration case
            expect(atemporal.humanize({ seconds: 0 }, options)).toBe('0 seconds');

            // This tests the catch block in the initial guard
            expect(atemporal.humanize({}, options)).toBe('0 seconds');
        });
    });

    describe('Localization (i18n)', () => {
        it('should humanize a duration in Spanish (es)', () => {
            const duration = { hours: 2, minutes: 1 };
            // `Intl.ListFormat` correctly uses "y" as the conjunction in Spanish.
            expect(atemporal.humanize(duration, { locale: 'es' })).toBe('2 horas y 1 minuto');
        });

        it('should handle pluralization correctly in Spanish', () => {
            const duration = { years: 2, days: 5 };
            expect(atemporal.humanize(duration, { locale: 'es' })).toBe('2 años y 5 días');
        });
    });

    describe('Formatting Options', () => {
        it('should use short unit display', () => {
            const duration = { hours: 3, minutes: 45 };
            // The standard short display for 'hour' is 'hr'.
            expect(atemporal.humanize(duration, { unitDisplay: 'short' })).toBe('3 hr and 45 min');
        });

        it('should use narrow unit display', () => {
            const duration = { hours: 3, minutes: 45 };
            expect(atemporal.humanize(duration, { unitDisplay: 'narrow' })).toBe('3h and 45m');
        });
    });

    describe('Edge Cases and Fallbacks', () => {
        it('should handle zero duration', () => {
            const duration = { seconds: 0 };
            expect(atemporal.humanize(duration)).toBe('0 seconds');
        });

        it('should handle an empty duration object', () => {
            const duration = {};
            // The function is now robust enough to handle this without crashing.
            expect(atemporal.humanize(duration)).toBe('0 seconds');
        });

        it('should handle the fallback for unsupported units like "week"', () => {
            // 'week' is not a standard unit in `Intl.NumberFormat`, so it uses the fallback.
            const duration1 = { weeks: 1, days: 2 };
            expect(atemporal.humanize(duration1)).toBe('1 week and 2 days');

            // The improved fallback now handles simple pluralization.
            const duration2 = { weeks: 3, days: 2 };
            expect(atemporal.humanize(duration2)).toBe('3 weeks and 2 days');
        });

        it('should accept a Temporal.Duration instance as input', () => {
            const duration = Temporal.Duration.from({ hours: 5, minutes: 15 });
            expect(atemporal.humanize(duration)).toBe('5 hours and 15 minutes');
        });
    });

    describe('Error handling and fallbacks', () => {
        it('should use string fallback if Intl.NumberFormat throws', () => {
            // Mock the Intl API to force the catch block to execute
            const spy = jest.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
                throw new Error('Forced error for testing');
            });

            const duration = { weeks: 2, days: 1 };
            // The catch block uses a simple string concatenation fallback
            expect(atemporal.humanize(duration)).toBe('2 weeks and 1 day');

            spy.mockRestore(); // Clean up the mock
        });
    });

});