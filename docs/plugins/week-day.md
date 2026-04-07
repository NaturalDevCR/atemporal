# weekDay

Adds functionality to work with weekdays, including setting the day of the week, finding the start/end of the week, and localized weekday names.

## Usage

```ts
import atemporal from "atemporal";
import weekDay from "atemporal/plugins/weekDay";

atemporal.extend(weekDay);

const date = atemporal("2024-05-15"); // Wednesday

// Get weekday number (0 for Sunday, 1 for Monday, etc. or based on start of week)
console.log(date.weekday()); 

// Configure start of week globally
atemporal.setWeekStartsOn(1); // 1 = Monday (0 = Sunday)

// Start/End of week
date.startOf("week"); // Start of the week, respects `setWeekStartsOn` setting
date.endOf("week"); // End of the week, respects `setWeekStartsOn` setting
```

## Performance & Caching

The plugin utilizes intelligent caching for high-performance weekday calculation. 
You can clear or inspect these caches via the factory:

```ts
atemporal.clearWeekDayCache();
console.log(atemporal.getWeekDayCacheStats());
```
