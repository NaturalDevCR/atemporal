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
  weekendDays: [6, 7], // Saturday, Sunday (ISO: 1=Monday, 7=Sunday)
});

const friday = atemporal("2023-01-06");
const monday = friday.addBusinessDays(1); // Skips Sat/Sun
console.log(monday.format("YYYY-MM-DD")); // "2023-01-09" (Monday)
```

## Configuration

### `atemporal.setBusinessDaysConfig(config)`

```ts
interface BusinessDaysOptions {
  holidays?: string[];       // Array of ISO date strings (YYYY-MM-DD)
  weekendDays?: number[];    // Days considered weekend (1=Monday, 7=Sunday). Default: [6, 7]
}

atemporal.setBusinessDaysConfig({
  holidays: [
    "2024-01-01", // New Year's Day
    "2024-12-25", // Christmas
  ],
  weekendDays: [5, 6], // Friday and Saturday (e.g., Middle East)
});
```

> [!NOTE]
> Holidays should be provided as ISO date strings in the format `YYYY-MM-DD`. They are normalized internally for accurate comparison.

## Methods

### `.isBusinessDay()`

Returns `true` if the date is neither a holiday nor a weekend day.

```ts
const day = atemporal("2024-01-01");
day.isBusinessDay(); // false (holiday)
```

### `.isHoliday()`

Returns `true` if the date is in the configured holidays list.

```ts
const christmas = atemporal("2024-12-25");
christmas.isHoliday(); // true
```

### `.isWeekend()`

Returns `true` if the date falls on a configured weekend day.

```ts
const sunday = atemporal("2024-01-07");
sunday.isWeekend(); // true (Sunday)

atemporal.setBusinessDaysConfig({ weekendDays: [5, 6] });
const friday = atemporal("2024-01-05");
friday.isWeekend(); // true (Friday)
```

### `.addBusinessDays(n)`

Adds `n` working days, skipping weekends and holidays.

```ts
const thursday = atemporal("2024-07-04"); // Thursday + holiday
thursday.addBusinessDays(1);  // Next business day after skipping Friday (holiday) + weekend
// => Monday 2024-07-08
```

### `.subtractBusinessDays(n)`

Subtracts `n` working days (delegates to `addBusinessDays(-n)`).

```ts
const monday = atemporal("2024-01-08");
monday.subtractBusinessDays(1); // Previous business day (Friday)
// => 2024-01-05
```

### `.nextBusinessDay()`

Returns the next business day after the current date.

```ts
const friday = atemporal("2024-01-05");
friday.nextBusinessDay(); // Monday 2024-01-08 (skips weekend)
```

## Performance Note

All checks (`isBusinessDay`, `isHoliday`, `isWeekend`) are computed fresh without caching. For very large holiday lists (thousands of entries), consider preprocessing holidays into a `Set` or performing batch operations.
