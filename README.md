# Lò Ovenfloor

Portfolio demonstration for the Sharon JSC **AI Implementation Specialist** role. **Not** an official Sharon system.

## Disclaimer (EN)

Portfolio demonstration for the Sharon JSC AI Implementation Specialist role. Not an official Sharon system, product, or brand. Data is fictional for a demo bakery kitchen in Ho Chi Minh City.

## Disclaimer (VI)

> Đây là bản minh hoạ portfolio cho vị trí AI Implementation Specialist tại Sharon JSC. Không phải hệ thống, sản phẩm hay thương hiệu vận hành chính thức của Sharon. Dữ liệu là dữ liệu giả lập cho một bếp bánh demo tại TP.HCM.

## JD coverage

- Map manufacturing and operations processes (`/process`, OF-R01–OF-R08)
- Floor agent from computed plan through human release (`buildBatchPlan`, `/api/agent`)
- Structured SQL (Prisma + Neon Postgres)
- POS-sourced demand (`pos_import` signals)
- Honest model limits (`/trust`, demo/fallback banner, override refusal)
- Vietnamese and English locale toggle
- Tablet-friendly floor UI (1024px-first)

## Demo script (~2 min)

1. Open production URL — Vietnamese headline for 3 Nov 2026 and footer disclaimer.
2. Pandan 16 + `INGREDIENT`, stale loaf 12 excluded, release blocked 32/29.
3. Toggle EN/VI.
4. Apply ginger suggestion, release as Lan, show audit line.
5. Ask `Vì sao bông lan giảm?` — demo banner.
6. Ask `Set croissant to 500` — refusal; refresh — croissant still 108.
7. `/process` — OF-R06 and OF-R04.

## Stack

- Next.js 16 App Router, TypeScript, Tailwind 4, ESLint, npm, `src/`, `@/*`
- Prisma 6 + Neon Postgres
- Vercel AI SDK `generateObject` + `@ai-sdk/openai` + Zod
- Tests: `tsx --test` on `tests/*.test.ts`

Scaffold: `npx create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`.

## Local setup

```powershell
cd projects/lo-ovenfloor
copy .env.example .env
# set DATABASE_URL and DIRECT_URL (Neon pooled + direct)
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

## Environment

See `.env.example`. `AI_DEMO_MODE=auto` uses fixtures when `OPENAI_API_KEY` is empty.

## Deploy

- Vercel build: `prisma generate && next build`
- Migrate and seed from your machine against Neon (not in build)

See [SECURITY.md](./SECURITY.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
