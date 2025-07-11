import atemporal from '../index';
import firebaseTimestampPlugin from '../plugins/firebaseTimestamp';

// Extend atemporal with the new plugin before running tests
atemporal.extend(firebaseTimestampPlugin);

describe('Firebase Timestamps Plugin', () => {
    // A sample Firebase Timestamp (Jan 1, 2023, 00:00:00.500 UTC)
    const fbTimestamp = {
        seconds: 1672531200,
        nanoseconds: 500000000,
    };

    it('should create a valid atemporal instance from a Firebase Timestamp', () => {
        const date = atemporal(fbTimestamp);
        expect(date.isValid()).toBe(true);
        expect(date.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2023-01-01 00:00:00.500');
        expect(date.timeZoneName).toBe('UTC'); // Should default to UTC
    });

    it('should convert an atemporal instance to a Firebase Timestamp', () => {
        const date = atemporal('2023-01-01T00:00:00.500Z');
        const result = date.toFirebaseTimestamp();

        expect(result).not.toBeNull();
        expect(result).toEqual(fbTimestamp);
    });

    it('should handle a round trip conversion correctly', () => {
        const originalTimestamp = { seconds: 1723744933, nanoseconds: 123000000 };
        const atemporalInstance = atemporal(originalTimestamp);
        const finalTimestamp = atemporalInstance.toFirebaseTimestamp();

        expect(finalTimestamp).toEqual(originalTimestamp);
    });

    it('should handle timestamps with zero nanoseconds', () => {
        const zeroNanoTimestamp = { seconds: 1672531200, nanoseconds: 0 };
        const date = atemporal(zeroNanoTimestamp);
        expect(date.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2023-01-01 00:00:00.000');

        const result = date.toFirebaseTimestamp();
        expect(result).toEqual(zeroNanoTimestamp);
    });

    it('toFirebaseTimestamp() should return null for an invalid instance', () => {
        const invalidDate = atemporal('not a valid date');
        expect(invalidDate.toFirebaseTimestamp()).toBeNull();
    });

    it('should respect timezone when creating from a Firebase Timestamp', () => {
        const dateInNewYork = atemporal(fbTimestamp, 'America/New_York');
        // The underlying instant in time is the same, but the local time is different.
        // UTC: 2023-01-01 00:00:00.500
        // NY (EST, UTC-5): 2022-12-31 19:00:00.500
        expect(dateInNewYork.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2022-12-31 19:00:00.500');
        expect(dateInNewYork.timeZoneName).toBe('America/New_York');
    });
});