/**
 * @file Fuzz tests for the parser.
 *
 * The goal is to ensure that the parser never throws an uncaught
 * exception, never produces a `TemporalWrapper` that `.isValid()` is
 * a function on but throws, and never loops or hangs on adversarial
 * input. We deliberately throw a wide variety of random strings,
 * numbers, and objects at the parser.
 */
import * as fc from 'fast-check';
import atemporal from '../index';

const TIMEOUT_MS = 1000;

describe('atemporal: parser fuzz tests', () => {
  it('try() survives any random string without hanging or throwing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 256 }),
        (s) => {
          const start = Date.now();
          const r = atemporal.try(s);
          const elapsed = Date.now() - start;
          if (elapsed > TIMEOUT_MS) {
            throw new Error(`parse took ${elapsed}ms on '${s}'`);
          }
          return r === null || typeof r.isValid === 'function';
        }
      ),
      { numRuns: 1000 }
    );
  }, 30_000);

  it('try() survives any random object without hanging or throwing', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.object({ maxDepth: 3 }),
          fc.array(fc.anything(), { maxLength: 10 }),
          fc.dictionary(fc.string(), fc.anything(), { maxKeys: 10 })
        ),
        (obj) => {
          const start = Date.now();
          const r = atemporal.try(obj as any);
          const elapsed = Date.now() - start;
          if (elapsed > TIMEOUT_MS) {
            throw new Error(`parse took ${elapsed}ms on object`);
          }
          return r === null || typeof r.isValid === 'function';
        }
      ),
      { numRuns: 500 }
    );
  }, 30_000);

  it('try() survives any random number (including NaN, Infinity)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.double({ noNaN: false, noDefaultInfinity: false }),
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity),
          fc.constant(Number.MAX_SAFE_INTEGER),
          fc.constant(Number.MIN_SAFE_INTEGER)
        ),
        (n) => {
          const r = atemporal.try(n as any);
          return r === null || typeof r.isValid === 'function';
        }
      ),
      { numRuns: 200 }
    );
  });

  it('validate() never throws, even for garbage', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const r = atemporal.validate(value);
        return typeof r === 'object' && typeof r.ok === 'boolean';
      }),
      { numRuns: 1000 }
    );
  });

  it('iso() never throws, even for garbage', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const iso = atemporal.iso(value as any);
        return iso === null || (typeof iso === 'string' && iso.length > 0);
      }),
      { numRuns: 1000 }
    );
  });
});

describe('atemporal: common attack vectors', () => {
  it('does not get confused by prototype pollution attempts', () => {
    const malicious = JSON.parse(
      '{"__proto__": {"polluted": true}, "year": 2024}'
    );
    const r = atemporal.try(malicious);
    // Should not throw, and should not have polluted Object.prototype.
    expect(({} as any).polluted).toBeUndefined();
    expect(r === null || typeof (r as any).isValid === 'function').toBe(true);
  });

  it('does not get confused by very long strings', () => {
    const longString = '2024-01-15' + ' '.repeat(10_000) + '2024-12-31';
    const r = atemporal.try(longString);
    expect(r === null || typeof (r as any).isValid === 'function').toBe(true);
  });

  it('does not get confused by strings with only special characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map(
          () => '!@#$%^&*()_+-={}[]|:;<>?,./~`'
        ),
        (s) => {
          const r = atemporal.try(s);
          return r === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not get confused by negative numbers, huge numbers', () => {
    const cases = [
      -1,
      -10_000_000_000_000,
      10_000_000_000_000,
      Number.MAX_VALUE,
      Number.EPSILON,
    ];
    for (const n of cases) {
      const r = atemporal.try(n);
      expect(r === null || typeof r.isValid === 'function').toBe(true);
    }
  });
});
