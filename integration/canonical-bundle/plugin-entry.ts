import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);

export const costaRicaRelativeTime = atemporal('2024-07-15T12:00:00Z', 'America/Costa_Rica')
  .fromNow();
