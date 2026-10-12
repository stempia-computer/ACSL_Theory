# ACSL Theory

A Next.js web app for Stempia Computer Institute, using TypeScript, Tailwind CSS, and the App Router.

## Development

Use Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 to view the home page. Edit `src/app/page.tsx` to update it.

## Validation and production

```sh
npm run lint
npx tsc --noEmit
npm run build
npm start
```

The app requires no environment variables or external services.

## Pages

- `/`: Home
- `/dashboard`: Teacher Dashboard
- `/dashboard/student`: Student Dashboard (sample student: Alex Kim)
- `/assignments`: Assignments
- `/question-bank`: Question Bank with expandable answers
- `/students`: Students
- `/scores`: Scores

All records are static mock data in `src/lib/mock-data.ts`. The teacher and student views are UI demonstrations, with no access restrictions or persistence.
