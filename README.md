# Lò Ovenfloor

Portfolio demonstration for a fictional HCMC bakery kitchen (batch planning and floor agent). **Not** a live production system.

## Disclaimer

Portfolio demo for an anonymous bakery / F&B operations programme — not a live production system. Data is fictional for a demo kitchen in Ho Chi Minh City.

> Bản minh hoạ portfolio cho chương trình bánh và F&B giả lập — không phải hệ thống sản xuất thật. Dữ liệu là giả lập cho bếp demo tại TP.HCM.

## Stack

- Next.js App Router, TypeScript, Tailwind
- Prisma + Postgres (Neon)
- Vercel AI SDK (`generateObject` + Zod) — see `src/lib/ai/client.ts`

## Local

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

## Production URL

See `DEMO_URL.txt` (Vercel alias).

## Tests

```bash
npm test
npm run typecheck
npm run build
```

See `SPEC.md` for acceptance criteria.
