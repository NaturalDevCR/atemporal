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
import weekDayPlugin from '../plugins/weekDay';

// Extend with plugins at the start of your application
atemporal.extend(relativeTimePlugin);
atemporal.extend(customParseFormatPlugin);
atemporal.extend(durationHumanizerPlugin);
atemporal.extend(weekDayPlugin);

console.log('--- 3. Plugin Usage Examples ---');

// --- Relative Time Plugin ---
console.log('\n--- Relative Time Plugin ---');
const twoHoursAgo: TemporalWrapper = atemporal().subtract(2, 'hour');
console.log(`"${twoHoursAgo.fromNow()}"`); // "2 hours ago"

const inThreeDays: TemporalWrapper = atemporal().add(3, 'day');
console.log(`"${inThreeDays.fromNow()}"`); // "in 3 days"

// --- Custom Parse Format Plugin ---
console.log('\n--- Custom Parse Format Plugin ---');
// Ejemplo 1: Parseando una fecha completa
const fromCustomFormat: TemporalWrapper = atemporal.fromFormat('25/12/2024', 'DD/MM/YYYY');
console.log(`Parsed "25/12/2024" -> ${fromCustomFormat.format('YYYY-MM-DD')}`);

// Ejemplo 2: Demostración de la corrección del bug (parsear solo la hora)
// Si no se proporciona una fecha, atemporal usará la fecha actual.
const fromTimeOnly = atemporal.fromFormat('830', 'Hmm');
console.log(`Parsed "830" with "Hmm" format -> ${fromTimeOnly.format('YYYY-MM-DD h:mm A')}`);

const fromTimeOnly2 = atemporal.fromFormat('14:45', 'HH:mm');
console.log(`Parsed "14:45" with "HH:mm" format -> ${fromTimeOnly2.format('YYYY-MM-DD HH:mm')}`);

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

// --- WeekDay Plugin ---
console.log('\n--- WeekDay Plugin ---');
const aWednesday = atemporal('2024-08-14');
console.log(`A Wednesday: ${aWednesday.format('dddd, YYYY-MM-DD')}`);

// Default behavior (week starts on Monday)
console.log(`Default start of week: ${aWednesday.startOf('week').format('dddd, YYYY-MM-DD')}`);

// Change week to start on Sunday
atemporal.setWeekStartsOn(0);
console.log('\n>> Set week to start on Sunday (0)');
console.log(`New start of week: ${aWednesday.startOf('week').format('dddd, YYYY-MM-DD')}`);
console.log(`Day of week (0=Sun): ${aWednesday.weekday()}`); // Should be 3

// Reset for any subsequent examples if needed
atemporal.setWeekStartsOn(1);
console.log('\n>> Reset week to start on Monday (1)');