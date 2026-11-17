# Choosing the public API

Choose the smallest public API that matches the temporal value you actually have. Atemporal's callable factory is a convenient compatibility facade; strict parsing makes a policy decision at data boundaries.

| Case | Public API | Timezone rule | Failure result |
| --- | --- | --- | --- |
| Event instant | `atemporal.instant(value)` | Offset-bearing string or exact instant | `InvalidDateError` |
| Scheduled event | `atemporal.zonedDateTime(value, { timeZone })` | Explicit IANA zone required for local input | `InvalidDateError`; rejects DST ambiguity |
| Local civil date-time | `atemporal.plainDateTime(value)` | Zone-free raw value | `InvalidDateError` |
| Date-only value | `atemporal.date(value)` | Zone-free raw value | `InvalidDateError` |
| Chainable strict wrapper | `atemporal.parse` / `tryParse` | Choose a domain zone for local input | `InvalidDateError` / `null` |
| Compatibility parsing | `atemporal(input)` | Optional zone; preserves compatibility behavior | Invalid wrapper |
| Formatting | `value.format(pattern)` | Format in the value zone or convert with `.timeZone(zone)` | Invalid wrappers format as `"Invalid Date"` |
| Duration | `atemporal.duration(like)` | No zone | Temporal conversion error |
| Range | `value.range(...)` | Keep both ends in an explicit, known zone | Invalid wrapper/error |
| Official plugin | `atemporal.extend(plugin)` or `lazyLoad(name)` | No zone | Plugin load error |
| Third-party extension | `atemporal.extend(markAsPlugin(...))` | No zone | Extension error |

Use `atemporal.tryParse` instead of catching errors only when `null` is the correct result for malformed input. A DST policy is still required: its default is `disambiguation: "reject"`.

The four explicit constructors return raw Temporal values, which expose Temporal
methods such as `.toString()` and `.toLocaleString()`. The chainable wrapper from
`parse()`, `tryParse()`, or the callable factory provides `.format()`, ranges, and
installed plugin methods. Use `.raw` on a valid wrapper for its underlying
`Temporal.ZonedDateTime` and full nanosecond precision.
