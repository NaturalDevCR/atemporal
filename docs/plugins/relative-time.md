# relativeTime

The `relativeTime` plugin adds the `.fromNow()` and `.toNow()` methods for displaying relative time strings (e.g., "5 minutes ago").

## Usage

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

atemporal.extend(relativeTime);

atemporal().subtract(5, "minutes").fromNow(); // "5 minutes ago"
atemporal().add(2, "hours").fromNow(); // "in 2 hours"
```

## Methods

### `.fromNow(withoutSuffix?: boolean)`

Returns the relative time from now.

### `.toNow(withoutSuffix?: boolean)`

Returns the relative time to now.
