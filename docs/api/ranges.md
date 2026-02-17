# Generating Date Ranges

The `.range()` method generates an array of dates between a start and end date. It can return either `atemporal` instances or formatted strings.

**API:** `start.range(endDate, unit, options)`

- `endDate`: The end of the range.
- `unit`: The step unit (e.g., `'day'`, `'week'`).
- `options` (optional):
  - `inclusivity`: `'[]'` (default), `'()'`, `'[)'`, `'(]'`.
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
```
