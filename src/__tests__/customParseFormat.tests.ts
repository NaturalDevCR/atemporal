import atemporal from '../index';
import customParseFormatPlugin from '../plugins/customParseFormat';

// Extiende atemporal con el plugin una sola vez para todos los tests de este archivo.
atemporal.extend(customParseFormatPlugin);

describe('customParseFormat plugin', () => {
    // Establece una zona horaria por defecto para que los tests sean consistentes.
    beforeAll(() => {
        atemporal.setDefaultTimeZone('UTC');
    });

    describe('atemporal.fromFormat()', () => {
        it('should parse a date with a standard YYYY-MM-DD format', () => {
            const date = atemporal.fromFormat('2023-10-27', 'YYYY-MM-DD');
            expect(date.isValid()).toBe(true);
            expect(date.year).toBe(2023);
            expect(date.month).toBe(10);
            expect(date.day).toBe(27);
            expect(date.hour).toBe(0); // Debe usar la medianoche como valor por defecto
        });

        it('should parse a date with a DD/MM/YYYY format', () => {
            const date = atemporal.fromFormat('25/12/2023', 'DD/MM/YYYY');
            expect(date.isValid()).toBe(true);
            expect(date.year).toBe(2023);
            expect(date.month).toBe(12);
            expect(date.day).toBe(25);
        });

        it('should parse a date with a two-digit year (YY)', () => {
            const date = atemporal.fromFormat('24-01-15', 'YY-MM-DD');
            expect(date.isValid()).toBe(true);
            expect(date.year).toBe(2024); // Asume el siglo XXI
            expect(date.month).toBe(1);
            expect(date.day).toBe(15);
        });

        it('should parse a date and time', () => {
            const date = atemporal.fromFormat('2023-01-15 14:30:05', 'YYYY-MM-DD HH:mm:ss');
            expect(date.isValid()).toBe(true);
            expect(date.year).toBe(2023);
            expect(date.month).toBe(1);
            expect(date.day).toBe(15);
            expect(date.hour).toBe(14);
            expect(date.minute).toBe(30);
            expect(date.second).toBe(5);
        });

        it('should handle single-digit month and day (M, D)', () => {
            const date = atemporal.fromFormat('2023-5-7', 'YYYY-M-D');
            expect(date.isValid()).toBe(true);
            expect(date.month).toBe(5);
            expect(date.day).toBe(7);
        });

        it('should parse a date with a specific timezone', () => {
            const date = atemporal.fromFormat('2023/03/10 09:00', 'YYYY/MM/DD HH:mm', 'America/New_York');
            expect(date.isValid()).toBe(true);
            // El string de salida debe reflejar la zona horaria y el offset correctos.
            expect(date.toString()).toBe('2023-03-10T09:00:00-05:00[America/New_York]');

            // Para verificar, convertimos a UTC y comprobamos la hora.
            const utcDate = date.timeZone('UTC');
            expect(utcDate.hour).toBe(14);
        });

        it('should default to midnight when time is not provided', () => {
            const date = atemporal.fromFormat('1999-12-31', 'YYYY-MM-DD');
            expect(date.isValid()).toBe(true);
            expect(date.hour).toBe(0);
            expect(date.minute).toBe(0);
            expect(date.second).toBe(0);
        });

        describe('failure cases', () => {
            it('should return an invalid instance if the date string does not match the format', () => {
                const date = atemporal.fromFormat('2023-10-27', 'DD/MM/YYYY');
                expect(date.isValid()).toBe(false);
            });

            it('should return an invalid instance for a partial match', () => {
                const date = atemporal.fromFormat('2023-10', 'YYYY-MM-DD');
                expect(date.isValid()).toBe(false);
            });

            it('should return an invalid instance if the format string is missing a year', () => {
                const date = atemporal.fromFormat('10-27', 'MM-DD');
                expect(date.isValid()).toBe(false);
            });

            it('should return an invalid instance for empty strings', () => {
                const date1 = atemporal.fromFormat('', 'YYYY-MM-DD');
                const date2 = atemporal.fromFormat('2023-10-27', '');
                expect(date1.isValid()).toBe(false);
                expect(date2.isValid()).toBe(false);
            });

            it('should return an invalid instance for logically impossible dates', () => {
                // El parser crea '2023-02-30T00:00:00', pero el constructor de TemporalWrapper
                // lo invalidará porque el motor de Temporal sabe que no es una fecha real.
                const date = atemporal.fromFormat('2023-02-30', 'YYYY-MM-DD');
                expect(date.isValid()).toBe(false);
            });
        });
    });
});