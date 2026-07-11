# 005 — Project Structure & Module Boundaries

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the physical project structure and logical module boundaries for Marketplace Research Lab Version 0.1.

The purpose of this structure is to:

- Keep responsibilities clearly separated.
- Minimize coupling between modules.
- Maximize maintainability.
- Optimize the project for AI-assisted development.
- Allow each module to be implemented independently.

This document defines module ownership only.

It does **not** define implementation details.

---

# 2. Project Organization Principles

The project follows these organizational rules.

## Rule 1 — Business Before Technology

The project is organized around business responsibilities rather than frameworks.

Correct:

```text
Research

Marketplace

AI

Reports

Storage
```

Incorrect:

```text
Controllers

Utils

Helpers

Services

Common
```

---

## Rule 2 — Single Responsibility

Each module owns one responsibility.

If a module requires multiple unrelated reasons to change, it should be split.

---

## Rule 3 — Clear Ownership

Every file belongs to one module.

Every module owns one business capability.

No shared ownership.

---

## Rule 4 — No Circular Dependencies

Modules may depend only on lower-level modules.

Circular dependencies are prohibited.

---

## Rule 5 — Stable Interfaces

Modules communicate through explicit public interfaces.

Internal implementation must remain private.

---

# 3. High-Level Project Structure

```text
Marketplace Research Lab
│
├── Application
│
├── Research Engine
│
├── Marketplace
│
├── AI
│
├── Storage
│
├── Reports
│
├── Shared
│
└── UI
```

These are the only top-level business modules for Version 0.1.

---

# 4. Module Responsibilities

## 4.1 UI Module

### Responsibility

Provides the desktop user interface.

### Owns

- Application window
- Keyword input
- Progress display
- Report viewer
- User interactions

### Does NOT Own

- Scraping
- AI
- Database
- Business logic

---

## 4.2 Application Module

### Responsibility

Coordinates application workflows.

Acts as the bridge between the UI and the Research Engine.

### Owns

- User commands
- Workflow execution
- Application startup
- Application shutdown
- Session coordination

### Does NOT Own

- Marketplace logic
- AI analysis
- Data extraction

---

## 4.3 Research Engine Module

### Responsibility

Executes the complete research workflow.

The Research Engine is the heart of the application.

### Owns

- Research execution
- Workflow coordination
- Pipeline orchestration
- Progress tracking
- Failure handling

### Does NOT Own

- UI
- Playwright
- AI provider implementation
- SQLite implementation

---

## 4.4 Marketplace Module

### Responsibility

Communicates with Redbubble.

Everything related to Redbubble belongs here.

### Owns

- Search
- Product discovery
- Product extraction
- HTML extraction
- Marketplace normalization

### Does NOT Own

- AI
- Reports
- Database
- UI

---

## 4.5 AI Module

### Responsibility

Generates research intelligence.

### Owns

- Prompt preparation
- AI provider communication
- Response validation
- Structured analysis generation

### Does NOT Own

- Scraping
- HTML parsing
- Database queries
- UI

---

## 4.6 Storage Module

### Responsibility

Handles all local persistence.

### Owns

- SQLite
- Images
- Cache
- Reports
- Local files

### Does NOT Own

- Business logic
- AI
- Marketplace logic

---

## 4.7 Reports Module

### Responsibility

Produces HTML research reports.

### Owns

- HTML generation
- Report templates
- Report assets
- Report export

### Does NOT Own

- AI
- Marketplace
- Database

---

## 4.8 Shared Module

### Responsibility

Contains project-wide shared definitions.

### Owns

- Types
- Interfaces
- Constants
- Validation schemas
- Error definitions

### Does NOT Own

Business logic.

---

# 5. Physical Directory Structure

```text
marketplace-research-lab/

├── src/
│
│   ├── application/
│   │
│   ├── research/
│   │
│   ├── marketplace/
│   │
│   ├── ai/
│   │
│   ├── storage/
│   │
│   ├── reports/
│   │
│   ├── shared/
│   │
│   └── ui/
│
├── storage/
│
├── reports/
│
├── logs/
│
├── cache/
│
└── config/
```

The root directory remains intentionally simple.

---

# 6. Module Dependency Graph

Dependencies flow in one direction only.

```text
UI

↓

Application

↓

Research Engine

↓

Marketplace

↓

Storage
```

The AI module is invoked only by the Research Engine.

```text
Research Engine

↓

AI
```

The Reports module is also invoked only by the Research Engine.

```text
Research Engine

↓

Reports
```

Neither AI nor Reports communicate directly with Marketplace.

---

# 7. Communication Rules

The following communication rules are mandatory.

## UI

May communicate only with:

- Application

---

## Application

May communicate only with:

- Research Engine

---

## Research Engine

May communicate with:

- Marketplace
- AI
- Reports
- Storage

---

## Marketplace

May communicate with:

- Storage (for caching or persistence if orchestrated by the Research Engine)

Must not communicate with:

- UI
- AI
- Reports

---

## AI

May communicate only with:

- External AI providers

Must not communicate with:

- Marketplace
- UI

---

## Reports

Consumes structured domain data only.

Never accesses Redbubble.

Never accesses Playwright.

---

## Storage

Never performs business logic.

Only persists and retrieves data.

---

# 8. Module Independence

Every module must satisfy the following requirements.

- Can be implemented independently.
- Can be unit tested independently.
- Can be mocked by other modules.
- Has documented public interfaces.
- Does not expose internal implementation details.

---

# 9. Public vs Private Boundaries

Each module exposes only its public API.

Everything else is private.

Example:

```text
Marketplace

Public

    Search Products

    Get Product Details

Private

    Playwright

    Selectors

    HTML parsing

    Retry logic
```

No module should depend on another module's private implementation.

---

# 10. Cross-Module Data Flow

All business data moves through structured domain entities.

Example:

```text
Keyword

↓

Research Engine

↓

Marketplace

↓

Product

↓

AI

↓

Analysis

↓

Reports

↓

HTML Report
```

Modules never exchange raw HTML, Playwright objects, or database connections.

Only validated domain objects are exchanged.

---

# 11. Forbidden Dependencies

The following dependencies are prohibited.

- UI → Playwright
- UI → SQLite
- UI → AI Provider
- Reports → Playwright
- Reports → Redbubble
- AI → HTML
- AI → Playwright
- Marketplace → UI
- Marketplace → Reports
- Storage → Business Logic

These rules protect architectural boundaries and reduce coupling.

---

# 12. Module Lifecycle

During a research session, modules are invoked in the following order:

```text
UI

↓

Application

↓

Research Engine

↓

Marketplace

↓

Storage

↓

AI

↓

Reports

↓

Storage
```

Each module completes its responsibility before passing control back to the Research Engine.

---

# 13. AI Development Boundaries

Because the project is intended to be built largely with AI coding agents, every module must be self-contained.

Each module specification should include:

- Responsibilities
- Public interfaces
- Inputs
- Outputs
- Dependencies
- Error conditions
- Testing scope

This allows individual modules to be implemented with minimal project-wide context.

---

# 14. Definition of Module Completion

A module is considered complete when:

- It performs only its assigned responsibility.
- All public interfaces are implemented.
- Internal implementation details remain private.
- It satisfies its documented contracts.
- It passes its own unit tests.
- It integrates with the Research Engine without requiring modifications to unrelated modules.

When every module satisfies these conditions, the overall system remains modular, maintainable, and aligned with the architecture defined in previous documents.
