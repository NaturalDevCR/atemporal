# Microservice timezones

A common anti-pattern in microservice architectures is to let each
service store and render dates in its own timezone. This recipe
shows the **canonical pattern**: every service stores UTC, every
service renders in the timezone of the *consumer*, not the service.

## The rule

> **Store UTC, render in the consumer's timezone.**

| Layer       | Format             | Why                                  |
| ----------- | ------------------ | ------------------------------------ |
| Database    | UTC ISO 8601       | Portable, sortable, unambiguous     |
| API         | UTC ISO 8601       | Stable across services              |
| Render      | Consumer's IANA TZ | What the user actually sees         |

## Storing in Postgres (Prisma)

```prisma
model Audit {
  id        BigInt   @id @default(autoincrement())
  actor     String
  action    String
  at        DateTime @db.Timestamptz(6)  // always UTC
}
```

`Timestamptz` is the right choice. Naive `Timestamp` columns are a
trap.

## Sending over the wire (JSON)

```ts
// Server (e.g. audit-service)
import atemporal from 'atemporal';

const row = {
  id: 1n,
  actor: 'user_42',
  action: 'login',
  at: atemporal().format(atemporal.presets.ISO),  // '2024-01-15T12:34:56.789Z'
};

// JSON serialization
return new Response(JSON.stringify(row), {
  headers: { 'content-type': 'application/json' },
});
```

The trailing `Z` makes the timezone explicit. Consumers can parse it
unambiguously.

## Receiving and rendering (in another service)

```ts
// Client service, e.g. ui-service
import atemporal from 'atemporal';

const renderAudit = (row: Audit, viewerTz: string) => {
  return {
    ...row,
    at: atemporal(row.at, viewerTz).format('YYYY-MM-DD HH:mm'),
  };
};

renderAudit({ id: 1, actor: 'u', action: 'login', at: '2024-01-15T12:34:56.789Z' }, 'America/New_York');
// { id: 1, actor: 'u', action: 'login', at: '2024-01-15 07:34' }
```

The conversion happens at the **render boundary**, not in storage.

## What if the consumer doesn't know their timezone?

Pass it in the request (the user agent can derive it from the
browser), or default to UTC and let the UI offer a toggle.

```ts
// In an Express handler
const tz = req.headers['x-viewer-tz'] || 'UTC';
const at = atemporal(row.at, tz).format('YYYY-MM-DD HH:mm');
```

The `x-viewer-tz` header is a common convention. The browser sets it
from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## DST gotcha

DST transitions can produce times that **do not exist** (the "spring
forward" gap) or that **occur twice** (the "fall back" overlap).
atemporal handles this correctly because it delegates to the
Temporal polyfill's IANA database, but you should still:

1. **Schedule with UTC in cron expressions.** "Run at 09:00 in
   New York" should be `TZ=America/New_York 0 9 * * *` on the *scheduler*,
   not on the worker.
2. **Display local time in the UI**, never in the database.
3. **Audit in UTC.** When you ask "when did this happen?", the answer
   is always a UTC timestamp.

## See also

- [Prisma](prisma.md)
- [Audit log timestamps](audit-log.md)
- [React Server Components](rsc.md)
