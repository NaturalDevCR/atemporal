# Temporal Detection

Atemporal automatically detects whether the native Temporal API is available in the current environment. This ensures you always get the best performance without changing your code.

## How It Works

- **Native Temporal Available**: Uses the browser's native implementation (Chrome 144+, Firefox 139+) for optimal performance
- **Native Temporal Not Available**: Falls back to the `@js-temporal/polyfill` automatically

The detection runs once and is cached for the lifetime of your application. It searches for `Temporal` in `globalThis`, `window`, `global`, and `self` in that order.

## Checking the Implementation

```ts
import atemporal from "atemporal";

const info = atemporal.getTemporalInfo();
console.log(info);
// {
//   isNative: false,        // true if native Temporal found
//   environment: 'node',    // 'browser', 'node', or 'unknown'
//   version: 'polyfill'     // 'native' or 'polyfill'
// }
```

## Benefits

- **No code changes required**: Your existing atemporal code works identically whether native or polyfill
- **Automatic performance**: Native Temporal is faster than the polyfill, and you get it for free
- **Bundle size reduction**: When native Temporal is available, the polyfill overhead is eliminated at runtime
- **Seamless migration**: As more browsers adopt Temporal, your app automatically benefits

## Browser Support

The Temporal API has reached **Stage 4** of the TC39 process and is included in **ECMAScript 2026**.

| Browser/Env | Temporal Support |
|-------------|-----------------|
| Chrome 144+ | Native |
| Firefox 139+ | Native |
| Other browsers | Polyfill (automatic) |
| Node.js 18+ | Polyfill (automatic) |
| Older runtimes | Polyfill (automatic) |

## Migration

**No action is required.** The detection system is fully backward compatible. Your code continues to work regardless of which Temporal implementation is active:

```ts
// This works identically with both native and polyfill Temporal
const date = atemporal("2023-12-25");
const formatted = date.format("YYYY-MM-DD");
```

## Testing

For testing scenarios where you need to simulate native Temporal support:

```ts
// Mock the global Temporal object in your test setup
globalThis.Temporal = {
  Now: { zonedDateTimeISO: () => { /* mock */ } },
  ZonedDateTime: { from: () => { /* mock */ } },
  // ... other required methods
};
```

## For More Details

See the full [Temporal Detection deep dive](./temporal-detection) for information about the detection algorithm internals, caching, cross-platform support, and helper utilities like `isBrowserEnvironment()` and `isNodeEnvironment()`.
