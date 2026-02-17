# Native Temporal Detection

The atemporal library now includes automatic detection of native Temporal API support, allowing for seamless transition from polyfill to native implementation as browsers adopt the Temporal specification.

## How It Works

The library automatically detects whether the native Temporal API is available in the current environment:

- **Native Temporal Available**: Uses the browser's native implementation for optimal performance
- **Native Temporal Not Available**: Falls back to the `@js-temporal/polyfill` automatically

## Checking Temporal Implementation

You can check which Temporal implementation is being used:

```javascript
import atemporal from 'atemporal';

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

### 🚀 **Future-Ready**
Automatically uses native Temporal when browsers support it, without requiring code changes.

### ⚡ **Performance**
Native implementations are typically faster than polyfills.

### 🔄 **Seamless Transition**
No breaking changes - your existing code continues to work exactly the same.

### 📦 **Bundle Size**
When native Temporal is available, the polyfill overhead is eliminated.

## Browser Support Timeline

The Temporal API is currently in Stage 3 of the TC39 process. Browser support is expected to roll out gradually:

- **Current Status**: Polyfill required in all environments
- **Future**: Native support in modern browsers
- **Transition**: Automatic detection ensures smooth migration

## Development vs Production

In development mode, the library logs which Temporal implementation is being used:

```
Atemporal: Using polyfilled Temporal API
```

This logging is automatically disabled in production builds.

## Technical Details

### Detection Logic

The detection system:

1. Checks for `Temporal` in the global scope
2. Verifies the presence of all required Temporal methods
3. Validates the API structure matches the specification
4. Falls back to polyfill if any checks fail

### Cross-Platform Support

The detection works across different JavaScript environments:

- **Browsers**: Checks `window.Temporal`
- **Node.js**: Checks `global.Temporal`
- **Web Workers**: Checks `self.Temporal`
- **Universal**: Uses `globalThis.Temporal` when available

### Caching

The detection result is cached for performance:

- Detection runs once per application lifecycle
- Results are cached to avoid repeated checks
- Cache can be reset for testing purposes

## Migration Guide

### For Existing Users

**No action required!** The detection system is backward compatible:

```javascript
// This code works exactly the same as before
const date = atemporal('2023-12-25');
const formatted = date.format('YYYY-MM-DD');
```

### For New Projects

Simply use atemporal as normal - the detection happens automatically:

```javascript
import atemporal from 'atemporal';

// The library automatically uses the best available Temporal implementation
const now = atemporal();
const christmas = atemporal('2023-12-25');
```

## Testing

The detection system includes comprehensive tests:

```bash
# Run temporal detection tests
npm test -- --testPathPatterns=temporal-detection

# Run integration tests
npm test -- --testPathPatterns=temporal-detection-integration
```

## API Reference

### `atemporal.getTemporalInfo()`

Returns information about the current Temporal implementation.

**Returns:**
```typescript
{
  isNative: boolean;        // true if using native Temporal
  environment: string;      // 'browser', 'node', or 'unknown'
  version: string;          // 'native' or 'polyfill'
}
```

**Example:**
```javascript
const info = atemporal.getTemporalInfo();

if (info.isNative) {
  console.log('Using native Temporal API!');
} else {
  console.log('Using Temporal polyfill');
}
```

## Contributing

The temporal detection system is implemented in:

- `src/core/temporal-detection.ts` - Core detection logic
- `src/index.ts` - Integration with main library
- `src/__tests__/core/temporal-detection.test.ts` - Unit tests
- `src/__tests__/integration/temporal-detection-integration.test.ts` - Integration tests

When contributing, ensure that:

1. Detection works across all supported environments
2. Fallback behavior is robust
3. Performance impact is minimal
4. Tests cover edge cases

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

*This feature ensures that atemporal is ready for the future of JavaScript date/time handling while maintaining full backward compatibility.*