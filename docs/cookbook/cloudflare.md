# Cloudflare Workers

Cloudflare Workers run on V8 isolates. They have no Node APIs
(`process`, `Buffer`, etc.) and a strict 1 MB bundle limit. atemporal
is a good fit because:

- It has **zero Node-only dependencies**.
- It uses `Intl.DateTimeFormat` (available in V8) and the Temporal
  polyfill (which works in isolates).
- The CJS+ESM dual bundle is compatible with the Workers module system.

## The simplest Worker

```ts
// src/index.ts
import atemporal from 'atemporal';

export default {
  async fetch(request: Request): Promise<Response> {
    const now = atemporal();
    return new Response(`Server time: ${now.format(atemporal.presets.ISO)}`);
  },
};
```

## A Worker that handles dates from a request

```ts
import atemporal from 'atemporal';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const r = atemporal.validate(url.searchParams.get('when'));
    if (!r.ok) {
      return new Response(
        JSON.stringify({ code: r.code, reason: r.reason }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const when = atemporal(r.iso!, 'UTC');
    const future = when.add(7, 'day');
    return new Response(future.format(atemporal.presets.ISO_DATE));
  },
};
```

## Bundle size

atemporal + the Temporal polyfill fits in under **80 KB** gzipped.
A bare-bones Worker with just the polyfill is **~60 KB**. The
remaining ~20 KB is atemporal itself.

To minimize bundle size:

1. Use **ESM** imports: `import atemporal from 'atemporal'`. The
   bundler will tree-shake unused code.
2. **Don't import the `relativeTime` plugin** unless you need it.
   The other 7 plugins are similarly tree-shakable.
3. Use `wrangler`'s default bundler; **avoid** adding a Babel
   step that prevents tree-shaking.

## Caching

Workers have a built-in `caches` API. atemporal's internal caches
(IntlCache, DiffCache) live in-process, so they are useful within a
single invocation but not across Workers. To cache formatted output:

```ts
const cache = caches.default;

export default {
  async fetch(request: Request): Promise<Response> {
    const cached = await cache.match(request);
    if (cached) return cached;

    const now = atemporal();
    const response = new Response(now.format(atemporal.presets.ISO), {
      headers: {
        'content-type': 'text/plain',
        'cache-control': 's-maxage=60',
      },
    });
    // Use `event.waitUntil` if you have one.
    await cache.put(request, response.clone());
    return response;
  },
};
```

## Cron Triggers

Workers can run on a schedule. atemporal makes "next Friday at 09:00"
trivial:

```ts
import atemporal from 'atemporal';

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const next = atemporal()
      .add(1, 'day')
      .startOf('day')
      .set({ hour: 9, minute: 0 });

    ctx.waitUntil(env.QUEUE.send({ runAt: next.toString() }));
  },
};
```

## Limitations

- `Temporal.Now` returns the **isolate's** wall clock, which is
  whatever the Worker runtime decides. Do not assume it is the user's
  local time.
- Cloudflare's IANA database is updated periodically; an IANA name
  that does not exist in the current data will throw
  `InvalidTimeZoneError`. Always catch this on the boundary.

## See also

- [REST input validation](rest-validation.md)
- [Microservice timezones](microservice-tz.md)
- [Bundle size enforcement](../guide/performance.md)
