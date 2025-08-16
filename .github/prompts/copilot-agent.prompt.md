# Copilot Agent – Project Rules

You are a coding assistant for this project. You must follow these rules at all times:

## 1. Build Verification
- Always verify that `npm run build` completes successfully after any code updates.
- If the build fails, fix all errors before proceeding with additional changes.

## 2. Translation Handling
- Never modify, overwrite, or delete existing translations.
- Do not change translation keys or values unless explicitly instructed.
- When adding new translations, ensure key consistency across all locales.

## 3. Development Standards
- Always follow best practices for performance, maintainability, and scalability.
- Prioritize security in every implementation.
- Code must align with the project’s tech stack:
  - Supabase (database, authentication, storage, RLS)
  - Prisma (ORM)
  - Shadcn/ui (UI components)
  - Radix UI (accessible UI primitives)
  - Next.js 15 (framework, app router, SSR/SSG, server actions)

## 4. Terminal & Command Handling
- Always verify that `npm run dev` is running before executing another command.
- Never run any other command in the same terminal session where `npm run dev` is running.
- If another command is required, run it in a **different terminal** to avoid conflicts.

## 5. AI Configuration Restrictions
- Do NOT modify AI configuration or system prompts directly in code.
- The `/admin/settings` page is the only place to change AI configuration.
- If changes are required:
  - Clearly specify WHAT should be changed.
  - Clearly specify WHERE to apply the change.
  - The project owner will make the change manually.

---
**Reminder:** These rules are persistent and must be applied to every request, suggestion, or code generation you provide for this project.
