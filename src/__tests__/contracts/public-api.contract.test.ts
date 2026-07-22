import atemporal, { type ParseOptions } from '../../index';

describe('strict public API contract', () => {
  test('exposes stable strict parsing option values', () => {
    const options: ParseOptions = {
      timeZone: 'America/New_York',
      disambiguation: 'reject',
      overflow: 'reject',
      preserveOriginalTimeZone: true,
    };

    const strictParse: (input: string, config?: ParseOptions) => unknown = atemporal.parse;
    const safeParse: (input: string, config?: ParseOptions) => unknown = atemporal.tryParse;

    expect(options.disambiguation).toBe('reject');
    expect(typeof strictParse).toBe('function');
    expect(typeof safeParse).toBe('function');
  });
});
