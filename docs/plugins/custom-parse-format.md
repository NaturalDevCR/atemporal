# customParseFormat

Allows creating an `atemporal` instance from a string with a custom format. Features high-performance parsing with intelligent caching.

## Usage

```ts
import atemporal from "atemporal";
import customParseFormat from "atemporal/plugins/customParseFormat";

atemporal.extend(customParseFormat);

// Basic date parsing
const date1 = atemporal.fromFormat("15/03/2024 10:30", "DD/MM/YYYY HH:mm");
console.log(date1.toString()); // "2024-03-15T10:30:00.000Z"

// 12-hour format with AM/PM
const ampm = atemporal.fromFormat("2024-01-01 02:30 PM", "YYYY-MM-DD hh:mm A");
```

## Supported Tokens

- `YYYY` - 4-digit year
- `YY` - 2-digit year (Y2K logic: 00-68 -> 2000s, 69-99 -> 1900s)
- `MM` - 2-digit month (01-12)
- `M` - 1-2 digit month (1-12)
- `MMMM` - Full month name
- `MMM` - Abbreviated month name
- `DD` - 2-digit day (01-31)
- `D` - 1-2 digit day (1-31)
- `HH` - 2-digit hour (00-23)
- `hh` - 2-digit hour (01-12)
- `mm` - 2-digit minute
- `ss` - 2-digit second
- `SSS` - Milliseconds
- `A` - Uppercase AM/PM
- `a` - Lowercase am/pm

## Error Handling

### Default Behavior

Returns an invalid `atemporal` instance. Use `.isValid()` to check.

```ts
import { getParseError } from "atemporal/plugins/customParseFormat";

const invalidDate = atemporal.fromFormat("invalid", "YYYY-MM-DD");
if (!invalidDate.isValid()) {
  const error = getParseError(invalidDate);
  console.log(error.message);
}
```

### Strict Mode

Throws an exception if the format doesn't match or components are invalid.

```ts
atemporal.fromFormatStrict("2024-13-45", "YYYY-MM-DD"); // Throws Error
```
