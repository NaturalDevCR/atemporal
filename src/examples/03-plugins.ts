/**
 * @file 03 - Plugins (TypeScript)
 *
 * Demonstrates how to extend atemporal's functionality with plugins.
 * This example shows both the relativeTime and customParseFormat plugins.
 *
 * To run: node -r ts-node/register examples/03-plugins.ts
 */

import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';
import relativeTimePlugin from '../plugins/relativeTime';
import customParseFormatPlugin from '../plugins/customParseFormat';

// Extend with plugins at the start of your application
atemporal.extend(relativeTimePlugin);
atemporal.extend(customParseFormatPlugin);

console.log('--- 3. Plugin Usage Examples ---');

// --- Relative Time Plugin ---
console.log('\n--- Relative Time Plugin ---');
const twoHoursAgo: TemporalWrapper = atemporal().subtract(2, 'hour');
console.log(`"${twoHoursAgo.fromNow()}"`); // "2 hours ago"

const inThreeDays: TemporalWrapper = atemporal().add(3, 'day');
console.log(`"${inThreeDays.fromNow()}"`); // "in 3 days"

// Without the "ago" or "in" suffix
const fiveMinutes: TemporalWrapper = atemporal().add(5, 'minute');
console.log(`"${fiveMinutes.fromNow(true)}"`); // "5 minutes"

// --- Custom Parse Format Plugin ---
console.log('\n--- Custom Parse Format Plugin ---');
const fromCustomFormat: TemporalWrapper = atemporal.fromFormat('25/12/2024', 'DD/MM/YYYY');
console.log(`Parsed "25/12/2024" -> ${fromCustomFormat.format('YYYY-MM-DD')}`);

// This example demonstrates a format that is NOT supported by the simple parser
// to show how it fails gracefully.
const fromComplexFormat: TemporalWrapper = atemporal.fromFormat('July 26, 2024 15:30', 'MMMM D, YYYY HH:mm');
console.log(`Did "July 26, 2024" parse? -> ${fromComplexFormat.isValid()}`); // false

const failedParse: TemporalWrapper = atemporal.fromFormat('26-07-2024', 'YYYY-MM-DD');
console.log(`Did "26-07-2024" parse with YYYY-MM-DD? -> ${failedParse.isValid()}`); // false