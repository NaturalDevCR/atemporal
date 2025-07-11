/**
 * @file This plugin adds interoperability with Firebase Timestamps.
 * It enhances atemporal to parse Firebase Timestamp objects directly and
 * adds a method to convert atemporal instances back into them.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import type { Plugin } from '../types';

/**
 * Represents the structure of a Firebase Timestamp object.
 */
export interface FirebaseTimestamp {
    seconds: number;
    nanoseconds: number;
}

// Augment the TemporalWrapper interface to include the new method.
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Converts the atemporal instance to a Firebase-compatible Timestamp object.
         * @returns An object with `seconds` and `nanoseconds` properties, or `null` if the instance is invalid.
         * @example
         * atemporal('2023-01-01T00:00:00.500Z').toFirebaseTimestamp();
         * // => { seconds: 1672531200, nanoseconds: 500000000 }
         */
        toFirebaseTimestamp(): FirebaseTimestamp | null;
    }
}

const firebaseTimestampPlugin: Plugin = (Atemporal) => {
    Atemporal.prototype.toFirebaseTimestamp = function (this: TemporalWrapper): FirebaseTimestamp | null {
        if (!this.isValid()) {
            return null;
        }

        // Use the underlying `Temporal.Instant` for the most direct and robust conversion.
        // `epochSeconds` gives the whole seconds, and `epochNanoseconds` gives the remainder.
        const instant = this.datetime.toInstant();
        const NANO_IN_SECOND = 1_000_000_000n;

        return {
            seconds: Number(instant.epochNanoseconds / NANO_IN_SECOND),
            nanoseconds: Number(instant.epochNanoseconds % NANO_IN_SECOND),
        };
    };
};

export default firebaseTimestampPlugin;