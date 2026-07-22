import atemporal, { markAsPlugin, type Plugin } from '../../index';

describe('extension inspection contract', () => {
  test('tracks official, named third-party, and anonymous extensions separately', () => {
    const named = markAsPlugin(((Wrapper: any) => {
      Wrapper.prototype.namedExtension = () => true;
    }) as Plugin, {
      id: 'acme.named',
      official: false,
    });
    const anonymous = ((Wrapper: any) => {
      Wrapper.prototype.anonymousExtension = () => true;
    }) as Plugin;

    atemporal.extend(named);
    atemporal.extend(anonymous);

    expect(atemporal.getAppliedExtensions()).toEqual(expect.arrayContaining([
      { id: 'acme.named', kind: 'third-party' },
      { id: null, kind: 'third-party' },
    ]));
    expect(atemporal.getLoadedPlugins()).not.toContain('acme.named');
  });
});
