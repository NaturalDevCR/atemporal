import atemporal from 'atemporal';

// Keep the canonical application fixture concrete and timezone-sensitive.
export const costaRicaFormat = atemporal('2024-07-15T12:00:00Z', 'America/Costa_Rica')
  .format('YYYY-MM-DD HH:mm');
