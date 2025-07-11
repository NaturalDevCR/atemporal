/**
 * @file 03 - Plugins (TypeScript)
 *
 * Demonstrates how to extend atemporal's functionality with plugins.
 * This example shows the relativeTime, customParseFormat, and durationHumanizer plugins.
 *
 * To run: node -r ts-node/register examples/03-plugins.ts
 */

import atemporal from '../index';
import { TemporalWrapper } from '../TemporalWrapper';
import relativeTimePlugin from '../plugins/relativeTime';
import customParseFormatPlugin from '../plugins/customParseFormat';
import durationHumanizerPlugin from '../plugins/durationHumanizer';

// Extend with plugins at the start of your application
atemporal.extend(relativeTimePlugin);
atemporal.extend(customParseFormatPlugin);
atemporal.extend(durationHumanizerPlugin);

console.log('--- 3. Plugin Usage Examples ---');

// --- Relative Time Plugin ---
console.log('\n--- Relative Time Plugin ---');
const twoHoursAgo: TemporalWrapper = atemporal().subtract(2, 'hour');
console.log(`"${twoHoursAgo.fromNow()}"`); // "2 hours ago"

const inThreeDays: TemporalWrapper = atemporal().add(3, 'day');
console.log(`"${inThreeDays.fromNow()}"`); // "in 3 days"

// --- Custom Parse Format Plugin ---
console.log('\n--- Custom Parse Format Plugin ---');
const fromCustomFormat: TemporalWrapper = atemporal.fromFormat('25/12/2024', 'DD/MM/YYYY');
console.log(`Parsed "25/12/2024" -> ${fromCustomFormat.format('YYYY-MM-DD')}`);

// --- Duration Humanizer Plugin ---
console.log('\n--- Duration Humanizer Plugin ---');
const myDuration = atemporal.duration({ years: 2, months: 3, hours: 5 });
console.log(`Humanized duration (en-US): "${atemporal.humanize(myDuration)}"`);

// With localization options
// Use `as const` to tell TypeScript this is a literal, not a generic string.
const options = { locale: 'es', unitDisplay: 'long' as const };
console.log(`Humanized duration (es-ES): "${atemporal.humanize(myDuration, options)}"`);

// --- Advanced Format Plugin ---
console.log('\n--- Advanced Format Plugin ---');
const today = atemporal('2024-08-15');
console.log(`Formatted with ordinal (en-US): "${today.format('Do [of] MMMM, YYYY')}"`);
console.log(`Formatted with ordinal (es-ES): "${today.format('Do [de] MMMM [de] YYYY', 'es')}"`);
console.log(`Current quarter: "${today.format('Qo [Quarter]')}"`);