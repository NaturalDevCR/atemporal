/**
 * @file 08 - Date Ranges (TypeScript)
 *
 * Demonstrates how to generate arrays of dates using the powerful .range() method.
 *
 * To run: node -r ts-node/register src/examples/08-date-ranges.ts
 */

import atemporal from '../index';
// Import a plugin to show how formatted output can use advanced tokens
import advancedFormatPlugin from '../plugins/advancedFormat';

atemporal.extend(advancedFormatPlugin);

console.log('--- 8. Date Range Examples ---');

const start = atemporal('2024-04-28'); // A Sunday
const end = atemporal('2024-05-02');   // A Thursday

// --- 1. Basic Usage (Default: Inclusive) ---
console.log('\n--- 1. Basic Usage: Generating Atemporal Instances ---');

const dailyRange = start.range(end, 'day');
console.log('Inclusive daily range [start, end]:');
// We map the results to strings just for printing them to the console.
// The actual result is an array of atemporal instances.
console.log(dailyRange.map(d => d.format('YYYY-MM-DD dddd')));
/* Expected Output:
[
  '2024-04-28 Sunday',
  '2024-04-29 Monday',
  '2024-04-30 Tuesday',
  '2024-05-01 Wednesday',
  '2024-05-02 Thursday'
]
*/


// --- 2. Using Inclusivity Options ---
console.log('\n--- 2. Using Inclusivity Options ---');

const exclusiveEndRange = start.range(end, 'day', { inclusivity: '[)' });
console.log('Exclusive end range [start, end):');
console.log(exclusiveEndRange.map(d => d.format('YYYY-MM-DD')));
// Expected Output: [ '2024-04-28', '2024-04-29', '2024-04-30', '2024-05-01' ]

const fullyExclusiveRange = start.range(end, 'day', { inclusivity: '()' });
console.log('Fully exclusive range (start, end):');
console.log(fullyExclusiveRange.map(d => d.format('YYYY-MM-DD')));
// Expected Output: [ '2024-04-29', '2024-04-30', '2024-05-01' ]


// --- 3. Getting Formatted Strings Directly ---
console.log('\n--- 3. Getting Formatted Strings Directly ---');

const formattedRange = start.range(end, 'day', {
    inclusivity: '[]',
    format: 'MMMM Do, YYYY' // Using a format string with advanced tokens
});
console.log('Range returned directly as formatted strings:');
console.log(formattedRange);
/* Expected Output:
[
  'April 28th, 2024',
  'April 29th, 2024',
  'April 30th, 2024',
  'May 1st, 2024',
  'May 2nd, 2024'
]
*/


// --- 4. Generating Ranges with Different Units ---
console.log('\n--- 4. Generating Ranges by Week ---');

const weeklyStart = atemporal('2024-01-01');
const weeklyEnd = atemporal('2024-01-28');

const weeklyRange = weeklyStart.range(weeklyEnd, 'week', {
    format: '[Week starting on] YYYY-MM-DD'
});
console.log(weeklyRange);
/* Expected Output:
[
  'Week starting on 2024-01-01',
  'Week starting on 2024-01-08',
  'Week starting on 2024-01-15',
  'Week starting on 2024-01-22'
]
*/


// --- 5. Handling Invalid Ranges ---
console.log('\n--- 5. Handling Invalid Ranges ---');
// An invalid range (end date is before start date) returns an empty array.
const invalidRange = end.range(start, 'day');
console.log(`Result of range where end < start: [${invalidRange.join(', ')}] (Length: ${invalidRange.length})`);
// Expected Output: Result of range where end < start: [] (Length: 0)