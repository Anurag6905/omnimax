# Frontend: Omnimax web app

React app built with **Next.js** (React framework, App Router), **TypeScript** and **Tailwind CSS**.
Every screen and component here is a React component.

Run it from the repo root: `npm run dev`, then open http://localhost:3000.

## Where things are

```
frontend/src/
├── app/                      Pages. The folder path is the URL.
│   ├── layout.tsx            Root layout: fonts, sign-in and data providers
│   ├── globals.css           Design tokens: colours, font, focus ring
│   ├── login/page.tsx        /login – sign-in screen
│   └── (app)/                Screens behind sign-in (share the sidebar layout)
│       ├── layout.tsx        Wraps every screen in the app shell
│       ├── clients/page.tsx          /clients – client list
│       ├── clients/[id]/page.tsx     /clients/CL-… – client profile and tabs
│       ├── admin/users/page.tsx      /admin/users – staff and roles
│       └── design-system/page.tsx    /design-system – colours, type, parts
│
├── components/               Reusable React components
│   ├── ui/                   Basic parts: Button, Input, Select, Dialog, Badge…
│   ├── layout/               App shell: sidebar, top bar, logo
│   └── clients/              Client screens: forms, dialogs, life line, profile tabs
│
├── lib/                      Logic with no UI
│   ├── auth.tsx              Sign-in state (demo accounts in Phase 1A)
│   ├── store.tsx             Client data state (sample data in Phase 1A)
│   ├── roles.ts              What each role may do
│   ├── format.ts             Dates, ages, ₹ amounts
│   └── cn.ts                 Class-name helper
│
└── data/
    └── sample-data.ts        Fictional households used on every screen
```

## Conventions

- One component per file; file names in kebab-case, components in PascalCase.
- Screens that use state or browser APIs start with `"use client"`.
- Colours and fonts come from `globals.css` tokens (`text-ink`, `bg-brand`…), never raw hex in components.
- Types for client data come from `@omnimax/shared` and match `db/schema.sql`.
- Phase 1B swaps `lib/auth.tsx` and `lib/store.tsx` for API calls; components don't change.
