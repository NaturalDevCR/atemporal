# Formatting

The `.format()` method is very versatile. It accepts a token string or an `Intl` options object.

## Token-based Formatting

### Complete Token Reference

| Token  | Output Example               | Description                                      |
| ------ | ---------------------------- | ------------------------------------------------ |
| `YYYY` | `2025`                       | 4-digit year                                     |
| `YY`   | `25`                         | 2-digit year                                     |
| `MMMM` | `January`                    | Full month name                                  |
| `MMM`  | `Jan`                        | Abbreviated month name                           |
| `MM`   | `07`                         | Month, 2-digits (01-12)                          |
| `M`    | `7`                          | Month (1-12)                                     |
| `DD`   | `09`                         | Day of month, 2-digits (01-31)                   |
| `D`    | `9`                          | Day of month (1-31)                              |
| `dddd` | `Wednesday`                  | Full day of the week name                        |
| `ddd`  | `Wed`                        | Short day of the week name                       |
| `dd`   | `We`                         | Minimal day of the week name                     |
| `d`    | `3`                          | Day of the week, Sunday as 0 (0-6)               |
| `HH`   | `14`                         | Hour, 2-digits (00-23)                           |
| `H`    | `14`                         | Hour (0-23)                                      |
| `hh`   | `02`                         | Hour, 12-hour clock, 2-digits (01-12)            |
| `h`    | `2`                          | Hour, 12-hour clock (1-12)                       |
| `mm`   | `05`                         | Minute, 2-digits (00-59)                         |
| `m`    | `5`                          | Minute (0-59)                                    |
| `ss`   | `02`                         | Second, 2-digits (00-59)                         |
| `s`    | `2`                          | Second (0-59)                                    |
| `SSS`  | `123`                        | Millisecond, 3-digits (000-999)                  |
| `A`    | `PM`                         | AM PM (uppercase)                                |
| `a`    | `pm`                         | am pm (lowercase)                                |
| `Z`    | `+02:00`                     | Time zone offset with colon (±HH:mm)            |
| `ZZ`   | `+0200`                      | Time zone offset without colon (±HHmm)          |
| `z`    | `America/New_York`           | IANA time zone name                              |

> [!TIP]
> Use brackets `[]` to escape literal characters: `.format("[Today is] YYYY-MM-DD")`.

```ts
atemporal().format("YYYY-MM-DD [at] HH:mm:ss");
// => "2025-07-09 at 14:23:00"
```

```ts
// Month name and AM/PM examples
atemporal("2024-08-14T16:30:00").format("MMM DD, YYYY");       // "Aug 14, 2024"
atemporal("2024-08-14T16:30:00").format("MMMM Do, hh:mm A");   // "August 14th, 04:30 PM"
atemporal("2024-08-14T16:30:00").format("hh:mm a");             // "04:30 pm"
```

## `Intl.DateTimeFormat`

For advanced localization, pass an options object.

```ts
atemporal().format({ dateStyle: "full", timeStyle: "medium" }, "es-CR");
// => "miércoles, 9 de julio de 2025, 14:23:00"
```

Any valid `Intl.DateTimeFormatOptions` works:

```ts
// Custom weekday + month + day
atemporal().format({ weekday: "long", month: "long", day: "numeric" }, "ja-JP");
// => "7月9日水曜日"
```

## Advanced Tokens

Additional tokens are available via the [advancedFormat](/plugins/advanced-format) plugin:

| Token  | Output Example          | Description                           | Requires Plugin |
| ------ | ----------------------- | ------------------------------------- | --------------- |
| `Do`   | `15th`                  | Day of month with ordinal suffix      | advancedFormat  |
| `Qo`   | `3rd`                   | Quarter with ordinal suffix           | advancedFormat  |
| `zzz`  | `EST`                   | Short localized time zone name        | advancedFormat  |
| `zzzz` | `Eastern Standard Time` | Long localized time zone name         | advancedFormat  |
