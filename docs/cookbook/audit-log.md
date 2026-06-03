# Audit log timestamps

Audit logs are append-only records of "who did what when". The "when"
column is the most important column, and it is also the easiest to
get wrong.

## The minimum bar

An audit log row should answer:

1. **When** (UTC, monotonic, millisecond resolution)
2. **Who** (an opaque user id, not a PII string)
3. **What** (an enum or a stable code, not free text)
4. **Where** (an origin IANA timezone, for forensic reconstruction)
5. **Why** (optional, but recommended for sensitive actions)

## The schema

```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL,  -- UTC, monotonic
  actor_id    TEXT       NOT NULL,
  action      TEXT       NOT NULL,   -- e.g. 'user.delete'
  origin_tz   TEXT       NOT NULL,   -- e.g. 'America/New_York'
  meta        JSONB      NOT NULL DEFAULT '{}'
);
CREATE INDEX audit_log_occurred_at_idx ON audit_log (occurred_at DESC);
CREATE INDEX audit_log_actor_action_idx ON audit_log (actor_id, action, occurred_at DESC);
```

## Writing

```ts
import atemporal from 'atemporal';
import { prisma } from './db';

export async function audit(opts: {
  actorId: string;
  action: string;
  originTz?: string;
  meta?: Record<string, unknown>;
}) {
  const now = atemporal();  // UTC, ISO 8601 with milliseconds

  await prisma.auditLog.create({
    data: {
      occurredAt: now.toDate(),
      actorId: opts.actorId,
      action: opts.action,
      originTz: opts.originTz ?? atemporal.getDefaultTimeZone?.() ?? 'UTC',
      meta: opts.meta ?? {},
    },
  });
}

// Usage
await audit({
  actorId: 'user_42',
  action: 'document.delete',
  meta: { documentId: 'doc_123' },
});
```

## The `origin_tz` field

Storing the timezone of the actor's browser matters because:

1. **Reconstruction.** If you ever need to answer "what time was it
   for the user when this happened?", the IANA timezone is
   sufficient.
2. **Anomaly detection.** A user who logs in from `UTC` and then
   5 minutes later from `Asia/Tokyo` is suspicious.
3. **Compliance.** Some regulations (e.g. finance) require the
   "local time" of the action, not UTC.

## Monotonicity

For audit logs, you usually want `occurred_at` to be **monotonically
increasing** — i.e. row 2 happened after row 1, always. The
`TIMESTAMPTZ` in Postgres gives you microsecond resolution; if you
need strict monotonicity (e.g. for cryptographic chaining), use a
`SEQUENCE` or a Lamport clock.

## Tamper evidence

If your audit log is security-sensitive, consider:

- **Append-only role** in Postgres. No `UPDATE` or `DELETE` grants.
- **Hash chaining.** Include `prev_hash = sha256(occurred_at || actor || action || meta)`
  in the row, and verify on read.
- **External sink.** Stream the same rows to S3 / GCS / BigQuery in
  near-real-time. The external copy is harder to tamper with.

## What you do *not* need to log

- The user's IP (unless you also log the geo and have a reason).
- The user's locale string (the `origin_tz` is enough).
- The user's *local clock* (it can be wrong; the server's UTC is
  the source of truth).

## See also

- [Prisma](prisma.md)
- [Microservice timezones](microservice-tz.md)
- [Structured logging](logging.md)
