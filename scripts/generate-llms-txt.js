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
const outPath = path.join(docsDir, 'public', 'llms.txt');

/** @typedef {{ file: string, title?: string }} Section */

/** @type {Section[]} */
const SECTIONS = [
  // ---- OVERVIEW --------------------------------------------------
  { file: 'index.md', title: 'Project overview' },
  { file: 'guide/index.md', title: 'Guide index' },

  // ---- ONBOARDING ------------------------------------------------
  { file: 'guide/getting-started.md', title: 'Getting started' },
  { file: 'guide/core-concepts.md', title: 'Core concepts' },
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
 * Build a method index by scanning the source for `atemporal.*` static
 * methods and the public `TemporalWrapper` instance methods.
 *
 * Kept simple — we want a *signal*, not a complete AST extraction.
 * The JSDoc-style definitions below mirror the source exactly; if you
 * add a method, add it here too.
 *
 * @returns {string} the index as a Markdown section
 */
function buildMethodIndex() {
  /** @type {{ kind: 'static' | 'instance', name: string, sig: string, note: string }[]} */
  const entries = [
    // ---- atemporal.* (static / factory) ------------------------------
    { kind: 'static', name: 'atemporal(input?, timeZone?)', sig: '(input?: DateInput, timeZone?: string) => TemporalWrapper', note: 'Create an instance. input may be ISO string, Date, Unix ms, Unix s, [y,m,d,h,m,s,ms], plain object, Firebase Timestamp, or another TemporalWrapper.' },
    { kind: 'static', name: 'atemporal.try(input?, timeZone?)', sig: '(input?: DateInput, timeZone?: string) => TemporalWrapper | null', note: 'Same as atemporal(input) but returns null instead of throwing on invalid input.' },
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
    { kind: 'static', name: 'atemporal.isPlugin(x)', sig: '(x) => boolean', note: 'True if x is a Plugin object (has .name and an install hook).' },
    { kind: 'static', name: 'atemporal.extend(plugin, options?)', sig: '(plugin, options?) => void', note: 'Install a plugin synchronously. Options are passed to the plugin.install() hook.' },
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
    { kind: 'static', name: 'atemporal.setDefaultTimeZone(tz)', sig: '(tz: string) => void', note: 'Set the global default IANA time zone. Pass "system" to reset to the host TZ.' },
    { kind: 'static', name: 'atemporal.getDefaultLocale()', sig: '() => string', note: 'Current default locale.' },
    { kind: 'static', name: 'atemporal.presets.ISO', sig: 'string', note: '"YYYY-MM-DDTHH:mm:ss.SSSZ" — canonical ISO 8601 with milliseconds.' },
    { kind: 'static', name: 'atemporal.presets.ISO_DATE', sig: 'string', note: '"YYYY-MM-DD".' },
    { kind: 'static', name: 'atemporal.presets.ISO_TIME', sig: 'string', note: '"HH:mm:ss".' },
    { kind: 'static', name: 'atemporal.presets.RFC2822', sig: 'string', note: '"ddd, DD MMM YYYY HH:mm:ss Z".' },
    { kind: 'static', name: 'atemporal.presets.SQL', sig: 'string', note: '"YYYY-MM-DD HH:mm:ss.SSS".' },
    { kind: 'static', name: 'atemporal.setStrictMode(flags)', sig: '() => void', note: 'Enable strict-mode checks. See ADR 0004 + src/core/strict-mode.ts.' },
    { kind: 'static', name: 'atemporal.isStrictMode()', sig: '() => boolean', note: 'Is strict mode currently on?' },
    { kind: 'static', name: 'atemporal.getStrictModeFlags()', sig: '() => StrictModeFlags', note: 'Current strict-mode flags.' },
    { kind: 'static', name: 'atemporal.clearStrictWarnings()', sig: '() => void', note: 'Reset the accumulated strict-mode warnings.' },

    // ---- TemporalWrapper instance methods -------------------------
    { kind: 'instance', name: 't.add(value, unit?) | t.add(duration)', sig: '(number|"year"|"month"|"week"|"day"|"hour"|"minute"|"second"|"millisecond", unit) => TemporalWrapper', note: 'Immutably add. Returns a new instance; never mutates the receiver.' },
    { kind: 'instance', name: 't.subtract(value, unit?) | t.subtract(duration)', sig: '(same as add) => TemporalWrapper', note: 'Immutably subtract.' },
    { kind: 'instance', name: 't.set(unit, value)', sig: '("year"|"month"|"day"|"hour"|"minute"|"second"|"millisecond"|"week"|"dayOfWeek", number) => TemporalWrapper', note: 'Set a single field. Returns a new instance.' },
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
    { kind: 'instance', name: 't.isSame(other, unit?)', sig: '(input, unit="millisecond") => boolean', note: 'Equality in the given unit. isSame(a,"day") is true if they fall on the same calendar day in the default TZ.' },
    { kind: 'instance', name: 't.isSameDay(other)', sig: '(input) => boolean', note: 'Convenience for isSame(other, "day").' },
    { kind: 'instance', name: 't.isLeapYear()', sig: '() => boolean', note: 'True for leap years (Gregorian).' },
    { kind: 'instance', name: 't.isValid()', sig: '() => boolean', note: 'True if the wrapper represents a real, parseable instant.' },
    { kind: 'instance', name: 't.timeZone([tz?])', sig: '() => string | (tz: string) => TemporalWrapper', note: 'Get the IANA TZ when called with no arg; convert immutably with one arg.' },
    { kind: 'instance', name: 't.clone()', sig: '() => TemporalWrapper', note: 'Returns a new instance with the same value.' },
    { kind: 'instance', name: 't.toDate()', sig: '() => Date', note: 'Native JS Date in the wrapper\'s TZ.' },
    { kind: 'instance', name: 't.toString()', sig: '() => string', note: 'ISO 8601 representation in the wrapper\'s TZ.' },
  ];

  const statics = entries.filter((e) => e.kind === 'static');
  const instances = entries.filter((e) => e.kind === 'instance');

  const rowFmt = (e) =>
    `| \`${e.name}\` | \`${e.sig}\` | ${e.note} |`;

  const head = `| Method | Signature | Notes |
| --- | --- | --- |`;

  return [
    '## Method index',
    '',
    '> A flat alphabetised (by section) index of the public surface. Use this as a quick reference before reading the long-form guides below.',
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
    '| relativeTime | `.fromNow()`, `.toNow()`, `.from(other)`, `.to(other)` | `atemporal/plugins/relativeTime` |',
    '| customParseFormat | `.fromFormat(str, pattern)` (instance + static) | `atemporal/plugins/customParseFormat` |',
    '| advancedFormat | Format tokens `Do`, `Qo`, `zzz`, `zzzz` in `.format()` | `atemporal/plugins/advancedFormat` |',
    '| weekDay | `.weekday()`, `.weekday(d)`, `.startOf("isoWeek")`, locale-aware week starts | `atemporal/plugins/weekDay` |',
    '| durationHumanizer | `atemporal.duration().humanize()` | `atemporal/plugins/durationHumanizer` |',
    '| dateRangeOverlap | `atemporal.overlapRanges(a, b)` and `.overlaps(other)` | `atemporal/plugins/dateRangeOverlap` |',
    '| businessDays | `.isBusinessDay()`, `.isHoliday()`, `.isWeekend()`, `.addBusinessDays(n)`, `.subtractBusinessDays(n)`, `.nextBusinessDay()` | `atemporal/plugins/businessDays` |',
    '| timeSlots | `atemporal.findAvailableSlots({ range, duration, interval?, busySlots })` | `atemporal/plugins/timeSlots` |',
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
    '> This file is a curated concatenation of the atemporal documentation,',
    '> ordered for coding agents. It is regenerated on every docs build by',
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
    '- **Immutable:** every mutator returns a NEW `TemporalWrapper`. Never use `let` to "update" a date — use `const next = current.add(1, "day");`.',
    '- **Plugins:** synchronously install any plugin with `atemporal.extend(plugin)`. Lazy loading accepts an official plugin name: `await atemporal.lazyLoad("relativeTime")`. `getLoadedPlugins()` reports only official plugins; use `getAppliedExtensions()` to inspect explicitly identified third-party extensions too.',
    '- **Diagnostics:** use `atemporal.getDiagnostics()`, `clearCaches()`, `resetDiagnostics()`, and `prewarm()`; do not import `atemporal/src/...` in consumer code.',
    '- **Time zones:** always pass an explicit IANA TZ to functions that compare or persist. Relying on the host TZ is a bug.',
    '- **Temporal runtime:** call `atemporal.getTemporalInfo()` to observe the selected native or polyfill implementation. CI verifies the native path on Node 26; do not infer native support from an arbitrary runtime version. The polyfill is statically imported, so native runtime selection does not by itself remove it from an application bundle.',
    '- **Compatibility contract:** pull-request CI tests the packed npm artifact for installation, ESM and CommonJS imports, type resolution, core operations, formatting, and official plugin loading on Node 22, 24, and 26. Release validation additionally covers Vite, Webpack, and Next.js SSR fixtures.',
    '- **Errors:** import named errors such as `InvalidDateError`, `AtemporalError`, and `ATEMPORAL_ERROR_CODES` from `atemporal`. Catch on the boundary, not deep in business logic.',
    '- **Type-safe:** full TypeScript declarations ship in the package. Prefer `Temporal.Duration`-shaped arguments over `(value, unit)` pairs when you have them.',
    '- **Size:** Core, packed-tarball, and application-bundle measurements are reported separately; see the [generated size report](https://github.com/NaturalDevCR/atemporal/blob/main/reports/size-report.md). `@js-temporal/polyfill` is a direct runtime dependency, and its application-bundle cost is measured separately.',
    '- **License:** MIT. SBOM + signed releases (npm `--provenance`) on every release since v1.4.0.',
    '',
    '### Common recipes (1-liners)',
    '',
    '```ts',
    '// Today, midnight, in a specific TZ',
    'atemporal().startOf("day").timeZone("America/New_York")',
    '',
    '// Add 30 days, excluding weekends and a holiday list',
    'atemporal("2025-01-01").add(30, "day") /* then plugin: .addBusinessDays(30) */',
    '',
    '// Human-readable diff',
    'atemporal.duration({ hours: 2, minutes: 30 }).humanize() // "2.5 hours"',
    '',
    '// Validate untrusted input without throwing',
    'const ok = atemporal.try(userInput)?.isValid() ?? false;',
    '',
    '// Format in any BCP-47 locale',
    'atemporal("2025-01-01").format({ dateStyle: "full" }, "es-CR")',
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

function build() {
  const out = [];
  out.push(buildTldr());
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

  const content = out.join('\n');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');

  const lines = content.split('\n').length;
  const bytes = Buffer.byteLength(content, 'utf8');
  process.stdout.write(
    `Generated ${path.relative(repoRoot, outPath)} — ${lines.toLocaleString()} lines, ${(
      bytes / 1024
    ).toFixed(1)} KB\n`,
  );
}

build();
