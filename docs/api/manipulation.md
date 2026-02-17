# Manipulation

All manipulation methods are immutable and return a new `atemporal` instance.

## Add & Subtract

```ts
const date = atemporal("2024-08-14T10:00:00Z");

// Add time
date.add(5, "days"); // Add 5 days
date.add(2, "h"); // Add 2 hours (alias)
date.add({ months: 1, days: 10 }); // Add 1 month and 10 days

// Subtract time
date.subtract(2, "weeks"); // Subtract 2 weeks
date.subtract(30, "m"); // Subtract 30 minutes (alias)
```

## Setters

```ts
date.set("year", 2025); // Set the year to 2025
date.set("hour", 9); // Set the hour to 9
date.set("quarter", 1); // Set the date to the start of the 1st quarter
```

## Start of & End of

```ts
date.startOf("month"); // Start of the month (e.g., 2024-08-01T00:00:00.000)
date.endOf("day"); // End of the day (e.g., 2024-08-14T23:59:59.999)
```

## Weekday Manipulation

```ts
// Get or set the day of the week (1=Monday, 7=Sunday)
date.dayOfWeek(); // Getter: returns 3 (for a Wednesday)
date.dayOfWeek(1); // Setter: moves the date to the Monday of that week
```

# Getters

Access parts of the date using properties and methods.

```ts
const date = atemporal("2024-08-14T10:30:45.123Z");

date.year; // 2024
date.month; // 8
date.day; // 14
date.hour; // 10
date.minute; // 30
date.second; // 45
date.millisecond; // 123
date.daysInMonth; // 31
date.weekOfYear; // 33 (ISO week number)

// Methods
date.get("month"); // 8
date.quarter(); // 3 (third quarter)
date.isLeapYear(); // true (2024 is a leap year)
date.toDate(); // Convert to a JS `Date` object
date.toString(); // '2024-08-14T10:30:45.123Z'
date.raw; // Access the underlying `Temporal.ZonedDateTime` object
```
