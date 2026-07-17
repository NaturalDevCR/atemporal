# v1 API Contract Design

## Goal

Add explicit, strict parsing; a supported diagnostics surface; and reliable
third-party extension inspection without changing the existing factory or the
official-plugin contract.

## Scope

This is a backward-compatible v1.5 release. `atemporal(input, timeZone?)`,
`atemporal.try`, `extend`, `lazyLoad`, and `getLoadedPlugins()` retain their
current behaviour. No internal `src/` import becomes part of the public API.

## Public parsing API

Add these exported types and factory methods:

```ts
export type AtemporalDisambiguation = "compatible" | "earlier" | "later" | "reject";
export type AtemporalOverflow = "constrain" | "reject";

export interface ParseOptions {
  timeZone?: string;
  disambiguation?: AtemporalDisambiguation;
  overflow?: AtemporalOverflow;
  preserveOriginalTimeZone?: boolean;
}

atemporal.parse(input: DateInput, options?: ParseOptions): TemporalWrapper;
atemporal.tryParse(input: DateInput, options?: ParseOptions): TemporalWrapper | null;
```

`parse` must produce a valid wrapper or throw an existing typed parsing error.
`tryParse` must return the same valid wrapper as `parse`, or `null`, and never
throw for user input. Both methods must use only the documented input types.

For zone-less local input, `timeZone` uses the configured default when omitted.
For DST overlaps and gaps, `disambiguation` defaults to `"reject"`; callers
must opt into `"earlier"`, `"later"`, or `"compatible"`. Calendar overflow
defaults to `"reject"`. An input that already carries an offset or zone retains
it unless `preserveOriginalTimeZone` is explicitly `false`.

The existing callable factory remains permissive and keeps its current invalid
wrapper behaviour. This separation lets new application boundaries select an
auditable strict policy without breaking Day.js-style consumer code.

## Public diagnostics API

Expose a small, read-only factory surface rather than documenting deep imports:

```ts
interface AtemporalDiagnostics {
  temporal: ReturnType<typeof atemporal.getTemporalInfo>;
  caches: {
    parsing: Record<string, unknown>;
    formatting: Record<string, unknown>;
    diff: Record<string, unknown>;
  };
}

atemporal.getDiagnostics(): AtemporalDiagnostics;
atemporal.resetDiagnostics(): void;
atemporal.clearCaches(): void;
atemporal.prewarm(options?: { formatPatterns?: readonly string[] }): void;
```

Returned diagnostics are snapshots, never mutable cache instances. `clearCaches`
does not change locale, time zone, plugin state, or application data.
`resetDiagnostics` resets counters and caches. The v1 API deliberately does not
expose parser auto-tuning or benchmark controls.

## Extension inspection API

Keep `getLoadedPlugins()` official-only. Add metadata for third-party extension
authors without using function names as identity:

```ts
export interface ExtensionMetadata {
  id: string;
  official?: false;
}

export interface AppliedExtension {
  id: string | null;
  kind: "official" | "third-party";
}

markAsPlugin(plugin, metadata?: OfficialPluginMetadata | ExtensionMetadata);
atemporal.getAppliedExtensions(): readonly AppliedExtension[];
```

An extension without explicit metadata appears as `{ id: null, kind:
"third-party" }`. Official metadata remains restricted to the existing
`OfficialPluginName` union. The result is a snapshot with no plugin function or
options reference. Applying the same function more than once remains idempotent.

## Documentation and tests

Replace every consumer-facing `atemporal/src/...` import in the performance
guide with the new factory methods. Add an API reference page for strict parsing,
DST policy, diagnostics, and extension inspection. The generated LLM guides
must teach `parse` for trusted application boundaries and the existing factory
for compatibility-oriented code.

Tests must cover each DST policy at a real spring-forward gap and fall-back
overlap in `America/New_York`, overflow rejection, `tryParse` non-throwing
behaviour, snapshots from diagnostics, cache reset semantics, anonymous
extensions, metadata extensions, and official-only plugin reporting.

## Non-goals

- Changing the existing callable factory's parsing semantics.
- Accepting undocumented arbitrary object shapes.
- Exporting `TemporalUtils`, cache classes, parse strategies, or parser tuning.
- Adding framework-specific integrations.
