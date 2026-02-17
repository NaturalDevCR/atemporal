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
d1.isSame("2024-01-01T12:00:00", "day"); // true
d1.isSameDay("2024-01-01T12:00:00"); // true (alias for .isSame(..., 'day'))

// Inclusive comparisons
d1.isSameOrBefore(d2); // true
d2.isSameOrAfter(d1); // true

// Check if a date is between two others
d1.isBetween("2023-12-31", "2024-01-02"); // true
d1.isBetween("2024-01-01", "2024-01-02", "()"); // false (exclusive inclusivity)
```

## Difference

Calculate the difference between two dates.

```ts
const start = atemporal("2024-01-01T10:00:00");
const end = atemporal("2024-01-02T13:00:00"); // 27 hours later

// By default, returns a truncated integer
end.diff(start, "day"); // 1
end.diff(start, "hour"); // 27

// To get the exact floating-point value, pass `true`
end.diff(start, "day", true); // 1.125
```

## Min / Max

Find the earliest or latest date from a list of inputs.

```typescript
const d1 = atemporal("2023-01-01");
const d2 = atemporal("2023-06-01");
const d3 = atemporal("2023-03-01");

const min = atemporal.min(d1, d2, d3); // 2023-01-01
const max = atemporal.max([d1, d2, d3]); // 2023-06-01
```
