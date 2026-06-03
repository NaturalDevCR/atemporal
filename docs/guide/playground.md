# Playground

The fastest way to try atemporal is the **interactive playground**.
Run it locally or open it in the browser.

## Local playground

```bash
git clone https://github.com/NaturalDevCR/atemporal.git
cd atemporal
npm install
npm run dev
```

This starts a tsup watch process and prints the path to a Node-based REPL
where you can paste any snippet from the docs and see the output.

## Online playground (one-click)

StackBlitz opens a pre-configured workspace with `atemporal` and the
Temporal polyfill already installed:

> **[Open in StackBlitz →](https://stackblitz.com/edit/atemporal-playground)**
> (link to be activated after the StackBlitz template is published)

The same workspace is mirrored on CodeSandbox:

> **[Open in CodeSandbox →](https://codesandbox.io/s/atemporal-playground)**
> (link to be activated after the CodeSandbox sandbox is published)

## Embed in your own docs

If you maintain a project that uses atemporal and want to embed a
live editor in your own site, use the
[`@atemporal/embed`](https://github.com/NaturalDevCR/atemporal-embed)
component (a thin wrapper around StackBlitz's SDK):

```html
<script type="module" src="https://unpkg.com/@atemporal/embed"></script>
<atemporal-playground
  code="atemporal('2024-01-15').format('YYYY-MM-DD')"
  preset="node"
></atemporal-playground>
```

## Try it now (no install)

Paste this snippet into a browser DevTools console on any page that
already loads atemporal:

```js
const { default: atemporal } = await import('https://esm.sh/atemporal');
console.log(atemporal('2024-01-15').format('YYYY-MM-DD'));
// → '2024-01-15'

console.log(atemporal.validate('2024-01-15'));
// → { ok: true, iso: '2024-01-15T00:00:00.000Z', confidence: 1 }

console.log(atemporal.try('not a date'));
// → null
```

## Contributing playground examples

We accept PRs that add new playground templates. Useful patterns:

- A "first ten minutes" tour for new users.
- A "DST gotchas" snippet for timezone bugs.
- A "migrate from Day.js" snippet that loads both libraries side-by-side.
- A "Zod + atemporal" form validation example.

Templates live in `playground/` at the repo root. Add a new
`<name>.ts` file and a small README. CI will run it and snapshot the
output for the docs.
