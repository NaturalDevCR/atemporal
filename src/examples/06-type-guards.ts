/**
 * @file 06 - Type Guards & Validators (TypeScript)
 *
 * Demonstrates how to use atemporal's static utility functions to write
 * robust, type-safe code by validating inputs.
 *
 * To run: node -r ts-node/register examples/06-type-guards.ts
 */

import atemporal from '../index';
import { Temporal } from '@js-temporal/polyfill';

console.log('--- 6. Type Guards & Validators ---');

// --- atemporal.isAtemporal() ---
console.log('\n--- isAtemporal ---');
const myAtemporal = atemporal();
const notAtemporal = { date: '2024-01-01' };
console.log(`Is myAtemporal an atemporal instance? -> ${atemporal.isAtemporal(myAtemporal)}`);
console.log(`Is notAtemporal an atemporal instance? -> ${atemporal.isAtemporal(notAtemporal)}`);

// --- atemporal.isValid() ---
console.log('\n--- isValid ---');
const validDateInput = '2025-12-25';
const invalidDateInput = 'not a real date';
console.log(`Is "${validDateInput}" a valid date? -> ${atemporal.isValid(validDateInput)}`);
console.log(`Is "${invalidDateInput}" a valid date? -> ${atemporal.isValid(invalidDateInput)}`);

// --- atemporal.isDuration() ---
console.log('\n--- isDuration ---');
const myDuration = Temporal.Duration.from({ hours: 5 });
const notDuration = { hours: 5 };
console.log(`Is myDuration a Temporal.Duration? -> ${atemporal.isDuration(myDuration)}`);
console.log(`Is notDuration a Temporal.Duration? -> ${atemporal.isDuration(notDuration)}`);

// --- atemporal.isValidTimeZone() ---
console.log('\n--- isValidTimeZone ---');
const validTz = 'Europe/London';
const invalidTz = 'Mars/Olympus_Mons';
console.log(`Is "${validTz}" a valid timezone? -> ${atemporal.isValidTimeZone(validTz)}`);
console.log(`Is "${invalidTz}" a valid timezone? -> ${atemporal.isValidTimeZone(invalidTz)}`);

// --- atemporal.isValidLocale() ---
console.log('\n--- isValidLocale ---');
const validLocale = 'pt-BR';
const invalidLocale = 'pt_BR'; // Underscores are invalid
console.log(`Is "${validLocale}" a valid locale? -> ${atemporal.isValidLocale(validLocale)}`);
console.log(`Is "${invalidLocale}" a valid locale? -> ${atemporal.isValidLocale(invalidLocale)}`);

console.log('\n--- Example of a robust function using guards ---');
function processDate(input: unknown) {
    if (atemporal.isAtemporal(input) && input.isValid()) {
        console.log(`Processing valid atemporal date: ${input.format('YYYY-MM-DD')}`);
    } else {
        console.log('Input is not a valid atemporal instance. Skipping.');
    }
}

processDate(atemporal());
processDate('2024-01-01'); // This is not an atemporal instance