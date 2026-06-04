# React Server Components

Next.js App Router renders React Server Components (RSC) on the server.
Date formatting on the server is the only correct way to avoid
timezone mismatch between the client and the server.

## Why server-side formatting?

If you format a date on the client, the user's local timezone is
used. If you fetch the same row on the server, the server's
timezone is used. The two can disagree, leading to:

- Hydration mismatches in React 18+.
- Different timestamps shown in the same user session.
- Surprise DST shifts.

The fix: always format on the server with an explicit timezone.

## A small RSC `<Time>` component

```tsx
// app/components/Time.tsx
import atemporal from 'atemporal';

type Props = {
  iso: string;
  tz?: string;
  format?: string;
};

export function Time({ iso, tz = 'UTC', format = 'YYYY-MM-DD HH:mm' }: Props) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {atemporal(iso, tz).format(format)}
    </time>
  );
}
```

Use it from a Server Component:

```tsx
// app/posts/[id]/page.tsx
import { Time } from '@/components/Time';
import { db } from '@/lib/db';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: Number(params.id) } });
  if (!post) return null;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Published <Time iso={post.publishedAt} tz={post.authorTimezone} /></p>
      {post.body}
    </article>
  );
}
```

## Avoiding hydration warnings

Even with the pattern above, React will warn if the user's locale
shifts the rendered string (e.g. `12:00 PM` vs `12:00`). Two
defenses:

1. **`suppressHydrationWarning`** on the wrapping element. This tells
   React "I know the children may differ, trust me."
2. **Use a fixed format** (e.g. always `YYYY-MM-DD HH:mm` regardless
   of user locale). If you need locale-aware formatting, do it in
   a Client Component *after* mount.

## Server Actions

```ts
// app/actions.ts
'use server';
import atemporal from 'atemporal';
import { revalidatePath } from 'next/cache';

export async function publishPost(formData: FormData) {
  const title = String(formData.get('title'));
  const r = atemporal.validate(formData.get('publishedAt'));
  if (!r.ok) {
    // Surface the error back to the form. The `code` lets the
    // form renderer pick a localized message.
    return { ok: false, code: r.code };
  }

  await db.post.create({
    data: { title, publishedAt: r.iso! },
  });

  revalidatePath('/');
  return { ok: true };
}
```

## Streaming with Suspense

If a date is expensive to compute (e.g. "5 minutes ago"), wrap it in
`<Suspense>` so the rest of the page can stream in first:

```tsx
import { Suspense } from 'react';
import atemporal from 'atemporal';

async function RelativeTime({ iso }: { iso: string }) {
  // Pretend this is slow.
  const wrapped = atemporal(iso);
  return <time>{wrapped.fromNow()}</time>;
}

export default function Post({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <Suspense fallback={<span>…</span>}>
        <RelativeTime iso={post.publishedAt} />
      </Suspense>
    </article>
  );
}
```

## See also

- [i18n formatting](i18n.md)
- [Prisma](prisma.md) or [Drizzle](drizzle.md)
- [Audit log timestamps](audit-log.md)
