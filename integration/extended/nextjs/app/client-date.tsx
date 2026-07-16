'use client';

import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);

export function ClientDate() {
  const formattedDate = atemporal('2026-07-15T10:00:00Z')
    .timeZone('America/Costa_Rica')
    .add(1, 'day')
    .format('YYYY-MM-DD HH:mm');

  return <p id="client-date">{formattedDate}</p>;
}
