# Creating Instances

You can create an `atemporal` instance from various input types:

```ts
import atemporal from "atemporal";

// Current date and time in the default time zone (UTC)
atemporal();

// From an ISO 8601 string (with or without 'Z')
atemporal("2025-07-09T15:30:00");
atemporal("2025-07-09T15:30:00Z");

// From a JavaScript Date object
atemporal(new Date());

// From a Unix timestamp (in seconds)
atemporal.unix(1752096000); // => 2025-07-09T00:00:00Z

// From a Unix timestamp (in milliseconds)
atemporal(1752096000000);

// From an array: [year, month, day, hour, min, sec, ms]
atemporal([2025, 7, 9, 15, 30]);

// From an object
atemporal({ year: 2025, month: 7, day: 9 });

// Clone an existing instance
const original = atemporal();
const clone = atemporal(original);

// Specify a time zone on creation
atemporal("2025-01-01T12:00:00", "America/New_York");
```

## Firebase/Firestore Timestamps

Atemporal provides first-class support for Firebase/Firestore timestamp objects, supporting both standard and underscore formats:

### Supported Formats

**Standard Format** (most common):

```ts
const standardTimestamp = {
  seconds: 1672531200,
  nanoseconds: 500000000,
};
const date = atemporal(standardTimestamp);
console.log(date.toString()); // => "2023-01-01T00:00:00.500Z"
```

**Underscore Format** (v0.3.0+):

```ts
const underscoreTimestamp = {
  _seconds: 1672531200,
  _nanoseconds: 500000000,
};
const date2 = atemporal(underscoreTimestamp);
console.log(date2.toString()); // => "2023-01-01T00:00:00.500Z"
```

### Working with Firestore Data

When working with Firestore documents, timestamps are automatically handled:

```ts
// Assuming you have a Firestore document with a timestamp field
const doc = await getDoc(docRef);
const data = doc.data();

// The timestamp field can be parsed directly
const createdAt = atemporal(data.createdAt);
console.log(createdAt.format("YYYY-MM-DD HH:mm:ss"));

// Works with both formats seamlessly
const updatedAt = atemporal(data.updatedAt); // Could be either format
console.log(updatedAt.fromNow());
```
