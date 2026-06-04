# Generating Date Ranges

The `.range()` method generates an array of dates between a start and end date. It can return either `atemporal` instances or formatted strings.

**API:** `start.range(endDate, unit, options)`

- `endDate`: The end of the range.
- `unit`: The step unit (e.g., `'day'`, `'week'`, `'month'`).
- `options` (optional):
  - `inclusivity`: `'[]'` (default, includes both start and end), `'()'`, `'[)'`, `'(]'`.
  - `format`: If provided, returns a `string[]` instead of `atemporal[]`.

```ts
const start = atemporal("2024-04-28");
const end = atemporal("2024-05-02");

// 1. Get an array of atemporal instances (default)
const dateRange = start.range(end, "day");
// => [atemporal, atemporal, atemporal, atemporal, atemporal]

// 2. Get an array of formatted strings directly
const formattedRange = start.range(end, "day", {
  format: "YYYY-MM-DD",
  inclusivity: "[)", // Include start, exclude end
});
// => ['2024-04-28', '2024-04-29', '2024-04-30', '2024-05-01']

// 3. Generate by week
const weeklyRange = start.range(end, "week", { format: "MMMM Do" });
// => ['April 28th']

// 4. Generate by month
const monthlyRange = atemporal("2024-01-01").range("2024-06-01", "month", {
  format: "YYYY-MM",
});
// => ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']

// 5. Exclusive range
const exclusiveRange = start.range(end, "day", {
  inclusivity: "()", // Exclude both start and end
  format: "MM-DD",
});
// => ['04-29', '04-30', '05-01']
```
