# Native Temporal Detection

The atemporal library automatically detects native Temporal API support, allowing seamless transition from polyfill to native implementation as browsers adopt the Temporal specification.

## How It Works

The library automatically detects whether the native Temporal API is available in the current environment:

- **Native Temporal Available**: Uses the browser's native implementation for optimal performance
- **Native Temporal Not Available**: Falls back to the `@js-temporal/polyfill` automatically

Native availability is determined from the actual runtime surface. Use
`atemporal.getTemporalInfo()` in the environment you deploy rather than relying
on a browser or Node version table. CI validates the native path on Node 26.

## Checking Temporal Implementation

You can check which Temporal implementation is being used:

```javascript
import atemporal from "atemporal";

// Get information about the current Temporal implementation
const info = atemporal.getTemporalInfo();
console.log(info);
// Output example:
// {
//   isNative: false,
//   environment: 'node',
//   version: 'polyfill'
// }
```

## Benefits

### Future-Ready

Automatically uses native Temporal when browsers support it, without requiring code changes.

### Performance

Native implementations are typically faster than polyfills.

### Seamless Transition

No breaking changes — your existing code continues to work exactly the same.

### Bundle Size

The polyfill is a direct runtime dependency and is statically imported. Native
selection changes which implementation runs, but does not by itself guarantee
that a bundler removes polyfill code from an application bundle.

## Runtime Support

The Temporal API has reached **Stage 4** and implementations continue to roll
out independently. Detection works in browsers, Node.js, workers, and other
supported JavaScript environments. The automatic fallback keeps the API
available when a native implementation is absent.

## Technical Details

### Detection Logic

The detection system:

1. Checks for `Temporal` in the global scope (`globalThis`, `window`, `global`, or `self`)
2. Verifies the presence of all required Temporal methods (`Temporal.Now.zonedDateTimeISO`, `Temporal.ZonedDateTime`, etc.)
3. Validates the API structure matches the specification
4. Falls back to polyfill if any checks fail

### Cross-Platform Support

The detection works across different JavaScript environments:

- **Browsers**: Checks `window.Temporal`
- **Node.js**: Checks `global.Temporal`
- **Web Workers**: Checks `self.Temporal`
- **Universal**: Uses `globalThis.Temporal` when available

**Helper utilities** (available internally in `src/core/temporal-detection.ts`):
- `isBrowserEnvironment()` — Returns `true` in browser contexts
- `isNodeEnvironment()` — Returns `true` in Node.js contexts
- `isNativeTemporalAvailable()` — Returns `true` if native Temporal is detected (cached)

### Caching

The detection result is cached for performance:

- Detection runs once per application lifecycle
- Results are cached to avoid repeated checks
- Cache can be reset for testing purposes via `resetTemporalAPICache()`

## Migration Guide

### For Existing Users

**No action required!** The detection system is backward compatible:

```javascript
// This code works exactly the same as before
const date = atemporal("2023-12-25");
const formatted = date.format("YYYY-MM-DD");
```

### For New Projects

Simply use atemporal as normal — the detection happens automatically:

```javascript
import atemporal from "atemporal";

// The library automatically uses the best available Temporal implementation
const now = atemporal();
const christmas = atemporal("2023-12-25");
```

## API Reference

### `atemporal.getTemporalInfo()`

Returns information about the current Temporal implementation.

**Returns:**

```typescript
{
  isNative: boolean;   // true if using native Temporal
  environment: string; // 'browser', 'node', or 'unknown'
  version: string;     // 'native' or 'polyfill'
}
```

**Example:**

```javascript
const info = atemporal.getTemporalInfo();

if (info.isNative) {
  console.log("Using native Temporal API!");
} else {
  console.log("Using Temporal polyfill");
}
```

## Troubleshooting

### Common Issues

**Q: How do I know if native Temporal is being used?**
A: Use `atemporal.getTemporalInfo()` to check the current implementation.

**Q: Can I force the use of the polyfill?**
A: The detection system automatically chooses the best implementation. Manual override is not recommended as it may cause compatibility issues.

**Q: Will my existing code break when browsers add native Temporal?**
A: No! The detection system ensures backward compatibility. Your code will continue to work exactly the same.

**Q: How can I test with native Temporal?**
A: You can mock the global Temporal object in your tests to simulate native support.

### Performance Considerations

- Detection runs once per application lifecycle
- Results are cached to avoid repeated checks
- No performance impact on regular atemporal operations
- Native Temporal (when available) is typically faster than polyfill

---

_This feature ensures that atemporal is ready for the future of JavaScript date/time handling while maintaining full backward compatibility._
