# Manipulation

All manipulation methods are immutable and return a new `atemporal` instance.

## Add & Subtract

```ts
const date = atemporal("2024-08-14T10:00:00Z");

// Add time with value + unit
date.add(5, "days"); // Add 5 days
date.add(2, "h"); // Add 2 hours (alias)
date.add(3, "months"); // Add 3 months

// Add time with a plain object
date.add({ months: 1, days: 10 }); // Add 1 month and 10 days

// Add time with a Temporal.Duration
const dur = atemporal.duration({ hours: 2, minutes: 30 });
date.add(dur); // Add 2h 30m directly from a Duration

// Subtract time
date.subtract(2, "weeks"); // Subtract 2 weeks
date.subtract(30, "m"); // Subtract 30 minutes (alias)

// Subtract with a Duration
date.subtract(atemporal.duration({ days: 5, hours: 3 }));
```

**Supported time unit aliases:**
- `"years"` / `"y"`, `"months"`, `"weeks"` / `"w"`
- `"days"` / `"d"`, `"hours"` / `"h"`
- `"minutes"` / `"m"`, `"seconds"` / `"s"`
- `"milliseconds"` / `"ms"`

## Setters

```ts
date.set("year", 2025); // Set the year to 2025
date.set("hour", 9); // Set the hour to 9

// Setting quarter moves to the start of that quarter
date.set("quarter", 1); // Moves to January 1st (start of Q1)
date.set("quarter", 3); // Moves to July 1st (start of Q3)

// Setting dayOfWeek adjusts within the current week
date.dayOfWeek(1); // Moves to the Monday of that week
```

## Start of & End of

```ts
date.startOf("month"); // Start of the month (e.g., 2024-08-01T00:00:00.000)
date.startOf("year");  // Start of the year
date.startOf("week");  // Start of the week (ISO, Monday-based, configurable via weekDay plugin)
date.endOf("day");     // End of the day (e.g., 2024-08-14T23:59:59.999)
date.endOf("month");   // End of the month
```

## Weekday Manipulation

```ts
// Get or set the day of the week (1=Monday, 7=Sunday)
date.dayOfWeek(); // Getter: returns 3 (for a Wednesday)
date.dayOfWeek(1); // Setter: moves the date to the Monday of that week
date.dayOfWeek(7); // Setter: moves to the Sunday of that week
```

## Time Zone

```ts
// Change the time zone of an instance, returning a new instance
const dateWithNewTz = date.timeZone("America/New_York");
```

## Clone

```ts
// Create a copy of the instance
const copy = date.clone();
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
date.dayOfWeekName; // "Wednesday" (full weekday name)
date.timeZoneName; // "UTC" (or another IANA time zone)
date.timeZoneId; // "UTC" (alias for timeZoneName)

// Methods
date.get("month"); // 8
date.quarter(); // 3 (third quarter)
date.isLeapYear(); // true (2024 is a leap year)
date.isValid(); // true
date.toDate(); // Convert to a JS `Date` object
date.toString(); // '2024-08-14T10:30:45.123Z'
date.raw; // Access the underlying `Temporal.ZonedDateTime` object
date.datetime; // Same as `.raw` — the `Temporal.ZonedDateTime` object
```
