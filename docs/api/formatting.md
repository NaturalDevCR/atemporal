# Formatting

The `.format()` method is very versatile. It accepts a token string or an `Intl` options object.

## Token-based Formatting

| Token  | Output Example     | Description                           |
| ------ | ------------------ | ------------------------------------- |
| `YYYY` | `2025`             | 4-digit year                          |
| `YY`   | `25`               | 2-digit year                          |
| `MM`   | `07`               | Month, 2-digits (01-12)               |
| `M`    | `7`                | Month (1-12)                          |
| `DD`   | `09`               | Day of month, 2-digits (01-31)        |
| `D`    | `9`                | Day of month (1-31)                   |
| `HH`   | `14`               | Hour, 2-digits (00-23)                |
| `H`    | `14`               | Hour (0-23)                           |
| `hh`   | `02`               | Hour, 12-hour clock, 2-digits (01-12) |
| `h`    | `2`                | Hour, 12-hour clock (1-12)            |
| `mm`   | `05`               | Minute, 2-digits (00-59)              |
| `m`    | `5`                | Minute (0-59)                         |
| `ss`   | `02`               | Second, 2-digits (00-59)              |
| `s`    | `2`                | Second (0-59)                         |
| `SSS`  | `123`              | Millisecond, 3-digits                 |
| `dddd` | `Wednesday`        | Full day of the week name             |
| `ddd`  | `Wed`              | Short day of the week name            |
| `Z`    | `+02:00`           | Time zone offset with colon           |
| `ZZ`   | `+0200`            | Time zone offset without colon        |
| `z`    | `America/New_York` | IANA time zone name                   |

> [!TIP]
> Use brackets `[]` to display literal characters: `format("[Today is] YYYY-MM-DD")`.

```ts
atemporal().format("YYYY-MM-DD [at] HH:mm:ss");
// => "2025-07-09 at 14:23:00"
```

## `Intl.DateTimeFormat`

For advanced localization, pass an options object.

```ts
atemporal().format({ dateStyle: "full", timeStyle: "medium" }, "es-CR");
// => "miércoles, 9 de julio de 2025, 14:23:00"
```

## Advanced Tokens

Additional tokens like `Do` (ordinals) and `zzz` (timezone names) are available via the [advancedFormat](/plugins/advanced-format) plugin.
