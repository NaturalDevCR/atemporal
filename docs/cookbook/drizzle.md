# Drizzle

Drizzle ORM uses standard SQL types. The mapping to atemporal is the
same as for Prisma, but the column helper syntax differs.

## Schema (Drizzle)

```ts
import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  // `withTimezone: true` → Postgres `timestamptz` (UTC stored).
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
});
```

## Reading

```ts
import atemporal from 'atemporal';
import { db } from './db';
import { events } from './schema';
import { eq } from 'drizzle-orm';

const rows = await db
  .select()
  .from(events)
  .where(eq(events.id, 1));

const event = rows[0];
const start = atemporal(event.startAt);
console.log(start.format(atemporal.presets.ISO));
```

## Writing

```ts
import atemporal from 'atemporal';
import { db } from './db';
import { events } from './schema';

const r = atemporal.validate(req.body.startAt);
if (!r.ok) throw new Error(r.code);

await db.insert(events).values({
  name: 'Launch',
  startAt: new Date(r.iso!),  // Drizzle accepts a Date or string
});
```

Drizzle will serialize the value to UTC before sending it to Postgres.

## Drizzle Kit migrations

Drizzle Kit introspects the column types from the schema. The
mapping is one-to-one with the values you get back from `SELECT`:

| Column type              | Drizzle returns     | atemporal value               |
| ------------------------ | ------------------- | ----------------------------- |
| `timestamp(6)`           | `Date` (no tz info) | `atemporal(d, 'UTC')`         |
| `timestamptz(6)`         | `Date` (always UTC) | `atemporal(d)`                |

The Date object Drizzle returns is a host-system `Date`, which is
ambiguous. The rule of thumb:

- **Always pass the `withTimezone: true` flag** to Drizzle's `timestamp()`
  helper unless you have a very specific reason to use naive timestamps.
- **When in doubt, assert UTC** on the read path. It costs nothing and
  removes a class of bugs.

## See also

- [Prisma](prisma.md)
- [REST input validation](rest-validation.md)
- [Microservice timezones](microservice-tz.md)
