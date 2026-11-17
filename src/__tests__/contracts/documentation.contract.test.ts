import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import atemporal from '../../index';
import businessDays from '../../plugins/businessDays';
import relativeTime from '../../plugins/relativeTime';
import durationHumanizer from '../../plugins/durationHumanizer';

const root = path.resolve(__dirname, '../../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const blocks = (text: string) => [...text.matchAll(/```(?:ts|js)\n([\s\S]*?)```/g)].map((match) => match[1]);
const section = (text: string, start: string, end: string) => text.split(start)[1].split(end)[0];

// Execute the actual maintained examples, with source imports injected so the
// documentation contract also runs before a developer has built dist/.
async function execute(code: string, result: string) {
  const body = code.replace(/^import .+ from ['"].+['"];\s*$/gm, '');
  const javascript = ts.transpileModule(body, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  return new AsyncFunction('atemporal', 'businessDays', 'relativeTime', 'durationHumanizer', 'console',
    `${javascript}\nreturn (${result});`)(atemporal, businessDays, relativeTime, durationHumanizer, { log() {} });
}

afterEach(() => {
  if (atemporal.isPluginLoaded('businessDays')) {
    atemporal.setBusinessDaysConfig({ holidays: [], weekendDays: [6, 7] });
  }
  atemporal.setDefaultLocale('en-US');
  atemporal.setDefaultTimeZone('UTC');
  atemporal.resetDiagnostics();
});

test('the concise LLM recipes execute with the documented APIs', async () => {
  const guide = read('docs/public/llms.txt');
  const recipe = blocks(section(guide, '### Common recipes', '## Choose the public API'))[0];
  const result = await execute(recipe, '{ midnight, timestamp, deadline, humanized, parsed, formatted }');

  expect(result.midnight.timeZoneId).toBe('America/New_York');
  expect(result.midnight.hour).toBe(0);
  expect(result.timestamp).toBe('2026-07-15T10:00:00.123456789Z');
  expect(result.deadline.format('YYYY-MM-DD')).toBe('2026-07-21');
  expect(result.humanized).toBe('2 hours and 30 minutes');
  expect(result.parsed).toBeNull();
  expect(result.formatted).toContain('2026');
});

test('the README quick start works and distinguishes raw constructors from wrappers', async () => {
  const readme = read('README.md');
  const quickStart = blocks(section(readme, '## Quick Start', '## Choose a value'))[0];
  const quick = await execute(quickStart, '{ now, future, fromString, fromUnix, fromDate, fromArray, fromFirebase }');
  for (const value of Object.values(quick) as ReturnType<typeof atemporal>[]) expect(value.isValid()).toBe(true);

  const examples = blocks(section(readme, '## Choose a value and parsing policy', '## Configuration'));
  const raw = await execute(examples[0], '{ event, invoiceDate, openingTime, meeting }');
  expect(raw.event.toString()).toBe('2026-07-15T10:00:00.123456789Z');
  expect(raw.invoiceDate.toString()).toBe('2026-07-15');
  expect(raw.openingTime.toString()).toBe('2026-07-15T09:00:00');
  expect(raw.meeting.timeZoneId).toBe('America/Costa_Rica');
  expect(raw.event.format).toBeUndefined();
  const appointment = await execute(examples[1], 'appointment');
  expect(appointment.format('Z')).toBe('-05:00');
});

test('the duration guide humanizes a raw Temporal.Duration through the factory', async () => {
  const recipe = blocks(read('docs/plugins/duration-humanizer.md'))[0];
  expect(await execute(recipe, 'atemporal.humanize(duration, { locale: "en" })'))
    .toBe('2 hours and 30 minutes');
});

test('business-day recipes use supported configuration and immutable recurrence', async () => {
  const recipe = blocks(read('docs/cookbook/business-hours.md')).join('\n');
  const result = await execute(recipe, '{ at9am, deadline, meetings }');
  expect(result.at9am.timeZoneId).toBe('America/New_York');
  expect(result.at9am.hour).toBe(9);
  expect(result.at9am.minute).toBe(0);
  expect(result.deadline.format('YYYY-MM-DD')).toBe('2026-07-21');
  expect(new Set(result.meetings).size).toBe(10);
  expect(result.meetings[0]).toBe('2026-03-02T09:00:00-05:00');
  expect(result.meetings[1]).toBe('2026-03-09T09:00:00-04:00');
});

test('the full LLM method index advertises real core and plugin members', async () => {
  const guide = read('docs/public/llms-full.txt');
  const index = section(guide, '## Method index', '# Full documentation');
  const value = atemporal.parse('2026-07-15T10:00:00Z');
  let checked = 0;
  for (const line of index.split('\n').filter((line) => /^\| `(?:atemporal|t)/.test(line))) {
    const nameCell = line.split(/(?<!\\)\|/)[1];
    for (const match of nameCell.matchAll(/\b(atemporal|t)\.([A-Za-z][A-Za-z0-9_.]*)/g)) {
      let member: unknown = match[1] === 'atemporal' ? atemporal : value;
      for (const part of match[2].split('.')) {
        expect(member).not.toBeNull();
        expect(member).not.toBeUndefined();
        member = Reflect.get(Object(member), part);
      }
      expect(member).not.toBeUndefined();
      checked++;
    }
  }
  expect(checked).toBeGreaterThan(60);

  await atemporal.lazyLoadMultiple(atemporal.getAvailablePlugins());
  for (const method of ['humanize', 'fromFormat', 'checkDateRangeOverlap', 'setWeekStartsOn', 'findAvailableSlots']) {
    expect(typeof Reflect.get(atemporal, method)).toBe('function');
  }
  for (const method of ['fromNow', 'toNow', 'weekday', 'rangeOverlapsWith', 'to', 'addBusinessDays']) {
    expect(typeof Reflect.get(value, method)).toBe('function');
  }
});
