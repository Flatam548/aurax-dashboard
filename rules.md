• You are building a Next.js app (App Router) for tracking and analyzing Meta Ads offers.
• The stack: TypeScript, Next.js, React, Shadcn UI, Radix UI, Tailwind CSS, Supabase (or MongoDB) for storage.

◦ Code Style and Structure
  • Write concise, technical TypeScript code with real-world offer tracking examples.
  • Use functional and declarative programming; avoid classes.
  • Modularize: separate components, helpers, hooks, static configs, and types.
  • Prefer composition over inheritance; avoid code duplication.
  • Use descriptive variable names with auxiliary verbs (e.g., isFetchingOffers, hasHistoryData).
  • Structure directories in lowercase with dashes (e.g., components/offer-table).

◦ Naming Conventions
  • Use lowercase with dashes for folders (e.g., api/scraper, components/process-selector).
  • Favor named exports for all components and helpers.

◦ TypeScript Usage
  • Use TypeScript throughout the codebase.
  • Prefer interfaces over types for object shapes.
  • Avoid enums; replace with constant maps (e.g., PROCESS_STATUS).
  • Always type props and hook return values.

◦ Syntax and Formatting
  • Use the `function` keyword for pure functions.
  • Simplify conditionals; avoid unnecessary curly braces for single statements.
  • Write declarative, semantic JSX (e.g., <OfferTable />, <ObservationInput />).
  • Group related helper functions near their usage when possible.

◦ UI and Styling
  • Build all UI with Shadcn UI and Radix primitives, styled with Tailwind.
  • Apply responsive design (mobile-first) using Tailwind breakpoints.
  • Maintain visual consistency: color coding for process status, highlights for peaks.
  • Use Tailwind utilities to handle spacing, typography, and state.

◦ Performance Optimization
  • Prefer React Server Components (RSC); limit 'use client' to interactive parts:
    • ProcessSelector, ObservationInput, AddForm.
  • Use Suspense with fallback for client components.
  • Dynamically import non-critical pages and heavy graphs (e.g., recharts).
  • Optimize images: WebP, define sizes, enable lazy loading.
  • Minimize client-side state; favor server-side data fetching via Next.js.

◦ Application-Specific Conventions
  • Each offer stores: name, linkBiblioteca, ticket, startDate, miningDate, process, observation.
  • Track daily active ad counts, keep historical data to calculate 15-day peaks.
  • Provide CRUD API routes: /api/ofertas, /api/historico, /api/scraper.
  • Build dashboard with cards and graphs showing:
    • Total ads, peaks, recent evolution.
    • Top 5 active offers.
  • Offer detail page (`/ofertas/[id]`): graph, stats, editable process & observation.
  • Support filters in history page: date range, offer.

◦ Key Conventions
  • Use `nuqs` for URL search param state in filters (history, list).
  • Optimize for Web Vitals: fast LCP, low CLS, small JS bundles.
  • Avoid using 'useEffect' for data fetching; rely on Next.js server components and SSR.
  • Implement automated scraping daily (e.g., server cron or API call).

◦ Follow Next.js best practices:
  • Data Fetching: prefer server functions in `app/`.
  • Rendering: use server components as default.
  • Routing: organize nested routes for clean UX (/ofertas, /ofertas/[id], /dashboard, /add, /historico).

