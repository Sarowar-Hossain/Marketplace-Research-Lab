Here is the complete rewritten **`005 — Project Structure & Module Boundaries.md`**.

I preserved your original structure and only added the required Electron infrastructure clarification.

````md
# 005 — Project Structure & Module Boundaries

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.1

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

---

## Rule 1 — Business Before Technology

The project is organized around business responsibilities rather than frameworks.

Correct:

```text
Research

Marketplace

AI

Reports

Storage
````

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

Every file belongs to one module or infrastructure area.

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
├── Application Infrastructure
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

These are the only top-level business modules and infrastructure areas for Version 0.1.

---

# 4. Module Responsibilities

## 4.1 UI Module

### Responsibility

Provides the desktop user interface.

### Owns

* Application window interface
* Keyword input
* Progress display
* Report viewer
* User interactions

### Does NOT Own

* Scraping
* AI
* Database
* Business logic

---

## 4.2 Application Module

### Responsibility

Coordinates application workflows.

Acts as the bridge between the UI and the Research Engine.

### Owns

* User commands
* Workflow execution
* Application startup coordination
* Application shutdown coordination
* Session coordination

### Does NOT Own

* Marketplace logic
* AI analysis
* Data extraction

---

## 4.3 Research Engine Module

### Responsibility

Executes the complete research workflow.

The Research Engine is the heart of the application.

### Owns

* Research execution
* Workflow coordination
* Pipeline orchestration
* Progress tracking
* Failure handling

### Does NOT Own

* UI
* Playwright
* AI provider implementation
* SQLite implementation

---

## 4.4 Marketplace Module

### Responsibility

Communicates with Redbubble.

Everything related to Redbubble belongs here.

### Owns

* Search
* Product discovery
* Product extraction
* HTML extraction
* Marketplace normalization

### Does NOT Own

* AI
* Reports
* Database
* UI

---

## 4.5 AI Module

### Responsibility

Generates research intelligence.

### Owns

* Prompt preparation
* AI provider communication
* Response validation
* Structured analysis generation

### Does NOT Own

* Scraping
* HTML parsing
* Database queries
* UI

---

## 4.6 Storage Module

### Responsibility

Handles all local persistence.

### Owns

* SQLite
* Images
* Cache
* Reports
* Local files

### Does NOT Own

* Business logic
* AI
* Marketplace logic

---

## 4.7 Reports Module

### Responsibility

Produces HTML research reports.

### Owns

* HTML generation
* Report templates
* Report assets
* Report export

### Does NOT Own

* AI
* Marketplace
* Database

---

## 4.8 Shared Module

### Responsibility

Contains project-wide shared definitions.

### Owns

* Types
* Interfaces
* Constants
* Validation schemas
* Error definitions

### Does NOT Own

Business logic.

---

# 5. Application Infrastructure

The application requires runtime infrastructure files that are not part of business modules.

These files support the desktop runtime.

They do not contain business logic.

---

## 5.1 Infrastructure Ownership

The infrastructure layer owns:

* Electron main process
* Electron preload process
* Desktop application lifecycle initialization

---

## 5.2 Physical Location

Infrastructure files are stored separately from business modules.

```text
marketplace-research-lab/

├── electron/
│
│   ├── main.ts
│   │
│   └── preload.ts
```

---

## 5.3 Electron Main Process

### Responsibility

The Electron main process manages the desktop runtime.

### Owns

* Browser window creation
* Electron application lifecycle
* Desktop runtime initialization

### Does NOT Own

* Marketplace logic
* AI processing
* Database operations
* Report generation
* Research workflow

Business operations must continue through the documented module boundaries.

---

## 5.4 Electron Preload Process

### Responsibility

Provides a secure bridge between Electron runtime and the UI layer.

### Owns

* Renderer communication bridge

### Does NOT Own

* Business logic
* Marketplace communication
* AI communication
* Database operations

---

## 5.5 Infrastructure Dependency Rules

Application infrastructure may communicate with:

* UI runtime

Application infrastructure must not directly implement:

* Research workflows
* Marketplace operations
* AI processing
* Storage operations
* Report generation

---

## 5.6 Infrastructure vs Business Modules

The `electron/` directory is not considered a business module.

The documented business modules remain:

```text
application

research

marketplace

ai

storage

reports

shared

ui
```

The infrastructure directory exists only for desktop runtime files.

---

# 6. Physical Directory Structure

```text
marketplace-research-lab/

├── electron/
│
│   ├── main.ts
│   │
│   └── preload.ts
│
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

# 7. Module Dependency Graph

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

# 8. Communication Rules

The following communication rules are mandatory.

---

## UI

May communicate only with:

* Application

---

## Application

May communicate only with:

* Research Engine

---

## Research Engine

May communicate with:

* Marketplace
* AI
* Reports
* Storage

---

## Marketplace

May communicate with:

* Storage (only when orchestrated by the Research Engine)

Must not communicate with:

* UI
* AI
* Reports

---

## AI

May communicate only with:

* External AI providers

Must not communicate with:

* Marketplace
* UI

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

# 9. Module Independence

Every module must satisfy the following requirements.

* Can be implemented independently.
* Can be unit tested independently.
* Can be mocked by other modules.
* Has documented public interfaces.
* Does not expose internal implementation details.

---

# 10. Public vs Private Boundaries

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

# 11. Cross-Module Data Flow

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

# 12. Forbidden Dependencies

The following dependencies are prohibited.

* UI → Playwright
* UI → SQLite
* UI → AI Provider
* Reports → Playwright
* Reports → Redbubble
* AI → HTML
* AI → Playwright
* Marketplace → UI
* Marketplace → Reports
* Storage → Business Logic
* Electron Infrastructure → Business Logic

These rules protect architectural boundaries and reduce coupling.

---

# 13. Module Lifecycle

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

# 14. AI Development Boundaries

Because the project is intended to be built largely with AI coding agents, every module must be self-contained.

Each module specification should include:

* Responsibilities
* Public interfaces
* Inputs
* Outputs
* Dependencies
* Error conditions
* Testing scope

This allows individual modules to be implemented with minimal project-wide context.

---

# 15. Definition of Module Completion

A module is considered complete when:

* It performs only its assigned responsibility.
* All public interfaces are implemented.
* Internal implementation details remain private.
* It satisfies its documented contracts.
* It passes its own unit tests.
* It integrates with the Research Engine without requiring modifications to unrelated modules.

When every module satisfies these conditions, the overall system remains modular, maintainable, and aligned with the architecture defined in previous documents.


