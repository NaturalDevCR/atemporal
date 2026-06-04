# weekDay

Adds functionality to work with weekdays, including setting the day of the week, finding the start/end of the week, and localized weekday names.

## Usage

```ts
import atemporal from "atemporal";
import weekDay from "atemporal/plugins/weekDay";

atemporal.extend(weekDay);

const date = atemporal("2024-05-15"); // Wednesday

// Get weekday number (0 for Sunday, 1 for Monday, etc. — based on week start config)
console.log(date.weekday()); // 3 (Wednesday, assuming default ISO week)

// Configure start of week globally
atemporal.setWeekStartsOn(1); // 1 = Monday (0 = Sunday)

// Start/End of week respects the `setWeekStartsOn` setting
date.startOf("week"); // Monday 2024-05-13 00:00:00
date.endOf("week");   // Sunday 2024-05-19 23:59:59.999
```

## Methods

### `.weekday()`

Returns the day of the week as a number (0-indexed, based on the configured week start).

```ts
const sunday = atemporal("2024-05-12"); // Sunday

atemporal.setWeekStartsOn(1); // Week starts Monday
sunday.weekday(); // 6 (Sunday is the 6th day when week starts Monday)

atemporal.setWeekStartsOn(0); // Week starts Sunday
sunday.weekday(); // 0 (Sunday is the 0th day when week starts Sunday)
```

### `atemporal.setWeekStartsOn(day)`

Sets the global week start day. Accepts `0` (Sunday) through `6` (Saturday).

```ts
atemporal.setWeekStartsOn(1); // Monday (ISO)
atemporal.setWeekStartsOn(0); // Sunday (US)
atemporal.setWeekStartsOn(6); // Saturday (some regions)
```

### `startOf('week')` and `endOf('week')`

These methods respect the configured week start. The plugin wraps the core `startOf()` and `endOf()` methods, delegating to the original for all other units.

```ts
atemporal.setWeekStartsOn(1); // Monday
const wed = atemporal("2024-05-15");

wed.startOf("week"); // Monday 2024-05-13
wed.endOf("week");   // Sunday 2024-05-19

// Other units are unaffected
wed.startOf("month"); // 2024-05-01
wed.endOf("year");    // 2024-12-31
```

## Performance & Caching

The plugin utilizes intelligent caching for high-performance weekday calculation.
You can clear or inspect these caches via the factory:

```ts
atemporal.clearWeekDayCache();
console.log(atemporal.getWeekDayCacheStats());
// { size: number, hits: number, misses: number, hitRatio: number, ... }
```

The internal cache has two layers: one for weekday calculations and one for week boundaries. Both are cleared together.
