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

Plugins can optionally accept configuration options:

```ts
atemporal.extend(relativeTime, { threshold: 45 });
```

### Lazy Loading

To reduce the initial bundle size, you can load plugins on demand. Atemporal provides robust lazy-loading utilities that dynamically import plugins when requested.

```ts
import atemporal from "atemporal";

// Load a single plugin
async function showRelativeTime() {
  await atemporal.lazyLoad("relativeTime");

  const twoHoursAgo = atemporal().subtract(2, "hour");
  console.log(twoHoursAgo.fromNow()); // "2 hours ago"
}

// Load multiple plugins at once
async function loadAdvancedFeatures() {
  await atemporal.lazyLoadMultiple(["businessDays", "timeSlots"]);
}

// Pass options to lazy-loaded plugins
await atemporal.lazyLoadMultiple(["weekDay", "customParseFormat"], {
  weekDay: { defaultWeekStart: 1 },
});
```

## Plugin Utilities

You can query the state of official plugins at runtime using the following
utilities:

```ts
// Check if a specific plugin is loaded
const hasRelativeTime = atemporal.isPluginLoaded("relativeTime");

// View an array of currently loaded official plugins
const loaded = atemporal.getLoadedPlugins();

// View official plugins that can be lazy-loaded
const available = atemporal.getAvailablePlugins();
```

Third-party plugins can be installed with `extend()`, but they do not appear
in `getLoadedPlugins()` or `getAvailablePlugins()`. Those APIs are reserved for
the stable official-plugin registry.

Use `getAppliedExtensions()` to inspect every successfully applied extension.
It returns detached `{ id, kind }` records in application order. An extension
has an ID only when the author explicitly provides metadata; Atemporal never
uses `Function.name` as an identity.

```ts
import atemporal, { markAsPlugin, type Plugin } from "atemporal";

const auditPlugin = markAsPlugin(((Wrapper) => {
  Wrapper.prototype.isAudited = () => true;
}) as Plugin, { id: "acme.audit", official: false });

atemporal.extend(auditPlugin);
// [{ id: "acme.audit", kind: "third-party" }]
console.log(atemporal.getAppliedExtensions());
```

## Available Plugins

- [**relativeTime**](/plugins/relative-time): `.fromNow()`, `.toNow()`.
- [**customParseFormat**](/plugins/custom-parse-format): Advanced string parsing with custom format tokens.
- [**advancedFormat**](/plugins/advanced-format): Ordinals and timezone names.
- [**weekDay**](/plugins/week-day): Enhanced weekday handling.
- [**durationHumanizer**](/plugins/duration-humanizer): Human-readable duration strings.
- [**dateRangeOverlap**](/plugins/date-range-overlap): Overlap detection between date ranges.
- [**businessDays**](/plugins/business-days): Working day calculations with holidays.
- [**timeSlots**](/plugins/time-slots): Appointment slot finding.

## Creating Your Own Plugin

Atemporal's plugin system is designed to be extensible. You can create custom plugins using the `Plugin` type signature.

### Plugin Type Signature

```ts
type Plugin = (
  Atemporal: typeof TemporalWrapper,  // The TemporalWrapper class
  atemporal: AtemporalFactory,        // The factory function with all static methods
  options?: any                       // Optional configuration
) => void;
```

### Basic Plugin Example

```ts
import atemporal, { type Plugin, markAsPlugin } from "atemporal";

const myPlugin: Plugin = (Atemporal, atemporal, options) => {
  // Add instance methods to the prototype
  Atemporal.prototype.isMorning = function () {
    return this.hour < 12;
  };

  // Add static methods to the factory
  (atemporal as any).greet = function (name: string) {
    return `Hello, ${name}! The time is ${atemporal().format("HH:mm")}`;
  };
};

// Mark it as a valid atemporal plugin (required for isPlugin() detection)
markAsPlugin(myPlugin);

// Register it
atemporal.extend(myPlugin, { /* optional config */ });

// Now use your custom methods
const now = atemporal();
console.log(now.isMorning()); // true or false
console.log(atemporal.greet("World")); // "Hello, World! The time is 10:30"
```

### Plugin Detection

Plugins marked with `markAsPlugin()` are identifiable:

```ts
import { markAsPlugin, PLUGIN_SENTINEL } from "atemporal";

const myPlugin = markAsPlugin((Atemporal, atemporal) => {
  // ...
});

atemporal.isPlugin(myPlugin); // true

// The PLUGIN_SENTINEL symbol is used internally for plugin identification
console.log((myPlugin as any)[PLUGIN_SENTINEL]); // true
```
