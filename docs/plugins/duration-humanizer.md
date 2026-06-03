# durationHumanizer

Converts `Temporal.Duration` objects into human-readable, localized strings.

## Usage

```ts
import atemporal from "atemporal";
import durationHumanizer from "atemporal/plugins/durationHumanizer";

atemporal.extend(durationHumanizer);

const duration = { hours: 2, minutes: 30 };
console.log(atemporal.humanize(duration)); // "2 hours and 30 minutes"
```

## Multi-Language Support

```ts
atemporal.humanize(duration, { locale: "es" }); // "2 horas y 30 minutos"
atemporal.humanize(duration, { locale: "ja" }); // "2時間30分"
atemporal.humanize(duration, { locale: "fr" }); // "2 heures et 30 minutes"
atemporal.humanize(duration, { locale: "de" }); // "2 Stunden und 30 Minuten"
atemporal.humanize(duration, { locale: "it" }); // "2 ore e 30 minuti"
atemporal.humanize(duration, { locale: "pt" }); // "2 horas e 30 minutos"
atemporal.humanize(duration, { locale: "ru" }); // "2 часа и 30 минут"
atemporal.humanize(duration, { locale: "ko" }); // "2시간 30분"
atemporal.humanize(duration, { locale: "zh" }); // "2小时30分钟"
```

### Supported Languages

The plugin includes localized unit names for 10 languages: English (`en`), Spanish (`es`), French (`fr`), German (`de`), Italian (`it`), Portuguese (`pt`), Russian (`ru`), Japanese (`ja`), Korean (`ko`), and Chinese (`zh`).

## Options

```ts
interface HumanizeOptions {
  locale?: string;       // Default: "en"
  listStyle?: "long" | "short" | "narrow";
  unitDisplay?: "long" | "short" | "narrow";
}
```

**`listStyle`** controls how units are joined:

```ts
const dur = { hours: 3, minutes: 45, seconds: 30 };

atemporal.humanize(dur, { listStyle: "long" });   // "3 hours, 45 minutes, and 30 seconds"
atemporal.humanize(dur, { listStyle: "short" });  // "3 hr, 45 min, and 30 sec"
atemporal.humanize(dur, { listStyle: "narrow" }); // "3h 45m 30s"
```

**`unitDisplay`** controls individual unit labels:

```ts
const dur = { hours: 2, minutes: 30 };

atemporal.humanize(dur, { unitDisplay: "long" });  // "2 hours and 30 minutes"
atemporal.humanize(dur, { unitDisplay: "short" }); // "2 hr and 30 min"
atemporal.humanize(dur, { unitDisplay: "narrow" });// "2h 30m"
```

## Edge Cases

```ts
// Zero duration
atemporal.humanize({ hours: 0 }); // "0 seconds"

// Empty duration
atemporal.humanize({}); // "0 seconds"

// Very large durations
atemporal.humanize({ days: 400 }); // "1 year, 1 month, and 5 days" (approx.)

// Only one unit
atemporal.humanize({ minutes: 45 }); // "45 minutes"
```

## Fallback System

The plugin first attempts to use `Intl.NumberFormat` with unit style for the requested locale. If that fails (the locale doesn't support unit formatting), it falls back to a built-in localized unit mapping with support for all 10 languages.

## Cache Management

The plugin caches `Intl.NumberFormat` instances and formatted results:

```ts
// Clear the humanizer cache
atemporal.clearDurationHumanizerCache();

// Get cache statistics
const stats = atemporal.getDurationHumanizerCacheStats();
console.log(stats);
// { size: number, hits: number, misses: number, hitRatio: number, ... }
```
