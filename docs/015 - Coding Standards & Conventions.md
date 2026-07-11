---

# 015 — Coding Standards & Conventions

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the coding standards and conventions for Marketplace Research Lab Version 0.1.

The purpose of these standards is to ensure that the entire codebase remains:

- Consistent
- Readable
- Maintainable
- Predictable
- AI-friendly

Every source file in the project should follow these conventions.

---

# 2. General Principles

The codebase follows these principles.

## Principle 1

Readability is more important than cleverness.

---

## Principle 2

Prefer explicit code over implicit behavior.

---

## Principle 3

Keep functions small and focused.

---

## Principle 4

One file should have one primary responsibility.

---

## Principle 5

Avoid duplicate logic.

---

## Principle 6

Write code that is easy for both humans and AI coding agents to understand.

---

# 3. Programming Language

All application code must be written in **TypeScript**.

Do not introduce JavaScript files into the application source.

---

# 4. Naming Conventions

## Variables

Use **camelCase**.

Example:

```text
productTitle
researchSession
productTags
```

---

## Functions

Use **camelCase**.

Function names should describe an action.

Examples:

```text
searchProducts()

extractProduct()

saveResearchSession()

generateReport()
```

---

## Classes

Use **PascalCase**.

Examples:

```text
ResearchEngine

MarketplaceAdapter

ReportGenerator
```

---

## Interfaces

Use **PascalCase**.

Examples:

```text
ResearchSession

Product

AIProvider
```

---

## Types

Use **PascalCase**.

Examples:

```text
ProductTag

ProductImage

ResearchStatus
```

---

## Constants

Use **UPPER_SNAKE_CASE**.

Examples:

```text
DEFAULT_TIMEOUT

MAX_PRODUCTS
```

---

## Files

Use **kebab-case**.

Examples:

```text
research-engine.ts

marketplace-adapter.ts

report-generator.ts
```

---

## Directories

Use **kebab-case**.

Examples:

```text
research/

marketplace/

storage/
```

---

# 5. Function Design

Every function should have one clearly defined responsibility.

Functions should:

- Accept explicit inputs.
- Return explicit outputs.
- Avoid hidden side effects.

---

## Function Size

Functions should remain small.

If a function begins solving multiple unrelated problems, it should be divided into smaller functions.

---

## Function Names

Names should describe behavior.

Good examples:

```text
validateKeyword()

loadConfiguration()

generateHtmlReport()
```

Avoid vague names.

Examples:

```text
process()

handle()

execute()
```

unless the surrounding context makes the purpose unambiguous.

---

# 6. Module Boundaries

Each module should expose only its public interface.

Internal helper functions should remain private to the module.

Modules should communicate only through documented public interfaces.

---

# 7. Error Handling

Errors should be handled explicitly.

Do not silently ignore exceptions.

Every recoverable error should:

- Be handled.
- Be logged.
- Preserve application consistency.

---

# 8. Type Safety

TypeScript type checking should remain enabled throughout the project.

Avoid using:

```text
any
```

unless absolutely unavoidable.

Prefer explicit types wherever possible.

---

# 9. Validation

External input should be validated before entering the domain model.

Examples include:

- User keyword
- Configuration
- AI responses

Validation failures should be handled before further processing.

---

# 10. Imports

Import only what is required.

Avoid wildcard imports.

Group imports in the following order:

1. External packages
2. Internal modules
3. Local files

Maintain a consistent import order throughout the project.

---

# 11. Code Organization

Each source file should contain one primary responsibility.

Examples:

```text
marketplace-search.ts
```

Responsible only for marketplace searching.

---

```text
product-extractor.ts
```

Responsible only for extracting product information.

Avoid combining unrelated responsibilities into a single file.

---

# 12. Comments

Comments should explain **why**, not **what**.

Avoid comments that simply repeat the code.

Good example:

```text
Retry is limited to prevent repeated requests when the marketplace is unavailable.
```

Poor example:

```text
Increment counter.
```

---

# 13. Constants

Magic values should not appear directly in business logic.

Meaningful constants should be defined once and reused.

Example:

```text
MAX_PRODUCTS

DEFAULT_NAVIGATION_TIMEOUT
```

---

# 14. Business Logic

Business rules belong inside the appropriate business module.

Do not place business logic inside:

- UI components
- Database layer
- Report templates

The Research Engine coordinates business workflows.

---

# 15. UI Code

UI components should focus only on presentation and user interaction.

They should not contain:

- Marketplace logic
- AI logic
- Database operations

Business operations should be delegated to the Application and Research Engine modules.

---

# 16. Database Code

Database code should only perform persistence operations.

It should not contain:

- Marketplace extraction
- AI processing
- HTML generation
- Business workflow decisions

---

# 17. AI Code

The AI module should only:

- Build prompts
- Communicate with the AI provider
- Validate responses

It should not:

- Scrape marketplaces
- Parse HTML
- Manage application state

---

# 18. Marketplace Code

The Marketplace module should only:

- Search Redbubble
- Navigate product pages
- Extract structured data
- Normalize extracted information

It should not:

- Generate reports
- Call AI providers
- Perform database business logic

---

# 19. Formatting

Formatting should remain consistent throughout the project.

Use a single automated formatter for all source files.

Do not manually format code differently between files.

Consistency is more important than individual preference.

---

# 20. File Length

Files should remain focused.

When a file begins handling multiple responsibilities, it should be divided into smaller files based on responsibility rather than arbitrary line count.

---

# 21. Public Interfaces

Every public module interface should clearly define:

- Input
- Output
- Expected behavior
- Possible errors

Interfaces should remain stable and predictable.

---

# 22. Code Reuse

Duplicate code should be avoided.

If the same logic appears in multiple places, it should be extracted into a shared implementation within the appropriate module.

Reuse should not violate module boundaries.

---

# 23. Completion Criteria

The codebase satisfies these standards when:

- Naming conventions are applied consistently.
- Module boundaries remain intact.
- Functions have single responsibilities.
- Type safety is maintained.
- External input is validated.
- Errors are handled explicitly.
- Business logic remains inside the appropriate modules.
- The code is readable, predictable, and easy to understand.

Following these standards ensures that Marketplace Research Lab Version 0.1 remains maintainable, consistent, and well-suited for AI-assisted development while staying aligned with the architecture and implementation defined in the preceding technical design documents.
