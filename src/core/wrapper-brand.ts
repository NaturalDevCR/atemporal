import type { TemporalWrapper } from '../TemporalWrapper';

// CommonJS and ESM have separate prototypes but share this weak registry.
const registryKey = Symbol.for('atemporal.v2.wrapperInstances');
const realm = globalThis as typeof globalThis & { [registryKey]?: WeakMap<object, object> };
const wrappers = realm[registryKey] ??= new WeakMap<object, object>();
const runtime = {};

export function registerWrapper(wrapper: TemporalWrapper): void {
  wrappers.set(wrapper, runtime);
}

export function wrapperRuntime(value: unknown): object | undefined {
  return typeof value === 'object' && value !== null ? wrappers.get(value) : undefined;
}

export function isForeignWrapper(value: unknown): value is TemporalWrapper {
  const owner = wrapperRuntime(value);
  return owner !== undefined && owner !== runtime;
}
