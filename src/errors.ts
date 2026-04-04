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
 * The `public` modifier on constructor params means TypeScript auto-assigns
 * them — no manual `this.x = x` needed.
 */
export class InvalidFormatError extends AtemporalError {
    constructor(
        message: string,
        public readonly formatString: string,
        public readonly invalidTokens?: string[]
    ) {
        super(message);
    }
}

/**
 * Thrown when a date string doesn't match the provided format.
 */
export class FormatMismatchError extends AtemporalError {
    constructor(
        message: string,
        public readonly dateString: string,
        public readonly formatString: string,
        public readonly expectedPattern?: string
    ) {
        super(message);
    }
}

/**
 * Thrown when parsed date components result in an invalid date.
 */
export class InvalidDateComponentsError extends AtemporalError {
    constructor(
        message: string,
        public readonly components: { [key: string]: any },
        public readonly reason?: string
    ) {
        super(message);
    }
}

/**
 * Thrown when AM/PM parsing fails or is inconsistent.
 */
export class InvalidAmPmError extends AtemporalError {
    constructor(
        message: string,
        public readonly hour12: number,
        public readonly ampm: string
    ) {
        super(message);
    }
}