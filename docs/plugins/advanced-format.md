# advancedFormat

Extends the `.format()` method to support advanced formatting tokens including ordinals and timezone names.

## Usage

```ts
import atemporal from "atemporal";
import advancedFormat from "atemporal/plugins/advancedFormat";

atemporal.extend(advancedFormat);

const date = atemporal("2024-01-15");
console.log(date.format("Do MMMM YYYY")); // "15th January 2024"
```

## Advanced Tokens

| Token  | Output Example          | Description                           |
| ------ | ----------------------- | ------------------------------------- |
| `Do`   | `1st`, `22nd`, `15th`   | Day of month with ordinal suffix      |
| `Qo`   | `1st`, `2nd`, `3rd`     | Quarter of year with ordinal suffix   |
| `zzz`  | `EST`, `PDT`, `CST`     | Short localized time zone name (abbreviation) |
| `zzzz` | `Eastern Standard Time` | Long localized time zone name (full)  |

## Multi-Language Support

Ordinal suffixes are supported for several languages: `en`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `ja`, `ko`, `zh`.

```ts
// English
atemporal("2024-01-15").format("Do [of] MMMM", "en"); // "15th of January"

// Spanish
atemporal("2024-01-15").format("Do [de] MMMM", "es"); // "15º de enero"

// French
atemporal("2024-01-01").format("Do MMMM", "fr"); // "1er janvier"

// Japanese (ordinal is just the number + 日)
atemporal("2024-01-15").format("MMMM Do", "ja"); // "1月15日"

// Korean
atemporal("2024-01-15").format("MMMM Do", "ko"); // "1월 15일"
```

## Timezone Name Tokens

The `zzz` and `zzzz` tokens extract timezone names using `Intl.DateTimeFormat.formatToParts()`. Availability depends on browser/runtime support:

```ts
const ny = atemporal("2024-06-15T12:00:00", "America/New_York");
const tokyo = atemporal("2024-06-15T12:00:00", "Asia/Tokyo");

ny.format("zzz");   // "EDT" (Eastern Daylight Time)
ny.format("zzzz");  // "Eastern Daylight Time"

tokyo.format("zzz");  // "JST" (Japan Standard Time)
tokyo.format("zzzz"); // "Japan Standard Time"
```

> [!NOTE]
> Timezone name abbreviations (`zzz`) may vary by browser and locale. Not all runtimes support `formatToParts()` for timezone names.

## Combining Tokens

Mix advanced tokens with standard format tokens:

```ts
const date = atemporal("2024-06-15T14:30:00", "Europe/London");

// Ordinals + month names + timezone
date.format("dddd, Do MMMM YYYY [at] HH:mm (zzzz)");
// "Saturday, 15th June 2024 at 14:30 (British Summer Time)"

// Quarter with ordinal
date.format("Qo [quarter of] YYYY"); // "2nd quarter of 2024"
```

## Cache Management

The plugin caches ordinal suffixes and timezone name lookups:

```ts
// Clear the advanced format cache
atemporal.clearAdvancedFormatCache();

// Get cache statistics
const stats = atemporal.getAdvancedFormatCacheStats();
console.log(stats);
// { size: number, hits: number, misses: number, hitRatio: number, ... }
```
