/**
 * @file 05 - Advanced Usage (TypeScript)
 *
 * Demonstrates advanced features like complex chaining, date differences,
 * robust handling of invalid dates, and localization.
 *
 * To run: node -r ts-node/register examples/05-advanced-usage.ts
 */

import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';
import relativeTimePlugin from '../plugins/relativeTime';

atemporal.extend(relativeTimePlugin);

console.log('--- 5. Advanced Usage Examples ---');

// --- 1. Calculating Differences (diff) ---
console.log('\n--- Calculating Differences ---');
const eventStart = atemporal('2024-07-20T10:00:00');
const eventEnd = atemporal('2024-07-25T14:30:00');

const diffInDays = eventEnd.diff(eventStart, 'day');
const diffInHours = eventEnd.diff(eventStart, 'hour');
console.log(`The event lasted for ${diffInDays.toFixed(2)} days.`);
console.log(`Which is equivalent to ${diffInHours.toFixed(2)} hours.`);


// --- 2. Complex Method Chaining ---
console.log('\n--- Complex Method Chaining ---');
const complexDate = atemporal('2025-03-15T18:45:00', 'America/New_York')
    .add(2, 'month')          // Go to May 15
    .startOf('week')          // Go to the Monday of that week
    .set('hour', 9)           // Set the time to 9 AM
    .timeZone('Asia/Tokyo');  // See what time that is in Tokyo

console.log('Result of complex chain:', complexDate.toString());
console.log('Formatted result:', complexDate.format('YYYY-MM-DD HH:mm Z'));


// --- 3. Robustness with Invalid Dates ---
console.log('\n--- Handling of Invalid Dates ---');
const invalidDate: TemporalWrapper = atemporal('this is not a date');

console.log(`Is the date valid? -> ${invalidDate.isValid()}`);
// All operations on an invalid date return the same invalid instance
const manipulatedInvalid = invalidDate.add(5, 'day');
console.log(`Is it valid after manipulation? -> ${manipulatedInvalid.isValid()}`);
console.log(`Formatted invalid date: -> "${manipulatedInvalid.format('YYYY-MM-DD')}"`);
console.log(`Relative time for invalid date: -> "${manipulatedInvalid.fromNow()}"`);


// --- 4. Localization (i18n) ---
console.log('\n--- Localization (i18n) ---');
const someDate = atemporal().subtract(1, 'day');

atemporal.setDefaultLocale('en-US');
console.log(`Relative time (en-US): "${someDate.fromNow()}"`);
console.log(`Day of week (en-US):   "${someDate.format('dddd')}"`);

atemporal.setDefaultLocale('es-ES');
console.log(`Relative time (es-ES): "${someDate.fromNow()}"`);
console.log(`Day of week (es-ES):   "${someDate.format('dddd')}"`);

atemporal.setDefaultLocale('fr-FR');
console.log(`Relative time (fr-FR): "${someDate.fromNow()}"`);
console.log(`Day of week (fr-FR):   "${someDate.format('dddd')}"`);

// Reset to default
atemporal.setDefaultLocale('en-US');