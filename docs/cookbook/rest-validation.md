# REST input validation

When a client sends a date string in a JSON body, you have three
options:

1. Trust the value and pass it to `atemporal()`.
2. Validate and **throw** a 400.
3. Validate and **return** a structured error (the `atemporal.validate()`
   way).

This recipe shows the third option, which is the most friendly to
client developers because it carries an `ATEMPORAL_*` error code they
can match against.

## Express

```ts
import express, { Request, Response } from 'express';
import atemporal from 'atemporal';

const app = express();
app.use(express.json());

app.post('/events', (req: Request, res: Response) => {
  const result = atemporal.validate(req.body.occurredAt);
  if (!result.ok) {
    return res.status(400).json({
      error: 'Invalid `occurredAt`',
      code: result.code,            // 'ATEMPORAL_INVALID_DATE'
      reason: result.reason,
    });
  }
  // result.iso is a valid ISO 8601 string you can store as-is.
  events.push({ occurredAt: result.iso });
  res.status(201).end();
});
```

## Fastify (with JSON Schema)

```ts
import Fastify from 'fastify';
import atemporal from 'atemporal';

const fastify = Fastify({ logger: true });

const isoDateSchema = {
  type: 'string',
  validate: (value: unknown) => atemporal.validate(value).ok
    ? true
    : atemporal.validate(value).code, // surfaced as a 400
};

fastify.post('/events', {
  schema: {
    body: {
      type: 'object',
      required: ['occurredAt'],
      properties: { occurredAt: isoDateSchema },
    },
  },
}, async (req) => {
  const occurredAt = atemporal(req.body.occurredAt);
  return { stored: occurredAt.format(atemporal.presets.ISO) };
});
```

## Zod

Zod does not have a built-in date validator that produces structured
errors. We can wrap `atemporal.validate()`:

```ts
import { z } from 'zod';
import atemporal from 'atemporal';

const AtemporalDate = z.unknown().transform((value, ctx) => {
  const r = atemporal.validate(value);
  if (!r.ok) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: r.reason ?? 'Invalid date',
      params: { code: r.code },
    });
    return z.NEVER;
  }
  return r.iso!;
});

const Event = z.object({
  occurredAt: AtemporalDate,
});
```

The `params: { code: r.code }` field is what your API gateway can use
to map errors to localized messages.

## Common mistakes to avoid

1. **Do not** use `new Date(req.body.occurredAt)` and pass it to
   `atemporal()` without validating first. The `Date` constructor
   happily accepts `new Date('not a date')` and returns an Invalid Date
   object that propagates silently.
2. **Do not** store the original string. Always normalize to ISO 8601
   (`result.iso`) before persisting. The original string is a
   presentation concern, not a storage concern.
3. **Do not** use `atemporal()` and rely on `.isValid()` downstream.
   The early-validation pattern above fails fast and gives the client
   a useful error.

## See also

- [`atemporal.validate()`](../api/creating-instances.md#validate)
- [`atemporal.try()`](../api/creating-instances.md#try)
- [Threat model](../../SECURITY.md#threat-model)
