/**
 * @file Generate the LLM-friendly documentation bundle (llms.txt).
 *
 * Concatenates the human-written docs in a curated order, with a
 * machine-generated method index at the top so a coding agent can
 * orient without scrolling 5 000 lines of prose.
 *
 * The output is written to `docs/public/llms.txt` and served as a
 * static asset by VitePress (see `docs/.vitepress/config.mts`,
 * `/atemporal/llms.txt`).
 *
 * Run:
 *   node scripts/generate-llms-txt.js
 *
 * Design notes (why the file is structured this way):
 *
 *   1. A coding agent's most expensive mistake is *not knowing* that a
 *      method exists. So the file opens with a flat method index,
 *      alphabetised, with a one-line signature. The agent can search
 *      this section before reading the long-form guide.
 *
 *   2. Then the high-signal prose: getting started, core concepts.
 *      The agent reads these once per session and caches them.
 *
 *   3. Then the API reference, plugins, cookbook, and migration
 *      guides — all in that order. Cookbook recipes are gold for
 *      "show me how to do X with atemporal specifically" questions.
 *
 *   4. Security and ADRs come last. They are the slow-path context
 *      that an agent only needs when it is about to do something
 *      security-sensitive or non-obvious.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const docsDir = path.join(repoRoot, 'docs');
const conciseOutPath = path.join(docsDir, 'public', 'llms.txt');
const fullOutPath = path.join(docsDir, 'public', 'llms-full.txt');

/** @typedef {{ file: string, title?: string }} Section */

/** @type {Section[]} */
const SECTIONS = [
  // ---- OVERVIEW --------------------------------------------------
  { file: 'index.md', title: 'Project overview' },
  { file: 'guide/index.md', title: 'Guide index' },

  // ---- ONBOARDING ------------------------------------------------
  { file: 'guide/getting-started.md', title: 'Getting started' },
  { file: 'guide/core-concepts.md', title: 'Core concepts' },
  { file: 'guide/choosing-an-api.md', title: 'Choosing the public API' },
  { file: 'guide/performance.md', title: 'Performance & caching' },
  { file: 'guide/temporal-detection.md', title: 'Temporal native vs polyfill detection' },
  { file: 'guide/playground.md', title: 'Playground (in-browser REPL)' },

  // ---- API REFERENCE --------------------------------------------
  { file: 'api/index.md', title: 'API reference — overview' },
  { file: 'api/creating-instances.md', title: 'API — creating instances' },
  { file: 'api/parsing.md', title: 'API — strict parsing and DST policy' },
  { file: 'api/manipulation.md', title: 'API — manipulation (add / subtract / set / startOf / endOf)' },
  { file: 'api/formatting.md', title: 'API — formatting (format / presets)' },
  { file: 'api/comparison-difference.md', title: 'API — comparison & difference' },
  { file: 'api/durations-utilities.md', title: 'API — durations & utilities' },
  { file: 'api/ranges.md', title: 'API — generating ranges' },

  // ---- PLUGINS ---------------------------------------------------
  { file: 'plugins/index.md', title: 'Plugins — overview' },
  { file: 'plugins/relative-time.md', title: 'Plugin — relativeTime' },
  { file: 'plugins/custom-parse-format.md', title: 'Plugin — customParseFormat' },
  { file: 'plugins/advanced-format.md', title: 'Plugin — advancedFormat' },
  { file: 'plugins/week-day.md', title: 'Plugin — weekDay' },
  { file: 'plugins/duration-humanizer.md', title: 'Plugin — durationHumanizer' },
  { file: 'plugins/date-range-overlap.md', title: 'Plugin — dateRangeOverlap' },
  { file: 'plugins/business-days.md', title: 'Plugin — businessDays' },
  { file: 'plugins/time-slots.md', title: 'Plugin — timeSlots' },

  // ---- COOKBOOK (real-world patterns) ---------------------------
  { file: 'cookbook/index.md', title: 'Cookbook — index' },
  { file: 'cookbook/rest-validation.md', title: 'Cookbook — REST input validation' },
  { file: 'cookbook/prisma.md', title: 'Cookbook — Prisma' },
  { file: 'cookbook/drizzle.md', title: 'Cookbook — Drizzle' },
  { file: 'cookbook/rsc.md', title: 'Cookbook — React Server Components' },
  { file: 'cookbook/cloudflare.md', title: 'Cookbook — Cloudflare Workers' },
  { file: 'cookbook/logging.md', title: 'Cookbook — structured logging' },
  { file: 'cookbook/microservice-tz.md', title: 'Cookbook — microservice timezones' },
  { file: 'cookbook/audit-log.md', title: 'Cookbook — audit log timestamps' },
  { file: 'cookbook/business-hours.md', title: 'Cookbook — business hours scheduling' },
  { file: 'cookbook/i18n.md', title: 'Cookbook — i18n formatting' },

  // ---- MIGRATION -------------------------------------------------
  { file: 'migration/index.md', title: 'Migration — overview' },
  { file: 'migration/dayjs.md', title: 'Migration — from Day.js' },
  { file: 'migration/dayjs-compatibility.md', title: 'Migration — Day.js compatibility matrix' },
  { file: 'migration/luxon.md', title: 'Migration — from Luxon' },
  { file: 'migration/moment.md', title: 'Migration — from moment.js' },
  { file: 'migration/temporal.md', title: 'Migration — from raw Temporal' },
  { file: 'migration/v2.md', title: 'Migration — to v2' },
  { file: 'migration/v3.md', title: 'Migration — to v3' },

  // ---- SECURITY --------------------------------------------------
  { file: 'security/index.md', title: 'Security — overview' },
  { file: 'security/threat-model.md', title: 'Security — threat model' },
  { file: 'TEMPORAL_DETECTION.md', title: 'Temporal detection — full document' },

  // ---- ADRs ------------------------------------------------------
  { file: 'adr/README.md', title: 'Architecture decision records (index)' },
  { file: 'adr/0001-use-temporal-api.md', title: 'ADR 0001 — Use the TC39 Temporal API' },
  { file: 'adr/0002-plugin-system.md', title: 'ADR 0002 — Plugin system' },
  { file: 'adr/0003-immutable-wrappers.md', title: 'ADR 0003 — Always return new instances' },
  { file: 'adr/0004-error-codes.md', title: 'ADR 0004 — Stable ATEMPORAL_* error codes' },
  { file: 'adr/0005-parallel-strategies.md', title: 'ADR 0005 — Multiple parallel parse strategies' },
  { file: 'adr/0006-no-opentelemetry-dep.md', title: 'ADR 0006 — No direct OpenTelemetry dependency' },
  { file: 'adr/0007-supply-chain-hardening.md', title: 'ADR 0007 — Supply chain hardening' },

  // ---- SHOWCASE --------------------------------------------------
  { file: 'showcase.md', title: 'Showcase (production users)' },
];

