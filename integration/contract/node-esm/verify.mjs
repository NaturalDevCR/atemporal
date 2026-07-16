import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);
const result = atemporal('2026-07-15T10:00:00Z')
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');
if (result !== '2026-07-16 04:00' || !atemporal.isPluginLoaded('relativeTime')) {
  throw new Error(`Unexpected ESM contract result: ${result}`);
}
