import { TemporalUtils } from '../TemporalUtils';
import { InvalidDateError } from '../errors';
import { Temporal } from '@js-temporal/polyfill';

describe('TemporalUtils Low-Level Tests', () => {

    // Cubre las líneas 81-82 y 93-100 (catch blocks de Timestamps)
    describe('Invalid Object/Timestamp Parsing', () => {
        it('should throw for an invalid Firebase-like timestamp object', () => {
            const invalidTimestamp = { seconds: Infinity, nanoseconds: 0 };
            expect(() => TemporalUtils.from(invalidTimestamp)).toThrow(InvalidDateError);
        });

        it('should throw if a Firebase-like object has a failing .toDate() method', () => {
            const corruptedTimestamp = {
                seconds: 1672531200,
                nanoseconds: 0,
                toDate: () => { throw new Error('Corrupted'); }
            };
            expect(() => TemporalUtils.from(corruptedTimestamp)).toThrow(InvalidDateError);
        });
    });

    // Cubre la línea 178-179 (throw para tipos no soportados)
    describe('Unsupported Input Types', () => {
        it('should throw for a boolean input', () => {
            // @ts-expect-error - Testing invalid input
            expect(() => TemporalUtils.from(true)).toThrow(InvalidDateError);
        });

        it('should throw for a function input', () => {
            // @ts-expect-error - Testing invalid input
            expect(() => TemporalUtils.from(() => {})).toThrow(InvalidDateError);
        });
    });

    // Cubre las líneas 64-65 (manejo de PlainDateTime)
    describe('Temporal Type Handling', () => {
        it('should handle a Temporal.PlainDateTime and apply a new timezone', () => {
            const pdt = new Temporal.PlainDateTime(2025, 7, 26, 10, 30);
            const zdt = TemporalUtils.from(pdt, 'America/New_York');
            expect(zdt.timeZoneId).toBe('America/New_York');
            expect(zdt.year).toBe(2025);
        });
    });
});