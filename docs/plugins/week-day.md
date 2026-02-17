# weekDay

Adds functionality to work with weekdays, including setting the day of the week, finding the start/end of the week, and localized weekday names.

## Usage

```ts
import atemporal from "atemporal";
import weekDay from "atemporal/plugins/weekDay";

atemporal.extend(weekDay);

const date = atemporal("2024-05-15"); // Wednesday

// Get weekday details
console.log(date.weekday().name); // "Wednesday"
console.log(date.weekday().number); // 3
console.log(date.weekday().isWeekend); // false

// Set weekday
const nextFriday = date.weekday(5);

// Start/End of week
date.startOf("week"); // Monday
date.endOf("week"); // Sunday 23:59:59.999
```