/**
 * Build a curated method index for the public factory and wrapper surface.
 *
 * Kept simple — we want a *signal*, not a complete AST extraction.
 * The entries below are maintained with the public API; documentation
 * contracts execute the recipes and check the advertised member names.
 *
 * @returns {string} the index as a Markdown section
 */
function buildMethodIndex() {
  /** @type {{ kind: 'static' | 'instance', name: string, sig: string, note: string }[]} */
  const entries = [
    // ---- atemporal.* (static / factory) ------------------------------
    { kind: 'static', name: 'atemporal(input?, timeZone?)', sig: '(input?: DateInput, timeZone?: string) => TemporalWrapper', note: 'Create an instance. input may be ISO string, Date, epoch milliseconds (use .unix() for seconds), [y,m,d,h,m,s,ms], plain object, Firebase Timestamp, or another TemporalWrapper.' },
    { kind: 'static', name: 'atemporal.try(input?, timeZone?)', sig: '(input?: DateInput, timeZone?: string) => TemporalWrapper | null', note: 'Compatibility parsing that returns null for invalid input instead of an invalid wrapper.' },
    { kind: 'static', name: 'atemporal.instant(input)', sig: '(InstantInput) => Temporal.Instant', note: 'Raw instant; accepts an offset-bearing ISO string, epoch milliseconds, Date, or an instant. Throws InvalidDateError.' },
    { kind: 'static', name: 'atemporal.date(input)', sig: '(PlainDateInput) => Temporal.PlainDate', note: 'Raw date-only value; rejects calendar overflow.' },
    { kind: 'static', name: 'atemporal.plainDateTime(input)', sig: '(PlainDateTimeInput) => Temporal.PlainDateTime', note: 'Raw civil date-time with no time zone.' },
    { kind: 'static', name: 'atemporal.zonedDateTime(input, options?)', sig: '(ZonedDateTimeInput, ZonedDateTimeOptions?) => Temporal.ZonedDateTime', note: 'Raw zoned value; local input requires timeZone. Defaults to rejecting DST ambiguity and calendar overflow.' },
    { kind: 'static', name: 'atemporal.parse(input, options?)', sig: '(input: DateInput, options?: ParseOptions) => TemporalWrapper', note: 'Strict boundary parser. Defaults to disambiguation: "reject" and overflow: "reject"; throws InvalidDateError.' },
    { kind: 'static', name: 'atemporal.tryParse(input, options?)', sig: '(input: DateInput, options?: ParseOptions) => TemporalWrapper | null', note: 'Strict parser that returns null for every invalid input.' },
    { kind: 'static', name: 'atemporal.iso(input?, timeZone?)', sig: '(input?: DateInput, timeZone?: string) => string | null', note: 'Try to parse and return an ISO 8601 string, or null. Does not throw.' },
    { kind: 'static', name: 'atemporal.validate(input)', sig: '(input: unknown) => ValidationResult', note: 'Detailed validation: { ok: boolean, iso?: string, confidence?: number, reason?: string, code?: ATEMPORAL_* }.' },
    { kind: 'static', name: 'atemporal.duration(spec)', sig: '(spec) => Temporal.Duration', note: 'Build a Temporal.Duration from { years, months, days, hours, minutes, seconds, milliseconds, weeks }.' },
    { kind: 'static', name: 'atemporal.from(input, timeZone?)', sig: '(input, tz?) => TemporalWrapper', note: 'Alias of atemporal(input) — kept for API symmetry with Temporal static methods.' },
    { kind: 'static', name: 'atemporal.unix(seconds)', sig: '(seconds: number) => TemporalWrapper', note: 'Build from a Unix timestamp in SECONDS (e.g. 1752096000).' },
    { kind: 'static', name: 'atemporal.min(...inputs)', sig: '(...inputs) => TemporalWrapper', note: 'Returns the earliest of the given inputs.' },
    { kind: 'static', name: 'atemporal.max(...inputs)', sig: '(...inputs) => TemporalWrapper', note: 'Returns the latest of the given inputs.' },
    { kind: 'static', name: 'atemporal.isValid(input)', sig: '(input) => boolean', note: 'True if input parses without error.' },
    { kind: 'static', name: 'atemporal.isAtemporal(x)', sig: '(x) => boolean', note: 'True if x is a TemporalWrapper instance.' },
    { kind: 'static', name: 'atemporal.isDuration(x)', sig: '(x) => boolean', note: 'True if x is a Temporal.Duration.' },
    { kind: 'static', name: 'atemporal.isValidTimeZone(tz)', sig: '(tz: string) => boolean', note: 'True if tz is a valid IANA time zone.' },
    { kind: 'static', name: 'atemporal.isValidLocale(loc)', sig: '(loc: string) => boolean', note: 'True if loc is a valid BCP-47 locale.' },
    { kind: 'static', name: 'atemporal.isPlugin(x)', sig: '(x) => boolean', note: 'Checks the plugin function marker, with legacy function-shape recognition.' },
    { kind: 'static', name: 'atemporal.extend(plugin, options?)', sig: '(plugin, options?) => void', note: 'Install a plugin synchronously. Calls plugin(Atemporal, atemporal, options); repeated installation of the same function is ignored.' },
    { kind: 'static', name: 'atemporal.lazyLoad(pluginName, options?)', sig: 'async (...) => Promise<void>', note: 'Install one official plugin by name on demand. Resolves after the plugin is applied.' },
    { kind: 'static', name: 'atemporal.lazyLoadMultiple(pluginNames, options?)', sig: 'async (...) => Promise<void>', note: 'Install several official plugins by name.' },
    { kind: 'static', name: 'atemporal.isPluginLoaded(name)', sig: '(name: string) => boolean', note: 'Has the named official plugin been installed yet?' },
    { kind: 'static', name: 'atemporal.getLoadedPlugins()', sig: '() => string[]', note: 'Names of currently installed official plugins. Third-party extensions are not listed.' },
    { kind: 'static', name: 'atemporal.getAppliedExtensions()', sig: '() => AppliedExtension[]', note: 'Detached snapshots of every successful extension, including explicitly named third-party extensions.' },
    { kind: 'static', name: 'atemporal.getAvailablePlugins()', sig: '() => string[]', note: 'Names of official plugins registered with the loader (whether installed or not).' },
    { kind: 'static', name: 'atemporal.getTemporalInfo()', sig: '() => { isNative: boolean, environment: "browser"|"node"|"unknown", version: "native"|"polyfill" }', note: 'Diagnostic info about which Temporal implementation is in use.' },
    { kind: 'static', name: 'atemporal.getDiagnostics()', sig: '() => AtemporalDiagnostics', note: 'Detached runtime/cache snapshot; safe to serialize or inspect.' },
    { kind: 'static', name: 'atemporal.clearCaches()', sig: '() => void', note: 'Clear parsing, formatting, and diff cache entries while retaining defaults.' },
    { kind: 'static', name: 'atemporal.resetDiagnostics()', sig: '() => void', note: 'Clear caches and parser/formatter metrics while retaining defaults.' },
    { kind: 'static', name: 'atemporal.prewarm(options?)', sig: '({ formatPatterns?: string[] }) => void', note: 'Initialize formatting and compile known hot format patterns.' },
    { kind: 'static', name: 'atemporal.setDefaultLocale(loc)', sig: '(loc: string) => void', note: 'Set the global default locale (BCP-47).' },
    { kind: 'static', name: 'atemporal.setDefaultTimeZone(tz)', sig: '(tz: string) => void', note: 'Set the global default IANA time zone. Use "UTC" to restore the initial default.' },
    { kind: 'static', name: 'atemporal.getDefaultLocale()', sig: '() => string', note: 'Current default locale.' },
    { kind: 'static', name: 'atemporal.presets.ISO', sig: 'string', note: '"YYYY-MM-DDTHH:mm:ss.sssZ" — ISO 8601 with milliseconds.' },
    { kind: 'static', name: 'atemporal.presets.ISO_DATE', sig: 'string', note: '"YYYY-MM-DD".' },
    { kind: 'static', name: 'atemporal.presets.ISO_TIME', sig: 'string', note: '"HH:mm:ss.sss".' },
    { kind: 'static', name: 'atemporal.presets.RFC2822', sig: 'string', note: '"ddd, DD MMM YYYY HH:mm:ss ZZ".' },
    { kind: 'static', name: 'atemporal.presets.SQL_DATETIME', sig: 'string', note: '"YYYY-MM-DD HH:mm:ss.SSS".' },
    { kind: 'static', name: 'atemporal.setStrictMode(onOrFlags)', sig: '(boolean | Partial<StrictModeFlags>) => void', note: 'Enable strict-mode checks. Warning configuration; use parse()/tryParse() for strict input validation.' },
    { kind: 'static', name: 'atemporal.isStrictMode()', sig: '() => boolean', note: 'Is strict mode currently on?' },
    { kind: 'static', name: 'atemporal.getStrictModeFlags()', sig: '() => StrictModeFlags', note: 'Current strict-mode flags.' },
    { kind: 'static', name: 'atemporal.clearStrictWarnings()', sig: '() => void', note: 'Reset the accumulated strict-mode warnings.' },

    // ---- TemporalWrapper instance methods -------------------------
    { kind: 'instance', name: 't.add(value, unit) | t.add(duration)', sig: '(number, TimeUnit) or (Temporal.Duration) => TemporalWrapper', note: 'Immutably add. Returns a new instance; never mutates the receiver.' },
    { kind: 'instance', name: 't.subtract(value, unit) | t.subtract(duration)', sig: '(same as add) => TemporalWrapper', note: 'Immutably subtract.' },
    { kind: 'instance', name: 't.set(unit, value)', sig: '(SettableUnit, number) => TemporalWrapper', note: 'Set a single field. Returns a new instance.' },
    { kind: 'instance', name: 't.startOf(unit)', sig: '("year"|"month"|"week"|"day"|"hour"|"minute"|"second") => TemporalWrapper', note: 'Snap down to the start of the given unit.' },
    { kind: 'instance', name: 't.endOf(unit)', sig: '(same as startOf) => TemporalWrapper', note: 'Snap up to the end of the given unit.' },
    { kind: 'instance', name: 't.get(unit)', sig: '(SettableUnit) => number', note: 'Read a single field as a number.' },
    { kind: 'instance', name: 't.dayOfWeek([day?])', sig: '() => number | (day: number) => TemporalWrapper', note: 'Getter when called with no arg, setter (immutable) with one arg.' },
    { kind: 'instance', name: 't.quarter([q?])', sig: '() => number | (q: number) => TemporalWrapper', note: 'Quarter of the year (1-4).' },
    { kind: 'instance', name: 't.format(patternOrOptions?, locale?)', sig: '(string | Intl.DateTimeFormatOptions, locale?) => string', note: 'Format with a token string ("YYYY-MM-DD") or Intl options.' },
    { kind: 'instance', name: 't.diff(other, unit?, float?)', sig: '(input, unit="millisecond", float=false) => number', note: 'Signed difference in the requested unit. Float vs truncated int.' },
    { kind: 'instance', name: 't.isBefore(other)', sig: '(input) => boolean', note: 'Strict less-than comparison.' },
    { kind: 'instance', name: 't.isAfter(other)', sig: '(input) => boolean', note: 'Strict greater-than.' },
    { kind: 'instance', name: 't.isSameOrBefore(other)', sig: '(input) => boolean', note: 'Less-than-or-equal.' },
    { kind: 'instance', name: 't.isSameOrAfter(other)', sig: '(input) => boolean', note: 'Greater-than-or-equal.' },
    { kind: 'instance', name: 't.isSame(other, unit?)', sig: '(DateInput, unit?: "year" | "month" | "day") => boolean', note: 'Without a unit, compares exact instants; calendar units use the receiver time zone.' },
    { kind: 'instance', name: 't.isSameDay(other)', sig: '(input) => boolean', note: 'Convenience for isSame(other, "day").' },
    { kind: 'instance', name: 't.isLeapYear()', sig: '() => boolean', note: 'True for leap years (Gregorian).' },
    { kind: 'instance', name: 't.isValid()', sig: '() => boolean', note: 'True if the wrapper represents a real, parseable instant.' },
    { kind: 'instance', name: 't.timeZone(tz)', sig: '(tz: string) => TemporalWrapper', note: 'Convert immutably to a zone. Read t.timeZoneId or t.raw.timeZoneId to inspect it.' },
    { kind: 'instance', name: 't.clone()', sig: '() => TemporalWrapper', note: 'Returns a new instance with the same value.' },
    { kind: 'instance', name: 't.raw', sig: 'Temporal.ZonedDateTime', note: 'Raw underlying value with full precision; throws for an invalid wrapper.' },
    { kind: 'instance', name: 't.timeZoneId', sig: 'string', note: 'Read the current time-zone identifier.' },
    { kind: 'instance', name: 't.range(end, unit, options?)', sig: '(DateInput, TimeUnit, RangeOptions?) => TemporalWrapper[] | string[]', note: 'Generate a range; supplying options.format produces formatted strings.' },
    { kind: 'instance', name: 't.isBetween(start, end, inclusivity?)', sig: '(DateInput, DateInput, inclusivity="[]") => boolean', note: 'Compare bounds with (), [], (], or [) inclusivity.' },
    { kind: 'instance', name: 't.toDate()', sig: '() => Date', note: 'Legacy Date representing the same instant, with millisecond precision; Date does not retain the IANA zone.' },
    { kind: 'instance', name: 't.toISOString()', sig: '() => string', note: 'UTC ISO string with three millisecond digits and Z, equivalent to t.toDate().toISOString(); throws RangeError for invalid instances.' },
    { kind: 'instance', name: 't.toString()', sig: '() => string', note: 'ISO string with offset; use t.raw.toString() to preserve the zone annotation and full nanoseconds.' },
  ];

  const statics = entries.filter((e) => e.kind === 'static');
  const instances = entries.filter((e) => e.kind === 'instance');

  const tableCode = (value) => value.replace(/[\\|]/g, '\\$&');
  const rowFmt = (e) =>
    `| \`${tableCode(e.name)}\` | \`${tableCode(e.sig)}\` | ${e.note} |`;

  const head = `| Method | Signature | Notes |
| --- | --- | --- |`;

  return [
    '## Method index',
    '',
    '> A curated index of the public factory, wrapper, and plugin surface. Use this as a quick reference before reading the long-form guides below.',
    '',
    '### Static / factory (`atemporal.*`)',
    '',
    head,
    ...statics.map(rowFmt),
    '',
    '### Instance methods (on a `TemporalWrapper`)',
    '',
    head,
    ...instances.map(rowFmt),
    '',
    '### Plugins (extend the wrapper)',
    '',
    '| Plugin | Extends with | Import path |',
    '| --- | --- | --- |',
    '| relativeTime | `.fromNow()`, `.toNow()` | `atemporal/plugins/relativeTime` |',
    '| customParseFormat | `atemporal.fromFormat(str, pattern, timeZone?)` | `atemporal/plugins/customParseFormat` |',
    '| advancedFormat | Format tokens `Do`, `Qo`, `zzz`, `zzzz` in `.format()` | `atemporal/plugins/advancedFormat` |',
    '| weekDay | `.weekday()`, `atemporal.setWeekStartsOn(day)`, `.startOf("week")`, `.endOf("week")` | `atemporal/plugins/weekDay` |',
    '| durationHumanizer | `atemporal.humanize(durationLike, options?)` | `atemporal/plugins/durationHumanizer` |',
    '| dateRangeOverlap | `atemporal.checkDateRangeOverlap(a, b)`, `.rangeOverlapsWith(range)`, `.to(end)` | `atemporal/plugins/dateRangeOverlap` |',
    '| businessDays | `.isBusinessDay()`, `.isHoliday()`, `.isWeekend()`, `.addBusinessDays(n)`, `.subtractBusinessDays(n)`, `.nextBusinessDay()` | `atemporal/plugins/businessDays` |',
    '| timeSlots | `atemporal.findAvailableSlots({ range, duration, interval?, busySlots })` | `atemporal/plugins/timeSlots` |',
    '',
  ].join('\n');
}

