/**
 * @file 02 - Comparisons (TypeScript)
 *
 * Demonstrates how to compare two atemporal instances using methods like
 * isBefore, isAfter, isSame, and isBetween.
 *
 * To run: node -r ts-node/register examples/02-comparisons.ts
 */

import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';

console.log('--- 2. Comparison Examples ---');

const date1: TemporalWrapper = atemporal('2023-06-15');
const date2: TemporalWrapper = atemporal('2024-01-20');
const date3: TemporalWrapper = atemporal('2023-06-15');

console.log(`\nComparing ${date1.format('YYYY-MM-DD')} and ${date2.format('YYYY-MM-DD')}`);
console.log(`Is date1 before date2?  -> ${date1.isBefore(date2)}`); // true
console.log(`Is date2 after date1?   -> ${date2.isAfter(date1)}`);  // true
console.log(`Is date1 same as date2? -> ${date1.isSame(date2)}`);    // false

console.log(`\nComparing ${date1.format('YYYY-MM-DD')} and ${date3.format('YYYY-MM-DD')}`);
console.log(`Is date1 same as date3? -> ${date1.isSame(date3)}`);    // true
// Demonstrates checking for same calendar day, ignoring time
console.log(`Is it the same day?     -> ${date1.isSame(date3, 'day')}`); // true

const start: TemporalWrapper = atemporal('2024-01-01');
const end: TemporalWrapper = atemporal('2024-12-31');
const checkDate: TemporalWrapper = atemporal('2024-07-26');
console.log(`\nIs ${checkDate.format('YYYY-MM-DD')} between ${start.format('YYYY-MM-DD')} and ${end.format('YYYY-MM-DD')}?`);
console.log(`Result: -> ${checkDate.isBetween(start, end)}`); // true

// Example of isBetween with exclusive inclusivity
const isBetweenExclusive = checkDate.isBetween(start, end, '()');
console.log(`Result (exclusive): -> ${isBetweenExclusive}`); // true

const isAtEdgeBetween = start.isBetween(start, end, '()');
console.log(`Is start date between (exclusive)? -> ${isAtEdgeBetween}`); // false