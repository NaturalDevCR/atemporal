import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

import { ClientDate } from './client-date';

atemporal.extend(relativeTime);

const formattedDate = atemporal('2026-07-15T10:00:00Z')
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');

export default function Page() {
  return (
    <main>
      <p id="server-date">{formattedDate}</p>
      <ClientDate />
    </main>
  );
}
