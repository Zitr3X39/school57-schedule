# school57-schedule

Premium расписание для МАОУ СОШ №57 (Калининград). Next.js 16 (App Router) + TypeScript + Tailwind 4 + Framer Motion + TanStack Query + Zustand.

## 🌐 Открыть сайт

**Live (GitHub Pages):** [https://zitr3x39.github.io/school57-schedule/](https://zitr3x39.github.io/school57-schedule/)

Открывается прямо с GitHub-ссылки, на любом устройстве (десктоп, телефон, планшет). Авто-обновляется при каждом пуше в `main`.

## Локальный запуск

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

`pnpm dev` сам перегенерирует JSON-данные из фикстур перед стартом (`predev`). Открывается на http://localhost:3000.

## Архитектура данных

Сайт работает в **статическом режиме**: при сборке скрипт `scripts/build-data.ts` парсит HTML-фикстуры из `/fixtures/`, нормализует уроки в единую схему и пишет JSON в `/public/data/`:

- `public/data/index.json` — список 125 классов с группировкой по параллелям
- `public/data/schedule/<класс>.json` — расписание на неделю для каждого класса

Клиент дёргает эти JSON напрямую через `fetch`, без серверного API. Поэтому деплой на любую CDN/статик-хостинг (GitHub Pages, Vercel, Netlify, любой nginx) — без серверного рантайма.

## Источник данных

Реальный URL школы: `https://keo.gov39.ru/data/schedule/klgd1548141601`. Сайт гео-блочит зарубежные IP, поэтому в репозитории лежат HTML-фикстуры (4А, 10Д, 11Д + страница со списком всех 125 классов), снятые из браузера на территории РФ.

При сборке для GitHub Pages используются эти же фикстуры. Чтобы обновить данные:

1. Открой страницу класса на keo.gov39.ru
2. `Ctrl+U` → сохрани исходник
3. Положи в `/fixtures/` под именем `class-<имя>.html`
4. Допиши маппинг в `scripts/build-data.ts` или в `pickFixtureForClass()`
5. `git push` → GitHub Actions пересоберёт и задеплоит автоматически

## Деплой на GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` собирает сайт и публикует на GitHub Pages при каждом пуше в `main`. Один раз нужно включить Pages в настройках репо:

**Settings → Pages → Source → выбрать «GitHub Actions»**

После этого URL сайта появится в Settings → Pages, и он же будет опубликован в логах workflow.

Если нужно собрать локально:

```bash
pnpm build:pages   # → ./out/  (статический экспорт с basePath /school57-schedule)
```

## Парсер

- **`src/lib/schedule/parser/index-page.ts`** — главная страница → 125 классов с разбивкой по параллелям
- **`src/lib/schedule/parser/class-page.ts`** — страница класса → дни недели + таблицы уроков с детектом «групп 1/2» (две идущие подряд строки одного номера = разделение по группам)
- **`src/lib/schedule/normalizer.ts`** — унифицированная схема `Lesson` с группами 1/2, заменами, кабинетами; стабильные ID
- **`src/lib/schedule/validator.ts`** — формат-чеки, дедуп, `ParseReport`

## Smoke-тест

```bash
pnpm tsx scripts/test-parser.ts
```
