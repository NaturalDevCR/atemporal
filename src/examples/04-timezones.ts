/**
 * @file 04 - Timezones (TypeScript)
 *
 * Demonstrates how to work with different IANA timezones.
 *
 * To run: node -r ts-node/register examples/04-timezones.ts
 */

import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';

console.log('--- 4. Timezone Examples ---');

// Start with a date in UTC for a clear baseline
const utcDate: TemporalWrapper = atemporal('2024-11-01T10:00:00Z');
console.log(`Original (UTC):      ${utcDate.format('YYYY-MM-DD HH:mm:ss Z')}`);

// Convert the same instant to different timezones
const tokyoTime: TemporalWrapper = utcDate.timeZone('Asia/Tokyo');
const nyTime: TemporalWrapper = utcDate.timeZone('America/New_York');

console.log(`In Tokyo:            ${tokyoTime.format('YYYY-MM-DD HH:mm:ss Z')}`);
console.log(`In New York:         ${nyTime.format('YYYY-MM-DD HH:mm:ss Z')}`);

// Create a date directly in a specific timezone
// This represents 10:00 AM on Nov 1st *local New York time*.
console.log('\n--- Creating a date in a specific timezone ---');
const localNyDate: TemporalWrapper = atemporal('2024-11-01T10:00:00', 'America/New_York');
console.log(`Local NY Time:       ${localNyDate.toString()}`);

// See what that instant is in UTC
const localNyInUtc: TemporalWrapper = localNyDate.timeZone('UTC');
console.log(`Same instant in UTC: ${localNyInUtc.toString()}`);

// Set a global default timezone
console.log('\n--- Setting a default timezone ---');
atemporal.setDefaultTimeZone('Europe/Paris');
const nowInParis: TemporalWrapper = atemporal(); // This `now` will be in the Paris timezone
console.log(`Current time in default TZ (Paris): ${nowInParis.toString()}`);
atemporal.setDefaultTimeZone('UTC'); // Reset for consistency