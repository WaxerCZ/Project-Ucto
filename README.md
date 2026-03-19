# CountingSAAS — Výuka podvojného účetnictví

SaaS webová aplikace pro výuku a procvičování podvojného účetnictví pomocí T-účtů (MD / Dal).

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**, **Tailwind CSS 4**
- **Prisma 7** (PostgreSQL, driver adapter)
- **NextAuth v5** (JWT, Credentials provider)
- **Zod 4** (validace)

## Požadavky

- Node.js 20+
- PostgreSQL 15+ (lokálně nebo Docker)

## Instalace

```bash
npm install
```

### Databáze

1. Vytvořte PostgreSQL databázi `counting_saas`
2. Upravte `.env` — nastavte `DATABASE_URL` na vaše připojení
3. Pushnete schéma a seedujte:

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

Nebo jedním příkazem:
```bash
npm run db:setup
```

### Spuštění

```bash
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000).

## Demo účty

| Role    | Email              | Heslo       |
|---------|--------------------|-------------|
| Učitel  | ucitel@skola.cz    | teacher123  |
| Student | student@skola.cz   | student123  |

## Funkce

- **Pracovní prostory** — vlastní sandbox s T-účty pro studenty
- **T-účty** — vizuální zobrazení MD/Dal stran s automatickým počítáním zůstatků
- **Transakce** — podvojné účtování s validací (MD = Dal)
- **Cvičení** — učitelé vytváří úlohy, studenti řeší a odevzdávají
- **Automatické hodnocení** — systém porovnává odevzdání s očekávaným řešením
- **České účetní osnovy** — 64 přednastavených účtů dle české účetní osnovy
- **Dvojjazyčné UI** — čeština (primární) a angličtina
