/**
 * @file Defines custom error types for the atemporal library.
 */

/**
 * Base error class for all atemporal-specific errors.
 */
class AtemporalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Thrown when an invalid IANA time zone identifier is used.
 */
export class InvalidTimeZoneError extends AtemporalError {}

/**
 * Thrown when an operation is attempted on an invalid atemporal instance.
 */
export class InvalidAtemporalInstanceError extends AtemporalError {}

/**
 * Thrown when an input cannot be parsed into a valid date.
 */
export class InvalidDateError extends AtemporalError {}

/**
 * Thrown when a format string contains invalid or unsupported tokens.
 */
export class InvalidFormatError extends AtemporalError {
    constructor(message: string, public formatString: string, public invalidTokens?: string[]) {
        super(message);
        this.formatString = formatString;
        this.invalidTokens = invalidTokens;
    }
}

/**
 * Thrown when a date string doesn't match the provided format.
 */
export class FormatMismatchError extends AtemporalError {
    constructor(
        message: string, 
        public dateString: string, 
        public formatString: string,
        public expectedPattern?: string
    ) {
        super(message);
        this.dateString = dateString;
        this.formatString = formatString;
        this.expectedPattern = expectedPattern;
    }
}

/**
 * Thrown when parsed date components result in an invalid date.
 */
export class InvalidDateComponentsError extends AtemporalError {
    constructor(
        message: string,
        public components: { [key: string]: any },
        public reason?: string
    ) {
        super(message);
        this.components = components;
        this.reason = reason;
    }
}

/**
 * Thrown when AM/PM parsing fails or is inconsistent.
 */
export class InvalidAmPmError extends AtemporalError {
    constructor(
        message: string,
        public hour12: number,
        public ampm: string
    ) {
        super(message);
        this.hour12 = hour12;
        this.ampm = ampm;
    }
}