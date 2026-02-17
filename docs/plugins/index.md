# Plugin System

Atemporal has a lightweight plugin system that allows you to extend its functionality only when needed, keeping the core bundle small.

## How to Use Plugins

### Standard Extension

Import the plugin and extend `atemporal` using `atemporal.extend()`.

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

atemporal.extend(relativeTime);

// Now you can use .fromNow()
atemporal().subtract(5, "m").fromNow();
```

### Lazy Loading

To reduce the initial bundle size, you can load plugins on demand:

```ts
import atemporal from "atemporal";

async function showRelativeTime() {
  await atemporal.lazyLoad("relativeTime");

  const twoHoursAgo = atemporal().subtract(2, "hour");
  console.log(twoHoursAgo.fromNow()); // "2 hours ago"
}
```

## Plugin Utilities

```ts
// Check if a plugin is loaded
atemporal.isPluginLoaded("relativeTime");

// View all loaded plugins
atemporal.getLoadedPlugins();
```

## Available Plugins

- [**relativeTime**](/plugins/relative-time): `.fromNow()`, `.toNow()`.
- [**customParseFormat**](/plugins/custom-parse-format): Advanced string parsing.
- [**advancedFormat**](/plugins/advanced-format): Ordinals and timezone names.
- [**weekDay**](/plugins/week-day): Enhanced weekday handling.
- [**durationHumanizer**](/plugins/duration-humanizer): Readable durations.
- [**dateRangeOverlap**](/plugins/date-range-overlap): Overlap detection.
- [**businessDays**](/plugins/business-days): Working day calculations.
- [**timeSlots**](/plugins/time-slots): Appointment slot finding.
