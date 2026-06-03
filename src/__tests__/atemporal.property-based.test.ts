/**
 * @file Property-based tests for the core parse/format invariants.
 *
 * These tests use `fast-check` to generate hundreds of random inputs
 * and assert that the library's invariants hold. They are slower than
 * example-based tests (~3s) and are gated behind the `test:ci` script
 * by convention.
 */
import * as fc from 'fast-check';
import atemporal from '../index';

describe('atemporal: parse/format invariants (property-based)', () => {
  it('try() never throws for arbitrary unknown input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const r = atemporal.try(value as any);
        return r === null || (typeof r === 'object' && typeof r.isValid === 'function');
      }),
      { numRuns: 500 }
    );
  });

  it('validate() always returns an object with `ok`', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const r = atemporal.validate(value);
        return typeof r === 'object' && typeof r.ok === 'boolean';
      }),
      { numRuns: 500 }
    );
  });

  it('iso() returns null for inputs that validate rejects', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter(s => atemporal.validate(s).ok === false),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (value) => {
          return atemporal.iso(value as any) === null;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('iso() returns a non-empty string for inputs that validate accepts', () => {
    fc.assert(
      fc.property(
        fc
          .date({ min: new Date('1900-01-01T00:00:00Z'), max: new Date('2200-12-31T23:59:59Z') })
          .filter(d => !isNaN(d.getTime())),
        (d) => {
          const iso = atemporal.iso(d);
          return typeof iso === 'string' && iso.length > 0 && iso.includes('T');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('presets are immutable', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (key) => {
          try {
            (atemporal.presets as any)[key] = 'MUTATED';
            return false;
          } catch {
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('atemporal: arithmetic invariants (property-based)', () => {
  it('add(0) is a no-op for any valid date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1900-01-01T00:00:00Z'), max: new Date('2200-12-31T23:59:59Z') })
          .filter(d => !isNaN(d.getTime())),
        (d) => {
          const a = atemporal(d);
          const b = a.add(0, 'day');
          return a.format(atemporal.presets.ISO) === b.format(atemporal.presets.ISO);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('add(1, day) is reversed by subtract(1, day)', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1900-01-01T00:00:00Z'), max: new Date('2200-12-31T23:59:59Z') })
          .filter(d => !isNaN(d.getTime())),
        (d) => {
          const a = atemporal(d);
          const b = a.add(1, 'day').subtract(1, 'day');
          return a.format(atemporal.presets.ISO) === b.format(atemporal.presets.ISO);
        }
      ),
      { numRuns: 100 }
    );
  });
});
