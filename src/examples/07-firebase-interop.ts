/**
 * @file Example: Firebase Timestamp Interoperability
 *
 * This example demonstrates how to use the `firebaseTimestamp` plugin
 * to seamlessly convert between `atemporal` instances and Firebase's
 * Timestamp object format (`{ seconds, nanoseconds }`).
 *
 * To run this example:
 * 1. Make sure you have `ts-node` installed (`npm install -g ts-node`).
 * 2. Run the file from your project root: `ts-node examples/firebase-interop.ts`
 */

// 1. Import the library and the plugin
import atemporal from '../index';
import firebaseTimestampPlugin from '../plugins/firebaseTimestamp';

// 2. Extend atemporal with the plugin's functionality
atemporal.extend(firebaseTimestampPlugin);

console.log('--- Firebase Timestamp Interoperability Example ---');

// --- Part 1: Creating an atemporal instance FROM a Firebase Timestamp ---

// Imagine you receive this object from a Firestore query
const firestoreTimestamp = {
    seconds: 1672531200, // Represents Jan 1, 2023, 00:00:00 UTC
    nanoseconds: 500000000, // 0.5 seconds
};

console.log('\nOriginal Firebase Timestamp:', firestoreTimestamp);

// atemporal can now parse this object directly, thanks to the updated core logic.
const dateFromFirebase = atemporal(firestoreTimestamp);

if (dateFromFirebase.isValid()) {
    console.log('✅ Parsed atemporal instance (UTC):', dateFromFirebase.toString());
    // Expected output: 2023-01-01T00:00:00.500Z

    // You can now use all atemporal features
    console.log(
        '   Formatted in New York timezone:',
        dateFromFirebase.timeZone('America/New_York').format('YYYY-MM-DD hh:mm:ss.SSS A z')
    );
    // Expected output: 2022-12-31 07:00:00.500 PM America/New_York
} else {
    console.error('❌ Failed to parse Firebase Timestamp.');
}


// --- Part 2: Converting an atemporal instance TO a Firebase Timestamp ---

console.log('\n--- Converting back to a Firebase Timestamp ---');

// Create a regular atemporal instance
const myDate = atemporal('2024-08-15T10:30:45.123Z');
console.log('Original atemporal instance:', myDate.toString());

// Use the new .toFirebaseTimestamp() method provided by the plugin
const timestampForFirestore = myDate.toFirebaseTimestamp();

console.log('✅ Converted to Firebase Timestamp:', timestampForFirestore);
// Expected output: { seconds: 1723717845, nanoseconds: 123000000 }

// This `timestampForFirestore` object is now ready to be saved back to Firestore.

console.log('\n--- Round Trip Example ---');
const roundTripDate = atemporal(timestampForFirestore!);
console.log('Result of round trip:', roundTripDate.toString());
console.log('Is it the same instant in time?', myDate.isSame(roundTripDate)); // true