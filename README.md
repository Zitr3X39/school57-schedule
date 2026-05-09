# school57-schedule

Premium расписание для МАОУ СОШ №57 (Калининград). Next.js 16 (App Router) + TypeScript + Tailwind 4 + Framer Motion + TanStack Query + Zustand. Серверный парсер сайта-источника `keo.gov39.ru/data/schedule/klgd1548141601` через Cheerio с fallback-цепочкой и кэшем.

## Запуск

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## Источник данных

Парсер вызывает реальный URL школы:

`https://keo.gov39.ru/data/schedule/klgd1548141601`
`https://keo.gov39.ru/data/schedule/klgd1548141601/class.php?class=...&school_uid=...&week=YYYYMMDD`

С зарубежного IP сайт может быть недоступен (геоблок). На случай этого реализован fallback на локальные фикстуры из `/fixtures/` (пример страниц 4А, 10Д, 11Д). Принудительно использовать фикстуры:

```bash
SCHEDULE_FIXTURE_MODE=1 pnpm dev
```

## Архитектура

- **`src/lib/schedule/`** — ядро парсера: `fetcher` → `parser/index-page` + `parser/class-page` → `normalizer` → `validator` → `cache` → `service`. Унифицированная схема `Lesson` с группами 1/2, заменами, кабинетами.
- **`src/app/api/`** — `/api/health`, `/api/classes`, `/api/schedule?class=...&week=...`. Server-only, `force-dynamic`.
- **`src/lib/now.ts`** — корректное определение «сейчас» в часовом поясе школы (Europe/Kaliningrad).
- **`src/lib/natural-search.ts`** — поиск на естественном языке: «что сейчас», «где английский», «уроки во вторник», «информатика группа 2».
- **`src/components/`** — premium UI: `Hero`, `Timeline`, `WeekOverview`, `SubjectAnalytics`, `CommandPalette` (Ctrl+K), `ClassPicker`, `BottomNav`.

## Парсер: ключевые моменты

1. Главная страница школы → 125 классов, разнесённых по параллелям.
2. Страница класса → дни недели + таблицы уроков с детектом «групп 1/2» (две идущие подряд строки одного номера = разделение по группам).
3. Раздел замен (`.shedule__calendar-changes`) → отметка `isReplacement=true` на нужных уроках.
4. Звонки по умолчанию (40-минутные уроки) можно переопределить через `bell` в zustand-сторе.

## CLI

Smoke-test парсера:

```bash
pnpm tsx scripts/test-parser.ts
```
