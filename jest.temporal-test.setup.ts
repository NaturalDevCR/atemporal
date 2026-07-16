// Keep unit tests on the explicitly bundled Temporal implementation. Node 26 exposes
// native Temporal, which is validated separately against the production artifact.
Object.defineProperty(globalThis, 'Temporal', {
  configurable: true,
  value: undefined,
  writable: true,
});
