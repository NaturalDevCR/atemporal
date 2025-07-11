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