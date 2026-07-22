describe('official plugin tracking', () => {
  it('lists a direct official extension by its explicit canonical name', () => {
    jest.isolateModules(() => {
      const atemporal = require('../index').default;
      const relativeTime = require('../plugins/relativeTime').default;

      atemporal.extend(relativeTime);

      expect(atemporal.isPluginLoaded('relativeTime')).toBe(true);
      expect(atemporal.getLoadedPlugins()).toEqual(['relativeTime']);
      expect(atemporal.getAppliedExtensions()).toEqual([
        { id: 'relativeTime', kind: 'official' },
      ]);
    });
  });

  it('does not list a third-party extension as an official plugin', () => {
    jest.isolateModules(() => {
      const atemporal = require('../index').default;
      const thirdParty = () => undefined;

      atemporal.extend(thirdParty);

      expect(atemporal.getLoadedPlugins()).toEqual([]);
    });
  });

  it('gives lazy and direct loading the same official state', async () => {
    await jest.isolateModulesAsync(async () => {
      const atemporal = require('../index').default;
      await atemporal.lazyLoad('relativeTime');

      expect(atemporal.isPluginLoaded('relativeTime')).toBe(true);
      expect(atemporal.getLoadedPlugins()).toEqual(['relativeTime']);
    });
  });
});
