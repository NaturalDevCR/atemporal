import {
    InvalidTimeZoneError,
    InvalidAtemporalInstanceError,
    InvalidDateError,
    InvalidFormatError,
    FormatMismatchError,
    InvalidDateComponentsError,
    InvalidAmPmError
} from '../errors';

describe('Error Classes', () => {
    describe('InvalidTimeZoneError', () => {
        it('should create an error with correct name and message', () => {
            const error = new InvalidTimeZoneError('Invalid timezone');
            expect(error.name).toBe('InvalidTimeZoneError');
            expect(error.message).toBe('Invalid timezone');
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('InvalidAtemporalInstanceError', () => {
        it('should create an error with correct name and message', () => {
            const error = new InvalidAtemporalInstanceError('Invalid instance');
            expect(error.name).toBe('InvalidAtemporalInstanceError');
            expect(error.message).toBe('Invalid instance');
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('InvalidDateError', () => {
        it('should create an error with correct name and message', () => {
            const error = new InvalidDateError('Invalid date');
            expect(error.name).toBe('InvalidDateError');
            expect(error.message).toBe('Invalid date');
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('InvalidFormatError', () => {
        it('should create an error with format string and optional invalid tokens', () => {
            const formatString = 'YYYY-MM-DD';
            const invalidTokens = ['XX', 'YY'];
            const error = new InvalidFormatError('Invalid format', formatString, invalidTokens);
            
            expect(error.name).toBe('InvalidFormatError');
            expect(error.message).toBe('Invalid format');
            expect(error.formatString).toBe(formatString);
            expect(error.invalidTokens).toEqual(invalidTokens);
            expect(error).toBeInstanceOf(Error);
        });

        it('should create an error without invalid tokens', () => {
            const formatString = 'YYYY-MM-DD';
            const error = new InvalidFormatError('Invalid format', formatString);
            
            expect(error.name).toBe('InvalidFormatError');
            expect(error.message).toBe('Invalid format');
            expect(error.formatString).toBe(formatString);
            expect(error.invalidTokens).toBeUndefined();
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('FormatMismatchError', () => {
        it('should create an error with date string, format string, and optional expected pattern', () => {
            const dateString = '2023-13-45';
            const formatString = 'YYYY-MM-DD';
            const expectedPattern = '\\d{4}-\\d{2}-\\d{2}';
            const error = new FormatMismatchError(
                'Format mismatch',
                dateString,
                formatString,
                expectedPattern
            );
            
            expect(error.name).toBe('FormatMismatchError');
            expect(error.message).toBe('Format mismatch');
            expect(error.dateString).toBe(dateString);
            expect(error.formatString).toBe(formatString);
            expect(error.expectedPattern).toBe(expectedPattern);
            expect(error).toBeInstanceOf(Error);
        });

        it('should create an error without expected pattern', () => {
            const dateString = '2023-13-45';
            const formatString = 'YYYY-MM-DD';
            const error = new FormatMismatchError(
                'Format mismatch',
                dateString,
                formatString
            );
            
            expect(error.name).toBe('FormatMismatchError');
            expect(error.message).toBe('Format mismatch');
            expect(error.dateString).toBe(dateString);
            expect(error.formatString).toBe(formatString);
            expect(error.expectedPattern).toBeUndefined();
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('InvalidDateComponentsError', () => {
        it('should create an error with components and optional reason', () => {
            const components = { year: 2023, month: 13, day: 45 };
            const reason = 'Month and day out of range';
            const error = new InvalidDateComponentsError(
                'Invalid date components',
                components,
                reason
            );
            
            expect(error.name).toBe('InvalidDateComponentsError');
            expect(error.message).toBe('Invalid date components');
            expect(error.components).toEqual(components);
            expect(error.reason).toBe(reason);
            expect(error).toBeInstanceOf(Error);
        });

        it('should create an error without reason', () => {
            const components = { year: 2023, month: 13, day: 45 };
            const error = new InvalidDateComponentsError(
                'Invalid date components',
                components
            );
            
            expect(error.name).toBe('InvalidDateComponentsError');
            expect(error.message).toBe('Invalid date components');
            expect(error.components).toEqual(components);
            expect(error.reason).toBeUndefined();
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('InvalidAmPmError', () => {
        it('should create an error with hour12 and ampm values', () => {
            const hour12 = 13;
            const ampm = 'PM';
            const error = new InvalidAmPmError(
                'Invalid AM/PM',
                hour12,
                ampm
            );
            
            expect(error.name).toBe('InvalidAmPmError');
            expect(error.message).toBe('Invalid AM/PM');
            expect(error.hour12).toBe(hour12);
            expect(error.ampm).toBe(ampm);
            expect(error).toBeInstanceOf(Error);
        });

        it('should create an error with different hour12 and ampm values', () => {
            const hour12 = 0;
            const ampm = 'AM';
            const error = new InvalidAmPmError(
                'Hour cannot be 0 in 12-hour format',
                hour12,
                ampm
            );
            
            expect(error.name).toBe('InvalidAmPmError');
            expect(error.message).toBe('Hour cannot be 0 in 12-hour format');
            expect(error.hour12).toBe(hour12);
            expect(error.ampm).toBe(ampm);
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('Error inheritance', () => {
        it('should ensure all custom errors extend Error', () => {
            const errors = [
                new InvalidTimeZoneError('test'),
                new InvalidAtemporalInstanceError('test'),
                new InvalidDateError('test'),
                new InvalidFormatError('test', 'format'),
                new FormatMismatchError('test', 'date', 'format'),
                new InvalidDateComponentsError('test', {}),
                new InvalidAmPmError('test', 12, 'PM')
            ];

            errors.forEach(error => {
                expect(error).toBeInstanceOf(Error);
                expect(error.name).toBe(error.constructor.name);
            });
        });
    });
});