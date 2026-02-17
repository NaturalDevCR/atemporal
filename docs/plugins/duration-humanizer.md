# durationHumanizer

Converts `Temporal.Duration` objects into human-readable, localized strings.

## Usage

```ts
import atemporal from "atemporal";
import durationHumanizer from "atemporal/plugins/durationHumanizer";

atemporal.extend(durationHumanizer);

const duration = { hours: 2, minutes: 30 };
console.log(atemporal.humanize(duration)); // "2 hours and 30 minutes"
```

## Multi-Language Support

```ts
atemporal.humanize(duration, { locale: "es" }); // "2 horas y 30 minutos"
atemporal.humanize(duration, { locale: "ja" }); // "2時間30分"
```

## Options

- `locale`: The locale string (default: `'en'`).
- `listStyle`: `'long'`, `'short'`, or `'narrow'`.
- `unitDisplay`: `'long'`, `'short'`, or `'narrow'`.

```ts
atemporal.humanize(duration, { unitDisplay: "short" }); // "2 hr and 30 min"
```
