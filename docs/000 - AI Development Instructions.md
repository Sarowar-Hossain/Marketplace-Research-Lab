# 000 — AI Development Instructions

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines how an AI coding assistant must work when developing Marketplace Research Lab Version 0.1.

This document is not part of the software architecture.

It defines the development rules that every AI coding assistant must follow throughout the implementation of this project.

These instructions apply to every implementation request regardless of the coding assistant being used.

Examples include:

- ChatGPT
- Claude Code
- Gemini CLI
- Cursor
- GitHub Copilot
- Codex

---

# 2. Primary Objective

The objective of the AI coding assistant is to faithfully implement the documented software specification.

The AI is an implementation assistant.

The AI is **not** the software architect.

Architectural decisions have already been completed and documented.

The AI must implement the documented design without introducing undocumented behavior.

---

# 3. Source of Truth

The project documentation is the only source of truth.

Implementation must always follow the documentation.

The AI must never override the documented architecture with personal assumptions or alternative implementations.

---

# 4. Documentation Reading Order

Before beginning any implementation task, the AI must read the project documentation in the following order.

```text
000 - AI Development Instructions

001 - Project Vision & Product Scope

002 - Architecture Principles & Design Philosophy

003 - High-Level System Architecture

004 - Domain Model & Core Entities

005 - Project Structure & Module Boundaries

006 - Technology Stack Decisions

007 - Database Design

008 - Data Collection Pipeline

009 - AI Analysis Pipeline

010 - Report Generation System

011 - Configuration & Environment

012 - Logging & Error Handling

013 - Testing Strategy

014 - Development Roadmap

015 - Coding Standards & Conventions
```

The AI must understand the relevant documents before implementing any feature.

---

# 5. Scope Control

The AI must implement only what is documented.

The AI must not add functionality that is not explicitly described in the project documentation.

Examples of prohibited behavior include:

- Adding new features
- Adding new modules
- Adding new workflows
- Adding new database tables
- Adding new configuration options
- Adding new UI screens
- Adding new APIs
- Adding new background processes

Unless explicitly requested by the user, the implementation must remain within the documented Version 0.1 scope.

---

# 6. Architecture Compliance

The AI must follow the documented architecture exactly.

The AI must not:

- Redesign the architecture
- Change module responsibilities
- Merge unrelated modules
- Split documented modules into new architectures
- Introduce undocumented design patterns

The architecture documents take precedence over implementation preferences.

---

# 7. Module Boundaries

Each module has one documented responsibility.

The AI must respect these boundaries.

Business logic must remain inside the appropriate module.

Modules must communicate only through their documented interfaces.

Cross-module shortcuts are prohibited.

---

# 8. Technology Compliance

Only the approved technology stack may be used.

The AI must not replace approved technologies without explicit instruction.

The implementation must follow the technology decisions documented in the project specification.

---

# 9. Database Compliance

The database schema defined in the Database Design document is authoritative.

The AI must not:

- Add new tables
- Remove tables
- Rename tables
- Add undocumented columns
- Remove documented columns
- Modify documented relationships

Database changes require an explicit update to the documentation before implementation.

---

# 10. Research Workflow Compliance

The research workflow is fixed.

The AI must not change the documented execution sequence.

The workflow remains:

```text
Keyword

↓

Search Redbubble

↓

Collect Products

↓

Extract Data

↓

Store Data

↓

AI Analysis

↓

Generate HTML Report
```

No additional workflow steps should be introduced.

---

# 11. AI Development Principles

During implementation, the AI should:

- Follow the documentation exactly.
- Prefer simple implementations.
- Avoid unnecessary abstraction.
- Keep modules independent.
- Write maintainable code.
- Follow the documented coding standards.

The implementation should prioritize correctness over optimization.

---

# 12. Handling Missing Information

If implementation requires information that is not documented, the AI must not invent a solution.

Instead, the AI should:

1. Identify the missing information.
2. Inform the user.
3. Request clarification before proceeding.

The AI must never silently make architectural decisions.

---

# 13. Code Generation Rules

When implementing code, the AI should:

- Follow the documented project structure.
- Follow the documented module boundaries.
- Follow the documented naming conventions.
- Follow the documented technology stack.
- Follow the documented error handling strategy.

Generated code should remain consistent with the rest of the project.

---

# 14. Modifying Existing Code

When asked to modify an existing implementation, the AI should:

- Limit changes to the requested functionality.
- Avoid unrelated refactoring.
- Preserve existing architecture.
- Preserve documented behavior.

Changes outside the requested scope should not be made.

---

# 15. Error Handling During Development

If implementation reveals inconsistencies between documentation and code, the AI should:

- Stop implementation.
- Describe the inconsistency.
- Request clarification.

The AI should not attempt to resolve documentation conflicts independently.

---

# 16. Documentation Priority

If multiple documents are relevant to an implementation task, they should be interpreted using the following priority:

1. AI Development Instructions
2. Project Vision & Product Scope
3. Architecture Principles & Design Philosophy
4. High-Level System Architecture
5. Domain Model & Core Entities
6. Project Structure & Module Boundaries
7. Technology Stack Decisions
8. Database Design
9. Data Collection Pipeline
10. AI Analysis Pipeline
11. Report Generation System
12. Configuration & Environment
13. Logging & Error Handling
14. Testing Strategy
15. Development Roadmap
16. Coding Standards & Conventions

If a conflict is detected between documents, implementation should stop until the documentation is clarified.

---

# 17. Implementation Workflow

For every implementation request, the AI should follow the same workflow.

```text
Read Relevant Documentation

↓

Understand Requirements

↓

Identify Affected Modules

↓

Implement Requested Changes

↓

Verify Implementation

↓

Report Completion
```

Implementation should proceed step by step.

---

# 18. Testing Responsibility

The AI should ensure that implemented functionality aligns with the documented testing strategy.

Before considering a task complete, the AI should verify that:

- The implementation satisfies the documented requirements.
- Existing functionality is preserved.
- Module boundaries remain intact.

---

# 19. Completion Criteria

An implementation task is considered complete only when:

- The requested functionality has been implemented.
- The implementation matches the project documentation.
- No undocumented functionality has been introduced.
- Module boundaries remain unchanged.
- The approved technology stack has been followed.
- The implementation remains consistent with the project architecture.

---

# 20. Final Rule

Marketplace Research Lab Version 0.1 is a specification-driven project.

The documentation defines the system.

The implementation follows the documentation.

The AI coding assistant must treat the project documentation as the authoritative source for all implementation decisions and must not introduce architectural, functional, or structural changes unless explicitly instructed by the user or the documentation is formally updated.
