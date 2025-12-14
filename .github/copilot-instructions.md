# GitHub Copilot Instructions for Fin-Kompas

## Project Context

**Fin-Kompas** is a Next.js 16 application serving as a suite of financial tools. It uses a "monorepo-style" structure within the `app/` directory, where each subdirectory (e.g., `btw-dashboard-pro`, `budget-shifter`) represents a distinct, self-contained module or "mini-app".

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (configured via `@tailwindcss/postcss`)
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Icons:** `lucide-react`
- **Data Processing:** Client-side parsing (`papaparse`, `xlsx`)
- **PDF/Export:** `jspdf`, `html2canvas`

## Architecture & File Structure

- **Modular Design:** Each tool lives in its own folder under `app/` (e.g., `app/btw-dashboard-pro/`).
- **Module Structure:**
  - `page.tsx`: Main entry point for the tool.
  - `components/`: UI components specific to that tool.
  - `services/`: API calls, AI logic, and external integrations.
  - `utils/` or `utils.ts`: Helper functions and data parsing logic.
  - `types.ts`: TypeScript interfaces and types for the module.
  - `constants.ts`: Configuration constants.
- **Shared Components:** Common UI elements (like `HomeButton.tsx`) reside in `app/components/`.

## Coding Conventions

### React & Next.js

- **Client Components:** Use `'use client'` at the top of files that use hooks (`useState`, `useEffect`) or browser-only APIs.
- **Hooks:** Prefer functional components with hooks.
- **Strict Mode:** The project runs in strict mode; ensure effects are resilient to double-invocation in development.

### Styling (Tailwind CSS v4)

- Use utility classes directly in JSX.
- Support Dark Mode using the `dark:` prefix (e.g., `bg-white dark:bg-gray-900`).
- Use CSS variables defined in `app/globals.css` for consistent theming (`--background`, `--foreground`).

### Data Handling

- **Client-Side Processing:** Prefer processing files (CSV, Excel) in the browser to ensure data privacy and speed.
- **Type Safety:** Define strict interfaces for data models in `types.ts` and use them throughout the module.

### AI Integration (Gemini)

- Use `services/geminiService.ts` (or similar) within modules to encapsulate AI logic.
- **Prompt Engineering:** Construct prompts that summarize data efficiently to save tokens.
- **Error Handling:** Gracefully handle API failures and provide fallback UI.

## Critical Workflows

- **Development:** `npm run dev` (uses Turbopack).
- **Build:** `npm run build`.
- **Linting:** `npm run lint`.

## Example: Adding a New Feature

1.  **Define Types:** Update `types.ts` with new data structures.
2.  **Create Component:** Add the UI in `components/NewFeatureView.tsx`.
3.  **Logic:** Implement business logic in `utils.ts` or `services/`.
4.  **Integration:** Import and use the component in the module's `page.tsx`.
