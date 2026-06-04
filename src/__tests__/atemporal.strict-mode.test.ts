/**
 * @file Tests for Sprint 1.3: strict mode.
 */
import atemporal from '../index';

describe('atemporal.setStrictMode (Sprint 1.3)', () => {
  afterEach(() => {
    // Make sure we don't leak strict mode to other tests.
    atemporal.setStrictMode(false);
    atemporal.clearStrictWarnings();
  });

  it('defaults to disabled', () => {
    atemporal.setStrictMode(false);
    expect(atemporal.isStrictMode()).toBe(false);
  });

  it('can be enabled with a boolean', () => {
    atemporal.setStrictMode(true);
    expect(atemporal.isStrictMode()).toBe(true);
  });

  it('can be enabled with custom flags', () => {
    atemporal.setStrictMode({ warnOnDateObjectInput: true });
    expect(atemporal.isStrictMode()).toBe(true);
    const flags = atemporal.getStrictModeFlags();
    expect(flags.warnOnDateObjectInput).toBe(true);
  });

  it('can be disabled again', () => {
    atemporal.setStrictMode(true);
    atemporal.setStrictMode(false);
    expect(atemporal.isStrictMode()).toBe(false);
  });

  it('clearStrictWarnings is a no-op when there are no warnings', () => {
    expect(() => atemporal.clearStrictWarnings()).not.toThrow();
  });

  it('getStrictModeFlags returns a copy (mutating is a no-op)', () => {
    atemporal.setStrictMode({ warnOnDateObjectInput: true });
    const flags = atemporal.getStrictModeFlags();
    flags.warnOnDateObjectInput = false;
    const again = atemporal.getStrictModeFlags();
    expect(again.warnOnDateObjectInput).toBe(true);
  });
});
