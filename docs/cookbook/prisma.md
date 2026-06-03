# Prisma

Prisma's `@db.DateTime` and `@db.Timestamp` columns map cleanly to
`Temporal.Instant` (UTC). We can wrap a Prisma record with atemporal
on read, and unwrap on write.

## Schema (Prisma)

```prisma
model Event {
  id        Int      @id @default(autoincrement())
  name      String
  startAt   DateTime @db.Timestamp(6)
  endAt     DateTime? @db.Timestamp(6)
}
```

## Reading

```ts
import atemporal from 'atemporal';
import { prisma } from './db';

const event = await prisma.event.findUnique({ where: { id: 1 } });
if (!event) throw new Error('not found');

const start = atemporal(event.startAt);
const end = event.endAt ? atemporal(event.endAt) : null;

console.log(start.format(atemporal.presets.ISO));
// '2024-01-15T12:34:56.789Z'

console.log(start.timeZone('America/New_York').format('YYYY-MM-DD hh:mm A'));
// '2024-01-15 07:34 AM'
```

## Writing

```ts
import atemporal from 'atemporal';
import { prisma } from './db';

// Wrap a user-supplied string.
const r = atemporal.validate(req.body.startAt);
if (!r.ok) return res.status(400).json({ code: r.code });

// r.iso is a string Prisma accepts directly.
await prisma.event.create({
  data: { name: 'Launch', startAt: r.iso! },
});
```

## Time-zone conversion at the boundary

If your database stores `DateTime` without a time zone (Postgres
`timestamp` without `with time zone`), you must tell atemporal
**which** time zone the bare value is in. Otherwise it assumes the
configured default, which can be wrong.

```ts
// In Postgres, a `timestamp` column has no tz info. We assert it is UTC.
const start = atemporal(event.startAt, 'UTC');
```

For `@db.Timestamptz` (Postgres `timestamptz`), the value is always
stored in UTC, so you can use `atemporal(event.startAt)` directly.

## Range queries

```ts
const from = atemporal('2024-01-01', 'UTC');
const to = atemporal('2024-02-01', 'UTC');

const events = await prisma.event.findMany({
  where: {
    startAt: {
      gte: from.toDate(),  // or from.format(atemporal.presets.ISO) for a string
      lt: to.toDate(),
    },
  },
});
```

## Date-fns / moment migration

If you are migrating a Prisma-heavy codebase from `moment`, the
transition is mechanical:

```ts
// moment
const start = moment(event.startAt).tz('America/New_York');
const iso = start.format('YYYY-MM-DD HH:mm');

// atemporal
const start = atemporal(event.startAt).timeZone('America/New_York');
const iso = start.format('YYYY-MM-DD HH:mm');
```

The wrapper classes are immutable in both, so chained calls work
the same way.

## See also

- [Drizzle](drizzle.md)
- [Microservice timezones](microservice-tz.md)
- [Audit log timestamps](audit-log.md)
