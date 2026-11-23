# Business-day scheduling

Use the [`businessDays`](../plugins/business-days.md) plugin for whole business
days, configured weekends, and explicit holiday dates. Choose the business zone
before doing calendar arithmetic.

## Next business day at 09:00

```ts
import atemporal from 'atemporal';
import businessDays from 'atemporal/plugins/businessDays';
atemporal.extend(businessDays);

const nextBusiness = atemporal().timeZone('America/New_York').nextBusinessDay();
const at9am = nextBusiness.startOf('day').set('hour', 9);
```

`nextBusinessDay()` advances to a later business day. Its methods retain the
wrapper's zone; it does not accept a separate timezone options object.

## Holiday calendars

Configure holidays and ISO weekend weekdays after installing the plugin:

```ts
atemporal.setBusinessDaysConfig({
  holidays: ['2026-01-01', '2026-12-25'],
  weekendDays: [6, 7], // ISO weekdays: 1 = Monday, 7 = Sunday
});
```

This configuration is shared within the entry family. Set the application
calendar during initialization; use application-level isolation if concurrent
tenants need different holiday calendars.

Observed holidays must be supplied explicitly in `holidays`. The plugin does
not infer replacement dates, opening hours, or half-day holidays.

## Day-based deadlines

```ts
const incident = atemporal.parse('2026-07-17T09:00:00', {
  timeZone: 'America/New_York',
});
const deadline = incident.addBusinessDays(2);
```

The plugin exposes whole-day arithmetic, not `addBusinessHours()` or
`endOfBusinessDay()`. Working-hour SLAs require an application policy for opening
windows, partial days, holidays, and DST. The [timeSlots plugin](../plugins/time-slots.md)
can find free slots inside explicitly supplied windows.

## Recurring meetings

Reassign the value returned by immutable arithmetic:

```ts
let current = atemporal.parse('2026-03-02T09:00:00', {
  timeZone: 'America/New_York',
});
const meetings: string[] = [];
for (let i = 0; i < 10; i++) {
  meetings.push(current.toString());
  current = current.add(1, 'week');
}
```

This preserves 09:00 in New York across its DST transition; the UTC offset can
change. Choose an explicit disambiguation policy when scheduling ambiguous
local times with `atemporal.parse()` or `atemporal.zonedDateTime()`.

## See also

- [businessDays plugin reference](../plugins/business-days.md)
- [Microservice timezones](microservice-tz.md)
- [i18n formatting](i18n.md)
