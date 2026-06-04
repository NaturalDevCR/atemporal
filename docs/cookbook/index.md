# Cookbook

Real-world recipes for using atemporal in production. Each recipe is a
self-contained pattern you can copy and adapt.

## Recipes

| Topic                                              | Use case                                      |
| -------------------------------------------------- | --------------------------------------------- |
| [REST input validation](rest-validation.md)        | Validate `body.createdAt` in Express / Fastify |
| [Prisma](prisma.md)                                | Map a Prisma `DateTime` column to a wrapper   |
| [Drizzle](drizzle.md)                              | Map a Drizzle `timestamp` column              |
| [React Server Components](rsc.md)                  | Format dates on the server in a Next.js app   |
| [Cloudflare Workers](cloudflare.md)                | Cold-start, small bundle, no Node APIs        |
| [Structured logging](logging.md)                   | Emit atemporal error codes to your log stack   |
| [Microservice timezones](microservice-tz.md)       | Storing UTC, rendering locally               |
| [Audit log timestamps](audit-log.md)               | Append-only tamper-evident log rows           |
| [Business hours scheduling](business-hours.md)     | Compute "next business day at 09:00 local"    |
| [i18n formatting](i18n.md)                         | Locale-aware date/time rendering              |

All recipes assume `import atemporal from 'atemporal'` and use the
8 official plugins where applicable.
