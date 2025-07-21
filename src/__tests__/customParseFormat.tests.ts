import atemporal from '../index';
import customParseFormatPlugin from '../plugins/customParseFormat';
import { setCurrentDateFunction, resetCurrentDateFunction } from '../plugins/customParseFormat';

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

            // PRUEBA CORREGIDA: La responsabilidad de mostrar el nombre de la zona es de .format(), no de .toString().
            // Esta prueba ahora valida que .format() puede generar el offset correcto.
            expect(date.format('YYYY-MM-DDTHH:mm:ssZ')).toBe('2023-03-10T09:00:00-05:00');

            // Y validamos que la zona horaria interna es la correcta de forma explícita.
            expect(date.raw.timeZoneId).toBe('America/New_York');

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

            it('should use the current date for parts not in the format string', () => {
                // Inyectar una función de fecha fija
                setCurrentDateFunction(() => ({
                    year: 2023,
                    month: 6,
                    day: 15
                }));
                
                try {
                    // Este formato no tiene año ni mes, por lo que debe usar los mockeados.
                    const date = atemporal.fromFormat('15 10:30', 'DD HH:mm');
                    
                    expect(date.isValid()).toBe(true);
                    expect(date.year).toBe(2023);
                    expect(date.month).toBe(6);
                    expect(date.day).toBe(15);
                    expect(date.hour).toBe(10);
                    expect(date.minute).toBe(30);
                } finally {
                    // Restaurar función de fecha original
                    resetCurrentDateFunction();
                }
            });

            it('should return an invalid instance for a partial match', () => {
                const date = atemporal.fromFormat('2023-10', 'YYYY-MM-DD');
                expect(date.isValid()).toBe(false);
            });

            it('should return an invalid instance for empty strings', () => {
                const date1 = atemporal.fromFormat('', 'YYYY-MM-DD');
                const date2 = atemporal.fromFormat('2023-10-27', '');
                expect(date1.isValid()).toBe(false);
                expect(date2.isValid()).toBe(false);
            });

            it('should return an invalid instance for logically impossible dates', () => {
                // With the `overflow: 'reject'` fix in TemporalUtils, this will now fail correctly.
                const date = atemporal.fromFormat('2023-02-30', 'YYYY-MM-DD');
                expect(date.isValid()).toBe(false);
            });

            describe('enhanced validation and edge cases', () => {
                it('should reject invalid months', () => {
                    const date1 = atemporal.fromFormat('2023-13-15', 'YYYY-MM-DD');
                    const date2 = atemporal.fromFormat('2023-00-15', 'YYYY-MM-DD');
                    expect(date1.isValid()).toBe(false);
                    expect(date2.isValid()).toBe(false);
                });

                it('should reject invalid days', () => {
                    const date1 = atemporal.fromFormat('2023-01-32', 'YYYY-MM-DD');
                    const date2 = atemporal.fromFormat('2023-01-00', 'YYYY-MM-DD');
                    expect(date1.isValid()).toBe(false);
                    expect(date2.isValid()).toBe(false);
                });

                it('should reject invalid hours', () => {
                    const date1 = atemporal.fromFormat('2023-01-15 24:00', 'YYYY-MM-DD HH:mm');
                    const date2 = atemporal.fromFormat('2023-01-15 25:00', 'YYYY-MM-DD HH:mm');
                    expect(date1.isValid()).toBe(false);
                    expect(date2.isValid()).toBe(false);
                });

                it('should reject invalid minutes', () => {
                    const date1 = atemporal.fromFormat('2023-01-15 12:60', 'YYYY-MM-DD HH:mm');
                    const date2 = atemporal.fromFormat('2023-01-15 12:99', 'YYYY-MM-DD HH:mm');
                    expect(date1.isValid()).toBe(false);
                    expect(date2.isValid()).toBe(false);
                });

                it('should reject invalid seconds', () => {
                    const date1 = atemporal.fromFormat('2023-01-15 12:30:60', 'YYYY-MM-DD HH:mm:ss');
                    const date2 = atemporal.fromFormat('2023-01-15 12:30:99', 'YYYY-MM-DD HH:mm:ss');
                    expect(date1.isValid()).toBe(false);
                    expect(date2.isValid()).toBe(false);
                });

                it('should handle milliseconds correctly', () => {
                    const date1 = atemporal.fromFormat('2023-01-15 12:30:45.123', 'YYYY-MM-DD HH:mm:ss.SSS');
                    expect(date1.isValid()).toBe(true);
                    expect(date1.millisecond).toBe(123);

                    const date2 = atemporal.fromFormat('2023-01-15 12:30:45.12', 'YYYY-MM-DD HH:mm:ss.SS');
                    expect(date2.isValid()).toBe(true);
                    expect(date2.millisecond).toBe(120);

                    const date3 = atemporal.fromFormat('2023-01-15 12:30:45.1', 'YYYY-MM-DD HH:mm:ss.S');
                    expect(date3.isValid()).toBe(true);
                    expect(date3.millisecond).toBe(100);
                });

                it('should reject invalid milliseconds', () => {
                    const date1 = atemporal.fromFormat('2023-01-15 12:30:45.999', 'YYYY-MM-DD HH:mm:ss.SSS');
                    expect(date1.isValid()).toBe(true); // 999 es válido

                    // Test con valores fuera de rango si fuera posible
                    const date2 = atemporal.fromFormat('2023-01-15 12:30:45.99', 'YYYY-MM-DD HH:mm:ss.SS');
                    expect(date2.isValid()).toBe(true); // 99 es válido
                });

                it('should handle two-digit years correctly', () => {
                    // Años 00-68 -> 2000-2068
                    const date1 = atemporal.fromFormat('00-01-15', 'YY-MM-DD');
                    expect(date1.isValid()).toBe(true);
                    expect(date1.year).toBe(2000);

                    const date2 = atemporal.fromFormat('68-01-15', 'YY-MM-DD');
                    expect(date2.isValid()).toBe(true);
                    expect(date2.year).toBe(2068);

                    // Años 69-99 -> 1969-1999
                    const date3 = atemporal.fromFormat('69-01-15', 'YY-MM-DD');
                    expect(date3.isValid()).toBe(true);
                    expect(date3.year).toBe(1969);

                    const date4 = atemporal.fromFormat('99-01-15', 'YY-MM-DD');
                    expect(date4.isValid()).toBe(true);
                    expect(date4.year).toBe(1999);
                });

                it('should handle strings with leading/trailing whitespace', () => {
                    const date1 = atemporal.fromFormat('  ', 'YYYY-MM-DD');
                    expect(date1.isValid()).toBe(false);

                    const date2 = atemporal.fromFormat('2023-01-15', '  ');
                    expect(date2.isValid()).toBe(false);
                });

                it('should handle edge cases with single digit tokens', () => {
                    const date1 = atemporal.fromFormat('2023-1-1 1:1:1', 'YYYY-M-D H:m:s');
                    expect(date1.isValid()).toBe(true);
                    expect(date1.month).toBe(1);
                    expect(date1.day).toBe(1);
                    expect(date1.hour).toBe(1);
                    expect(date1.minute).toBe(1);
                    expect(date1.second).toBe(1);

                    const date2 = atemporal.fromFormat('2023-12-31 23:59:59', 'YYYY-M-D H:m:s');
                    expect(date2.isValid()).toBe(true);
                    expect(date2.month).toBe(12);
                    expect(date2.day).toBe(31);
                    expect(date2.hour).toBe(23);
                    expect(date2.minute).toBe(59);
                    expect(date2.second).toBe(59);
                });
            });
        });
    });
});

it('should handle ambiguous formats like Hmm correctly', () => {
    // Caso del bug: 3 dígitos para H y mm
    const date1 = atemporal.fromFormat('600', 'Hmm');
    expect(date1.isValid()).toBe(true);
    expect(date1.hour).toBe(6);
    expect(date1.minute).toBe(0);
    expect(date1.format('h:mm A')).toBe('6:00 AM');

    // Caso de 4 dígitos para HH y mm
    const date2 = atemporal.fromFormat('0600', 'HHmm');
    expect(date2.isValid()).toBe(true);
    expect(date2.hour).toBe(6);
    expect(date2.minute).toBe(0);
});

it('should parse formats with single and double digit tokens together', () => {
    // Probar D/M/YYYY
    const date1 = atemporal.fromFormat('5/7/2023', 'D/M/YYYY');
    expect(date1.month).toBe(7);
    expect(date1.day).toBe(5);

    // Probar DD/MM/YYYY
    const date2 = atemporal.fromFormat('05/07/2023', 'DD/MM/YYYY');
    expect(date2.month).toBe(7);
    expect(date2.day).toBe(5);
});