function buildEntryContract() {
  return [
    '## v3 entry contract',
    '',
    '| Factory entry | Build/runtime requirement | Matching plugin prefix |',
    '| --- | --- | --- |',
    '| `atemporal` (ESM) | ES2022 and top-level await; conditional fallback import | `atemporal/plugins/` |',
    '| `atemporal` (CommonJS) | Synchronous require; fallback only when needed | `atemporal/plugins/` |',
    '| `atemporal/compat` | ES2020/IIFE; static fallback import | `atemporal/compat/plugins/` |',
    '| `atemporal/native` | ES2020; complete global Temporal required | `atemporal/native/plugins/` |',
    '',
    'Use the same entry family for the factory, named errors/helpers, and plugins. Date operations stay synchronous after import. Default browser download savings require code splitting; total output still includes optional fallback/plugin chunks. Native entry builds exclude fallback code, while the installed package retains its direct polyfill dependency. Leave globalThis.Temporal unchanged after initialization.',
    '',
    'Default/native roots no longer export `dateRangeOverlapPlugin`, `businessDaysPlugin`, `timeSlotsPlugin`, `checkDateRangeOverlap`, `InvalidDateRangeError`, or `OverlapDetectionError`. Import plugins/helpers from their matching subpaths. The compat root preserves all six legacy named exports. No Temporal runtime object is exported from the root. Public Temporal types are self-contained for TypeScript 5.4+.',
    '',
    'See [Migrating to v3](https://naturaldevcr.github.io/atemporal/migration/v3.html) for complete examples.',
    '',
  ].join('\n');
}

