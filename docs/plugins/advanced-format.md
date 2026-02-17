# advancedFormat

Extends the `.format()` method to support advanced formatting tokens including ordinals and timezone names.

## Usage

```ts
import atemporal from "atemporal";
import advancedFormat from "atemporal/plugins/advancedFormat";

atemporal.extend(advancedFormat);

const date = atemporal("2024-01-15");
console.log(date.format("Do MMMM YYYY")); // "15th January 2024"
```

## Advanced Tokens

- `Do` - Day of month with ordinal suffix (e.g., "1st", "22nd")
- `Qo` - Quarter of year with ordinal suffix (e.g., "1st", "2nd")
- `zzz` - Short timezone name (e.g., "EST", "PDT")
- `zzzz` - Long timezone name (e.g., "Eastern Standard Time")

## Multi-Language Support

Ordinal suffixes are supported for several languages: `en`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `ja`, `ko`, `zh`.

```ts
atemporal("2024-01-15").format("Do [de] MMMM", "es"); // "15º de enero"
```
