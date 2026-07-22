# Choosing the public API

Choose the smallest public API that matches the temporal value you actually have. Atemporal's callable factory is a convenient compatibility facade; strict parsing makes a policy decision at data boundaries.

| Case | Public API | Timezone rule | Failure result |
| --- | --- | --- | --- |
| Event instant | `atemporal.parse` with an offset-bearing ISO string | Never invent a zone | `InvalidDateError` or `null` |
| Scheduled event | `atemporal.parse(input, { timeZone })` | Explicit IANA zone required for local input | Reject DST ambiguity by default |
| Local civil date-time | `atemporal.parse` | Explicit IANA zone required | `InvalidDateError` or `null` |
| Date-only value | `atemporal.parse` | Use the business zone only if a time will be added | `InvalidDateError` or `null` |
| Trusted boundary parsing | `atemporal.parse` | Explicit zone for local input | Throws `InvalidDateError` |
| Compatibility parsing | `atemporal(input)` | Optional zone; preserves compatibility behavior | Invalid wrapper |
| Formatting | `value.format(pattern)` | Format in the value zone or convert with `.timeZone()` | Throws for invalid wrapper |
| Duration | `atemporal.duration(like)` | No zone | Temporal conversion error |
| Range | `value.range(...)` | Keep both ends in an explicit, known zone | Invalid wrapper/error |
| Official plugin | `atemporal.extend(plugin)` or `lazyLoad(name)` | No zone | Plugin load error |
| Third-party extension | `atemporal.extend(markAsPlugin(...))` | No zone | Extension error |

Use `atemporal.tryParse` instead of catching errors only when `null` is the correct result for malformed input. A DST policy is still required: its default is `disambiguation: "reject"`.
