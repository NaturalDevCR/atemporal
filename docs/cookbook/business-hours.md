# Business hours scheduling

Computing "the next business day at 09:00 local" is one of those
tasks that looks simple and is full of edge cases. atemporal ships
the [`businessDays`](../plugins/business-days.md) plugin which
implements the boring parts.

## Basic usage

```ts
import atemporal from 'atemporal';
import businessDays from 'atemporal/plugins/businessDays';
atemporal.extend(businessDays);

const tomorrow = atemporal().add(1, 'day');
const nextBusiness = tomorrow.nextBusinessDay({ tz: 'America/New_York' });
const at9am = nextBusiness.set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
```

## Holiday calendars

```ts
import businessDays from 'atemporal/plugins/businessDays';
atemporal.extend(businessDays, {
  holidays: [
    '2024-12-25', '2024-12-26',  // Christmas + observed
    '2024-01-01',                  // New Year
  ],
  weekend: [0, 6],                 // Sunday + Saturday
});
```

The holiday list is a per-environment config; load it from a
database or a config service in production.

## SLO computation

```ts
const incident = atemporal('2024-01-15T03:00:00Z');
const sla = incident.addBusinessHours(4, { tz: 'America/New_York' });
// 4 business hours after the incident, skipping nights and weekends.
```

## Recurring meetings

```ts
import businessDays from 'atemporal/plugins/businessDays';
atemporal.extend(businessDays);

const start = atemporal('2024-01-01T09:00:00', 'America/New_York');
const meetings: string[] = [];
for (let i = 0; i < 10; i++) {
  meetings.push(start.format(atemporal.presets.ISO));
  start.add(1, 'week');  // every Monday at 09:00 NY
}
```

## Edge cases the plugin handles

- **DST transitions.** A "9 AM local" meeting that falls on the
  spring-forward day is still rendered as "9 AM local" in the
  attendee's calendar; the underlying UTC instant shifts by 1 hour.
- **Holiday on a weekend.** "If a holiday falls on a Saturday, we
  observe it on Friday" — the `observed` config option handles this.
- **Half-day holidays.** Use `endOfBusinessDay(...)` and `addBusinessHours(...)`
  with a custom `hoursPerDay` of 4.

## Anti-patterns to avoid

1. **Do not** compute business days by adding `1, 'day'` in a loop
   and skipping weekends yourself. You will get DST and holidays
   wrong. Use the plugin.
2. **Do not** store business day arithmetic in a cron expression.
   "Every weekday at 09:00" is fine; "skip the day after Thanksgiving"
   is not.
3. **Do not** rely on the user's local clock. All business-day
   arithmetic must specify an IANA timezone.

## See also

- [`businessDays` plugin reference](../plugins/business-days.md)
- [Microservice timezones](microservice-tz.md)
- [i18n formatting](i18n.md)
