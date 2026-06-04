# Comparison & Difference

## Comparison

```ts
const d1 = atemporal("2024-01-01");
const d2 = atemporal("2024-06-15");
const d3 = atemporal("2024-01-01");

d1.isBefore(d2); // true
d2.isAfter(d1); // true
d1.isSame(d3); // true

// Compare only up to a specific unit
d1.isSame("2024-01-01T12:00:00", "day"); // true — same day
d1.isSame("2024-06-01", "month");        // false — different months
d1.isSame("2024-01-01", "year");          // true — same year

// Shorthand for day-level comparison
d1.isSameDay("2024-01-01T12:00:00"); // true (alias for .isSame(..., 'day'))

// Inclusive comparisons
d1.isSameOrBefore(d2); // true
d2.isSameOrAfter(d1); // true

// Check if a date is between two others
d1.isBetween("2023-12-31", "2024-01-02"); // true

// Inclusivity options: '[]' (default), '()', '[)', '(]'
d1.isBetween("2024-01-01", "2024-01-02", "()"); // false (both excluded)
d1.isBetween("2024-01-01", "2024-01-02", "[)"); // true (start included, end excluded)

// Leap year check
d1.isLeapYear(); // true (2024 is a leap year)
```

## Difference

Calculate the difference between two dates.

```ts
const start = atemporal("2024-01-01T10:00:00");
const end = atemporal("2024-01-02T13:00:00"); // 27 hours later

// By default, returns a truncated integer (default unit: milliseconds)
end.diff(start); // 97200000 (milliseconds)

// Specify a unit for a more readable result
end.diff(start, "day");  // 1 (truncated to full days)
end.diff(start, "hour"); // 27
end.diff(start, "minute"); // 1620

// To get the exact floating-point value, pass `true` as the third argument
end.diff(start, "day", true); // 1.125
end.diff(start, "hour", true); // 27.0
```

## Min / Max

Find the earliest or latest date from a list of inputs.

```typescript
const d1 = atemporal("2023-01-01");
const d2 = atemporal("2023-06-01");
const d3 = atemporal("2023-03-01");

// Accepts spread arguments
const min = atemporal.min(d1, d2, d3); // 2023-01-01

// Also accepts an array
const max = atemporal.max([d1, d2, d3]); // 2023-06-01

// Works with DateInput strings directly
const earliest = atemporal.min("2024-01-01", "2024-06-01", "2024-03-01");
// => 2024-01-01
```
