---
name: Bug report
about: Report a defect in atemporal
title: "[Bug] "
labels: ["bug", "needs-triage"]
assignees: []
---

## Describe the bug

A clear and concise description of what the bug is.

## To reproduce

```ts
// Minimal code that reproduces the issue.
import atemporal from 'atemporal';

atemporal('…').format('…');
```

**Expected behaviour:** …
**Actual behaviour:** …

## Environment

- atemporal version: `1.x.y` (run `npm ls atemporal`)
- Node.js version: `22.x` / `24.x` / `26.x`
- Browser (if applicable): `Chrome 144+` / `Firefox 139+` / `Safari 18+`
- `@js-temporal/polyfill` version (if installed): `0.x.y`
- Operating system: `macOS 14` / `Ubuntu 22.04` / `Windows 11`

## Error output

If the bug produces a thrown error, paste the **full** stack trace
and the `code` field of the error (e.g. `ATEMPORAL_INVALID_DATE`).

## Additional context

Anything else that might help — links, screenshots, related issues.
