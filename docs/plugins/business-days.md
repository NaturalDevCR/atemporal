# businessDays

Adds calculations for working days, allowing you to skip weekends and holidays.

## Usage

```ts
import atemporal from "atemporal";
import businessDays from "atemporal/plugins/businessDays";

atemporal.extend(businessDays);

// Configure (optional)
atemporal.setBusinessDaysConfig({
  holidays: ["2023-12-25", "2024-01-01"],
  weekendDays: [6, 7], // Saturday, Sunday
});

const friday = atemporal("2023-01-06");
const monday = friday.addBusinessDays(1); // Skips Sat/Sun
```

## Methods

- `.isBusinessDay()`
- `.isHoliday()`
- `.isWeekend()`
- `.addBusinessDays(n)`
- `.nextBusinessDay()`
