import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);
const result: string = atemporal('2026-07-15T10:00:00Z')
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');
if (result !== '2026-07-16 04:00') throw new Error(result);

// Native declarations compile even when the executing runtime uses the default entry.
import type native from 'atemporal/native';
import type { AtemporalFactory, InstantInput } from 'atemporal/native';
import type nativeRelativeTime from 'atemporal/native/plugins/relativeTime';

declare const nativeFactory: typeof native;
declare const nativePlugin: typeof nativeRelativeTime;
const instantInput: InstantInput = '2026-07-15T10:00:00.123456789Z';
if (false) {
  const factory: AtemporalFactory = nativeFactory;
  factory.extend(nativePlugin);
  const nanoseconds: bigint = nativeFactory.instant(instantInput).epochNanoseconds;
  const raw = nativeFactory.zonedDateTime('2026-07-15T10:00:00[UTC]');
  nativeFactory(raw).fromNow();
  // @ts-expect-error A plain date cannot be used as an instant.
  nativeFactory.instant({ year: 2026, month: 7, day: 15 });
}
