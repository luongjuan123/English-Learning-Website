# English Learning Platform (A1 to B2)

A self-hosted English learning web application for one student to study from CEFR level A1 to B2. Runs entirely on your local machine. No cloud services are required.

---

## What This Platform Includes

- Dashboard with CEFR level, progress, streak, and recent activity
- Structured curriculum organized by A1, A2, B1, and B2 levels
- Lesson viewer with vocabulary extraction and pronunciation
- AI-powered lesson generator (optional, falls back to deterministic content without an API key)
- Vocabulary bank with spaced repetition flashcards (SM-2 algorithm)
- Vocabulary tests with multiple question types
- Custom Vocabulary Test: paste any word list, configure the test, and start practicing
- Custom Vocabulary Builder: paste words and get AI-enriched vocabulary cards with definitions, IPA, examples, and Vietnamese translations
- Diagnostic placement test to determine starting CEFR level
- Reading and writing practice with AI grading rubric
- Progress analytics: accuracy by topic, vocabulary mastered, weekly activity heatmap
- Admin panel for content management

---

## Technology Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (local database, no setup required)
- Vitest (unit testing)

The database is a single SQLite file stored at `prisma/dev.db`. Everything is local.

---

## Local Setup

### Requirements

- Node.js 18 or higher
- npm

### Steps

1. Clone this repository:

```
git clone <your-repository-url>
cd "English Learning"
```

2. Install dependencies:

```
npm install
```

3. Set up the database:

```
npx prisma generate
npx prisma db push
```

4. Seed the curriculum data:

```
npm run db:seed
```

5. Start the development server:

```
npm run dev
```

6. Open your browser at `http://localhost:3000`.

---

## AI Features (Optional)

AI features work without any API key. The platform uses deterministic fallback generators for all AI-powered content including lesson generation, vocabulary enrichment, and word definitions.

To enable real AI responses, add your API key to a `.env` file:

```
GEMINI_API_KEY=your_key_here
```

Or for OpenAI:

```
OPENAI_API_KEY=your_key_here
```

Restart the server after editing `.env`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run unit tests |
| `npm run db:seed` | Seed curriculum data into the database |
| `npx prisma studio` | Open Prisma Studio to browse the database |

---

## Project Structure

```
src/
  app/              Next.js App Router pages and API routes
    api/            Backend API routes
    learn/          Lesson pages
    vocabulary/     Vocabulary, flashcards, tests, custom tools
    tests/          Practice test runner
    practice/       Reading and writing practice
    progress/       Progress analytics
    admin/          Content management
  components/       Shared UI components
  lib/              Core logic
    sm2.ts          Spaced repetition (SM-2) algorithm
    grading.ts      Test grading engine
    custom-test/    Custom vocabulary test generator
    ai/             AI client, prompts, and schemas
prisma/
  schema.prisma     Database schema
  dev.db            SQLite database (created after setup)
```

---

## Running on a Different Port

```
npm run dev -- -p 3005
```

or for production:

```
npm run start -- -p 3005
```

---

## Notes

- All data is stored locally in `prisma/dev.db`. Back up this file to preserve your progress.
- The platform is designed for a single student. There is no login or multi-user support.
- Vietnamese translations are included throughout to support Vietnamese-speaking learners.
