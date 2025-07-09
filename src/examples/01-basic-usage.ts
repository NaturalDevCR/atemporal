/**
 * @file 01 - Basic Usage (TypeScript)
 *
 * Demonstrates the core features: creating instances, manipulation,
 * getting values, and formatting dates into strings.
 *
 * To run: node -r ts-node/register examples/01-basic-usage.ts
 */

// Modern ES Module import syntax
import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';

console.log('--- 1. Basic Usage Examples ---');

// --- Creating Instances ---
console.log('\n--- Creating Instances ---');
const now: TemporalWrapper = atemporal();
const specificDate: TemporalWrapper = atemporal('2024-07-26T15:30:00Z');
const fromJsDate: TemporalWrapper = atemporal(new Date());
console.log('Current time:', now.toString());
console.log('From ISO string:', specificDate.toString());

// --- Manipulation (Immutable) ---
console.log('\n--- Date & Time Manipulation ---');
const futureDate = specificDate.add(2, 'month').add(5, 'day');
console.log(`Original:       ${specificDate.format('YYYY-MM-DD')}`);
console.log(`+2 months, 5 days: ${futureDate.format('YYYY-MM-DD')}`);

const modifiedDate = specificDate.set('hour', 9).set('minute', 0);
console.log(`Set to 9:00 AM:   ${modifiedDate.format('YYYY-MM-DD HH:mm')}`);

// --- Getters ---
console.log('\n--- Getting Values ---');
console.log(`Year:         ${specificDate.year}`);
console.log(`Month:        ${specificDate.month}`);
console.log(`Day:          ${specificDate.day}`);
console.log(`Day of Week:  ${specificDate.dayOfWeekName}`);

// --- Formatting ---
console.log('\n--- Formatting Dates ---');
const formattedString = specificDate.format('dddd, DD/MM/YYYY');
console.log('Custom format:', formattedString);

// Using Intl.DateTimeFormat for localized formatting
atemporal.setDefaultLocale('fr-FR');
const localizedString = specificDate.format({ dateStyle: 'long', timeStyle: 'short' });
console.log('Localized (fr-FR):', localizedString);
atemporal.setDefaultLocale('en-US'); // Reset locale