/**
 * Build the TL;DR header. The goal is to give a coding agent enough
 * context to start writing code without reading 5 000 lines first.
 */
function buildTldr() {
  return [
    '# Atemporal — LLM-friendly documentation',
    '',
    '> Concise operational guide for the v3 public API. Read `llms-full.txt` for',
    '> the complete reference. Both files are regenerated on every docs build by',
    '> `scripts/generate-llms-txt.js`. Do not edit it by hand.',
    '',
    '## TL;DR for coding agents',
    '',
    '- **Install:** prefer `pnpm add atemporal`; `npm install atemporal` is equivalent for consumers. `@js-temporal/polyfill` is a direct runtime dependency and is installed automatically.',
    '- **Import (ESM):** `import atemporal from "atemporal";` (default export, callable).',
    "- **Import (CommonJS):** `const { default: atemporal } = require('atemporal');`.",
    '- **Construct:** `atemporal()` (now) / `atemporal(input, tz?)` / `atemporal.unix(s)` / `atemporal.validate(x)`. At untrusted-input boundaries use `atemporal.parse(input, options)` or `atemporal.tryParse(input, options)`.',
    '- **Strict parsing:** `atemporal.parse` defaults to `disambiguation: "reject"` and `overflow: "reject"`; explicitly choose `"earlier"`, `"later"`, or `"compatible"` only when your domain policy requires it.',
    '- **Model and compatibility:** the principal representation is `Temporal.ZonedDateTime`. The API is Day.js-inspired but does not promise full Day.js compatibility; check the compatibility matrix before a migration.',
    '- **Immutable:** every mutator returns a NEW `TemporalWrapper`. Assign the returned value, for example `const next = current.add(1, "day");`.',
    '- **Plugins:** synchronously install any plugin with `atemporal.extend(plugin)`. Lazy loading accepts an official plugin name: `await atemporal.lazyLoad("relativeTime")`. `getLoadedPlugins()` reports only official plugins; use `getAppliedExtensions()` to inspect explicitly identified third-party extensions too.',
    '- **Diagnostics:** use `atemporal.getDiagnostics()`, `clearCaches()`, `resetDiagnostics()`, and `prewarm()`; do not import `atemporal/src/...` in consumer code. Deprecated `Atemporal.getFormattingMetrics().tokenPoolStats` fields are zero in v3; prewarm still compiles formats.',
    '- **Time zones:** always pass an explicit IANA TZ to functions that compare or persist. The configured default starts at UTC; specify the domain zone before calendar operations.',
    '- **Serialization:** wrapper `.toString()` preserves local time and offset. Use `.toISOString()` (equivalent to `.toDate().toISOString()`) for UTC `Z` strings with three millisecond digits in database fields sorted as strings; invalid wrappers throw `RangeError`.',
    '- **Temporal runtime:** call `atemporal.getTemporalInfo()` to inspect the implementation. Do not assume `globalThis.Temporal` exists. Choose the v3 entry contract below; date operations remain synchronous after import.',
    '- **Compatibility contract:** pull-request CI tests the packed npm artifact for installation, ESM and CommonJS imports, type resolution, core operations, formatting, and official plugin loading on Node 22, 24, and 26. Release validation additionally covers Vite, Webpack, and Next.js SSR fixtures.',
    '- **Errors:** import named errors such as `InvalidDateError`, `AtemporalError`, and `ATEMPORAL_ERROR_CODES` from the same entry family as the factory. Catch on the boundary, not deep in business logic.',
    '- **Value categories:** `instant()`, `date()`, `plainDateTime()`, and `zonedDateTime()` return raw Temporal values. Use `parse()`/`tryParse()` for a chainable wrapper with `.format()` and plugin methods. Create wrapper duration arguments with `atemporal.duration(like)`.',
    '- **Size:** See `size-report.md` in the `package-artifact-reports` artifact on [GitHub Actions](https://github.com/NaturalDevCR/atemporal/actions/workflows/ci.yml). It reports core, packed-tarball, and application-bundle measurements separately, including the application-bundle cost of `@js-temporal/polyfill`.',
    '- **License and releases:** MIT, with the Temporal declaration attribution in LICENSE. Releases use npm trusted publishing, provenance, and SPDX/CycloneDX SBOMs.',
    '',
    buildEntryContract(),
    '### Common recipes',
    '',
    '```ts',
    'import atemporal from "atemporal";',
    '',
    '// Convert to the business zone before finding its midnight',
    'const midnight = atemporal().timeZone("America/New_York").startOf("day");',
    '',
    '// Preserve a timestamp at nanosecond precision with a raw instant',
    'const instant = atemporal.instant("2026-07-15T10:00:00.123456789Z");',
    'const timestamp = instant.toString();',
    '',
    '// Add business days with an explicit holiday configuration',
    'await atemporal.lazyLoad("businessDays");',
    'atemporal.setBusinessDaysConfig({ holidays: ["2026-07-20"] });',
    'const deadline = atemporal("2026-07-17", "America/Costa_Rica").addBusinessDays(1);',
    '',
    '// Humanize a duration after installing the official plugin',
    'await atemporal.lazyLoad("durationHumanizer");',
    'const duration = atemporal.duration({ hours: 2, minutes: 30 });',
    'const humanized = atemporal.humanize(duration, { locale: "en" });',
    '',
    '// Validate untrusted input with a strict, explicit DST policy',
    'const parsed = atemporal.tryParse("not a date", { timeZone: "America/Costa_Rica" });',
    '',
    '// Format a valid wrapper in a chosen locale',
    'const formatted = atemporal.parse("2026-07-15T10:00:00Z").format({ dateStyle: "full" }, "es-CR");',
    '```',
    '',
  ].join('\n');
}

