# Structured logging

atemporal's errors carry stable `ATEMPORAL_*` codes. The pattern
below shows how to surface them in Pino, Datadog, Sentry, or any
structured logger.

## The base error type

```ts
import { AtemporalError, ATEMPORAL_ERROR_CODES } from 'atemporal';
```

Every atemporal error extends `AtemporalError` and has a `code` field
that is one of the values in `ATEMPORAL_ERROR_CODES`.

## With Pino

```ts
import pino from 'pino';
import atemporal, { AtemporalError } from 'atemporal';

const log = pino({ name: 'my-service' });

try {
  atemporal('not a date');
} catch (err) {
  if (err instanceof AtemporalError) {
    log.error({
      atemporalCode: err.code,
      atemporalName: err.name,
      msg: err.message,
    }, 'atemporal error');
  } else {
    log.error({ err }, 'unexpected error');
  }
}
```

The log line is JSON and has predictable fields. Your log pipeline
can index on `atemporalCode` to build a dashboard.

## With Sentry

```ts
import * as Sentry from '@sentry/node';
import { AtemporalError } from 'atemporal';

try {
  atemporal(value);
} catch (err) {
  if (err instanceof AtemporalError) {
    Sentry.withScope((scope) => {
      scope.setTag('atemporal.code', err.code);
      scope.setLevel('warning'); // bad input is a client bug, not a server error
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}
```

Tagging with `atemporal.code` lets Sentry group by error class.

## With Datadog

```ts
import { datadogLogs } from '@datadog/browser-logs';
import { AtemporalError } from 'atemporal';

try {
  atemporal(value);
} catch (err) {
  if (err instanceof AtemporalError) {
    datadogLogs.logger.error('atemporal error', {
      atemporal_code: err.code,
      atemporal_name: err.name,
    });
  }
}
```

## Aggregating across services

The same `ATEMPORAL_*` code appears regardless of which service
emitted it. Build a single dashboard with one widget per code:

| Code                          | Meaning                                | Action              |
| ----------------------------- | -------------------------------------- | ------------------- |
| `ATEMPORAL_INVALID_DATE`      | Client sent a bad date string          | Alert on spike      |
| `ATEMPORAL_INVALID_TIMEZONE`  | Client sent a bad IANA name            | Usually silent      |
| `ATEMPORAL_FORMAT_MISMATCH`   | Custom format token parse failed       | Investigate         |
| `ATEMPORAL_PLUGIN_LOAD_FAILED`| A plugin failed to load                | Page on-call        |
| `ATEMPORAL_INVALID_INSTANCE`  | Internal API misuse                    | File a bug          |

## Best practices

1. **Log on the boundary, not in the library.** atemporal itself
   does not log; it only throws. Logging is the application's job.
2. **Use `err.code`, not `err.message`**, for matching. Messages can
   change in patch releases; codes are stable.
3. **Set a `try`/`validate` preference at the boundary** for user
   input. Throwing is fine inside the application (where you control
   the input).
4. **Consider emitting a metric** (e.g. `Counter('atemporal.invalid_date')`)
   so you can graph trends over time without parsing logs.

## See also

- [REST input validation](rest-validation.md)
- [Threat model](../../SECURITY.md#threat-model)
