/**
 * @file This plugin adds interoperability with Firebase Timestamps.
 * It allows creating an atemporal instance from a Firebase Timestamp object
 * and converting an atemporal instance back into one.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import type { AtemporalFactory, Plugin } from '../types';

/**
 * Represents the structure of a Firebase Timestamp object.
 */
interface FirebaseTimestamp {
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
         * atemporal().toFirebaseTimestamp();
         * // => { seconds: 1672531200, nanoseconds: 500000000 }
         */
        toFirebaseTimestamp(): FirebaseTimestamp | null;
    }
}

const firebaseTimestampPlugin: Plugin = (Atemporal: typeof TemporalWrapper, atemporal: AtemporalFactory) => {
    Atemporal.prototype.toFirebaseTimestamp = function (this: TemporalWrapper): FirebaseTimestamp | null {
        if (!this.isValid()) {
            return null;
        }

        // --- START OF FIX ---
        // Correctly reconstruct the total nanoseconds within the second by combining
        // all sub-second components from the underlying Temporal object.
        const nanosecondsWithinSecond =
            this.raw.millisecond * 1_000_000 +
            this.raw.microsecond * 1_000 +
            this.raw.nanosecond;

        return {
            seconds: Math.floor(this.raw.epochMilliseconds / 1000),
            nanoseconds: nanosecondsWithinSecond,
        };
        // --- END OF FIX ---
    };
};

export default firebaseTimestampPlugin;