function readSection(section) {
  const fullPath = path.join(docsDir, section.file);
  if (!fs.existsSync(fullPath)) {
    return `<!-- WARNING: source file not found: ${section.file} -->`;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function buildConciseGuide() {
  return [
    buildTldr(),
    '## Choose the public API',
    '',
    '| Case | Public API | Timezone rule | Failure result |',
    '| --- | --- | --- | --- |',
    '| Event instant | `atemporal.instant(value)` | Offset-bearing string or exact instant | `InvalidDateError` |',
    '| Scheduled event | `atemporal.zonedDateTime(value, { timeZone })` | Explicit zone required for local input | `InvalidDateError`; rejects DST ambiguity |',
    '| Local civil date-time | `atemporal.plainDateTime(value)` | Zone-free raw value | `InvalidDateError` |',
    '| Date-only value | `atemporal.date(value)` | Zone-free raw value | `InvalidDateError` |',
    '| Chainable strict wrapper | `atemporal.parse` / `tryParse` | Choose a domain zone for local input | `InvalidDateError` / `null` |',
    '| Compatibility parsing | `atemporal(input)` | Optional zone preserves v1 behavior | Invalid wrapper |',
    '| Formatting | `wrapper.format(pattern)` | Convert the wrapper to the domain zone first | Invalid wrappers format as `"Invalid Date"` |',
    '| Duration | `atemporal.duration(like)` | No zone | Temporal conversion error |',
    '| Range | `value.range(...)` | Keep both ends in a known zone | Invalid wrapper/error |',
    '| Official plugin | `extend(plugin)` / `lazyLoad(name)` | No zone | Plugin load error |',
    '| Third-party extension | `extend(markAsPlugin(...))` | No zone | Extension error |',
    '',
    'Raw Temporal values do not have wrapper `.format()`, range, or plugin methods. For complete API signatures, migration matrices, plugin guides, and cookbook recipes read `llms-full.txt`.',
    '',
  ].join('\n');
}

function buildFullGuide() {
  const out = [];
  out.push('# Atemporal — complete LLM reference');
  out.push('');
  out.push('> Generated from public consumer documentation. Use `llms.txt` for the concise operational guide.');
  out.push('');
  out.push(buildEntryContract());
  out.push(buildMethodIndex());
  out.push(
    [
      '---',
      '',
      '# Full documentation (concatenated, in reading order)',
      '',
      '> The rest of this file is the long-form documentation, in the order',
      '> we recommend a coding agent read it. Skip sections you do not need.',
      '',
    ].join('\n'),
  );

  for (const section of SECTIONS) {
    out.push(`\n\n--- FILE: ${section.file} (${section.title}) ---\n\n`);
    out.push(readSection(section));
  }

  return `${out.join('\n')}\n`;
}

function writeGuide(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');

  const lines = content.split('\n').length;
  const bytes = Buffer.byteLength(content, 'utf8');
  process.stdout.write(
    `Generated ${path.relative(repoRoot, file)} — ${lines.toLocaleString()} lines, ${(
      bytes / 1024
    ).toFixed(1)} KB\n`,
  );
}

function build() {
  writeGuide(conciseOutPath, `${buildConciseGuide().trimEnd()}\n`);
  writeGuide(fullOutPath, buildFullGuide());
}

build();
