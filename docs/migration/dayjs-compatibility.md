# Day.js compatibility matrix

Reviewed against Day.js 1.11.21.

This is a scoped migration guide, not a claim that Day.js and atemporal are
interchangeable. Atemporal's principal representation is
`Temporal.ZonedDateTime`; use the linked guidance when a row identifies a
semantic difference.

## Categories

| Category | Meaning |
| --- | --- |
| Compatible | The call and semantic result are equivalent. |
| Equivalent with semantic differences | Migration is mechanical, but temporal zone, parsing, unit, indexing, or returned type differs. |
| Plugin required | The capability is available after installing and extending the stated plugin. |
| Not supported | No publicly guaranteed equivalent exists. |
| Different recommended approach | Atemporal handles the use case, but imitating Day.js would be conceptually incorrect. |

## Reviewed API areas

| Area | Day.js 1.11.21 | Atemporal | Category | Migration note |
| --- | --- | --- | --- | --- |
| Construction | `dayjs(input)` | `atemporal(input)` | Equivalent with semantic differences | Both construct a date-time wrapper, but atemporal uses `Temporal.ZonedDateTime`; review [construction and representation](dayjs.md#construction-and-representation). |
| Unix seconds | `dayjs.unix(seconds)` | `atemporal.unix(seconds)` | Equivalent with semantic differences | Both accept Unix seconds; atemporal returns its Temporal-backed wrapper. See [construction and representation](dayjs.md#construction-and-representation). |
| Immutable add / subtract | `date.add()` / `date.subtract()` | `date.add()` / `date.subtract()` | Equivalent with semantic differences | Both return a new instance; review Temporal-backed calendar and time-zone behavior in [adding, subtracting, and comparisons](dayjs.md#adding-subtracting-and-comparisons). |
| Formatting tokens | `date.format(tokens)` | `date.format(tokens)` | Equivalent with semantic differences | Common tokens are familiar, but advanced tokens and locale data are not a blanket compatibility promise; see [formatting and locales](dayjs.md#formatting-and-locales). |
| Comparisons | `isBefore`, `isSame`, `isAfter`, `isBetween` | `isBefore`, `isSame`, `isAfter`, `isBetween` | Equivalent with semantic differences | Review unit, range, and zone-sensitive behavior in [adding, subtracting, and comparisons](dayjs.md#adding-subtracting-and-comparisons). |
| Time zones | `utc` and `timezone` plugins | IANA zones in the core API | Different recommended approach | Do not translate plugin setup mechanically; see [time zones](dayjs.md#time-zones). |
| Duration | `dayjs.duration(...)` with the Duration plugin | `atemporal.duration(...)` returning `Temporal.Duration` | Different recommended approach | The duration value and API are different; see [durations](dayjs.md#durations). |
| Locales | Day.js locale configuration | `Intl`-backed locale configuration | Equivalent with semantic differences | Locale data and formatting behavior differ; see [formatting and locales](dayjs.md#formatting-and-locales). |
| Relative time | Relative Time plugin | `relativeTime` plugin | Plugin required | Install and extend atemporal's official plugin; see [plugins and relative time](dayjs.md#plugins-and-relative-time). |
| Arbitrary custom plugins | `dayjs.extend(customPlugin)` | No adapter for Day.js plugin interfaces | Not supported | Migrate custom behavior as an independent atemporal extension; see [plugins and relative time](dayjs.md#plugins-and-relative-time). |
| Raw `Date` interop | `dayjs(new Date())` | `atemporal(new Date())` | Equivalent with semantic differences | Both accept `Date` input, but atemporal returns a Temporal-backed wrapper; see [raw `Date` interop](dayjs.md#raw-date-interop). |

For a migration inventory, record the Day.js version, plugins, custom tokens,
time-zone use, locale configuration, and raw `Date` boundaries before applying
these mappings.
