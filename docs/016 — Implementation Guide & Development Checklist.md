# 016 — Implementation Guide & Development Checklist

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.1

**Status:** Approved

---

# 1. Purpose

This document defines the implementation workflow for Marketplace Research Lab Version 0.1.

Its purpose is to translate the approved project documentation into a clear implementation process.

This document does **not** define new architecture, new features, new workflows, or new technical decisions.

Its only purpose is to ensure that implementation always remains consistent with the approved documentation.

---

# 2. Source of Truth

The implementation must always follow the approved documentation in the following order.

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

This document does not override the documents above.

---

# 3. Implementation Rules

Every AI coding assistant must follow these rules.

- Read the relevant documentation before implementation.
- Implement only the approved Version 0.1 scope.
- Do not redesign the architecture.
- Do not introduce undocumented features.
- Do not introduce undocumented workflows.
- Do not introduce undocumented modules.
- Do not introduce undocumented database tables.
- Do not introduce undocumented configuration options.
- Do not introduce undocumented dependencies.
- Do not introduce undocumented libraries.
- Do not introduce undocumented tooling.
- Do not refactor unrelated code.
- Keep implementation simple and deterministic.

---

# 4. Missing Specification Rule

If implementation requires information that is not explicitly documented:

The AI must not guess.

The AI must:

1. Identify the missing specification.
2. Explain why implementation is blocked.
3. Recommend the simplest solution that remains consistent with the approved architecture.
4. Wait for user approval.

Never use "sensible defaults."

Never make architectural decisions independently.

---

# 5. Implementation Workflow

Every implementation request follows the same workflow.

```text
Read Documentation

↓

Understand Requirements

↓

Identify Affected Modules

↓

Create Implementation Plan

↓

Wait For Approval

↓

Implement One Task

↓

Verify

↓

Report Completion

↓

Wait For Next Approval
```

No code should be generated before the implementation plan has been approved.

---

# 6. Implementation Plan Requirements

Before writing any code, the AI must provide:

- Task objective
- Documentation references
- Affected modules
- Files to create
- Files to modify
- Dependencies
- Acceptance criteria
- Manual verification steps

Only after approval may implementation begin.

---

# 7. Development Phases

Development must follow the roadmap exactly.

```text
Phase 1
Project Foundation

↓

Phase 2
Storage Layer

↓

Phase 3
Marketplace Module

↓

Phase 4
Research Engine

↓

Phase 5
AI Module

↓

Phase 6
Report Generation

↓

Phase 7
User Interface

↓

Phase 8
Testing
```

No phase may begin before the previous phase has been completed and verified.

---

# 8. Task Completion Rules

A task is complete only when:

- The requested functionality is implemented.
- The implementation matches the documentation.
- The project builds successfully.
- No runtime errors exist.
- Existing functionality remains unchanged.
- Acceptance criteria are satisfied.
- Manual verification has been completed.
- Only the approved task has been implemented.
- The AI must not modify the approved implementation scope of a task.
- If part of a task cannot yet be implemented because of a dependency, implementation must stop and request clarification instead of silently changing the task.

---

# 9. Development Checklist

---

## Phase 1 — Project Foundation

**Status:** ☐ Not Started

### ☐ Initialize Project

- Create the project root.
- Create `package.json`.
- Create `.gitignore`.
- Verify `pnpm install` succeeds.
- Do not install project dependencies.

---

### ☐ Configure pnpm

- Declare pnpm as the project package manager.
- Add only pnpm configuration required by the project.
- Do not add package scripts that depend on tooling not yet implemented.
- Do not add optional pnpm preferences unless explicitly required by the documentation.

---

### ☐ Create Project Folder Structure

- Create only the directories documented in Document 005.
- Do not create undocumented folders.
- Do not create feature-specific folders.

---

### ☐ Configure TypeScript

- Create TypeScript configuration.
- Enable strict type checking.
- Do not configure Electron.
- Do not configure React.
- Do not configure Vite.

---

### ☐ Configure Vite

- Configure the Vite development environment.
- Configure production build.
- Do not configure Electron Builder packaging.

---

### ☐ Configure Electron

- Configure Electron main process.
- Configure Electron preload process.
- Create the application window.
- Do not configure marketplace modules.
- Do not configure business logic.

---

### ☐ Configure React

- Configure the renderer entry.
- Render a minimal placeholder application.
- Do not build application pages.
- Do not build application features.

---

### ☐ Configure Tailwind CSS

- Configure Tailwind CSS.
- Verify utility classes work.
- Do not build a design system.
- Do not add custom themes.

---

### ☐ Configure shadcn/ui

- Initialize the documented foundation only.
- Do not install UI components.
- Do not build the application interface.

---

### ☐ Configure Logging

- Configure the documented logging system.
- Verify log creation.
- Do not add custom logging features.

---

### ☐ Configure Configuration Loading

- Configure configuration loading.
- Configure configuration validation.
- Do not add runtime configuration beyond the documentation.

---

### ☐ Verify Application Startup

- Verify the application starts successfully.
- Verify there are no build errors.
- Verify there are no runtime errors.
- Verify the documented Phase 1 completion criteria.

---

## Phase 2 — Storage Layer

**Status:** ☐ Not Started

### Tasks

- ☐ Create SQLite database
- ☐ Create database schema
- ☐ Implement database connection
- ☐ Implement database initialization
- ☐ Verify database operations

---

## Phase 3 — Marketplace Module

**Status:** ☐ Not Started

### Tasks

- ☐ Configure Playwright
- ☐ Implement keyword search
- ☐ Implement product discovery
- ☐ Implement product extraction
- ☐ Implement validation
- ☐ Implement normalization
- ☐ Verify data collection

---

## Phase 4 — Research Engine

**Status:** ☐ Not Started

### Tasks

- ☐ Create Research Engine
- ☐ Implement research workflow
- ☐ Integrate Marketplace module
- ☐ Integrate Storage module
- ☐ Verify complete data collection workflow

---

## Phase 5 — AI Module

**Status:** ☐ Not Started

### Tasks

- ☐ Configure AI provider
- ☐ Build prompt
- ☐ Implement AI request
- ☐ Validate AI response
- ☐ Store AI analysis
- ☐ Verify AI pipeline

---

## Phase 6 — Report Generation

**Status:** ☐ Not Started

### Tasks

- ☐ Load research data
- ☐ Load AI analysis
- ☐ Generate HTML report
- ☐ Save report
- ☐ Store report metadata
- ☐ Verify report output

---

## Phase 7 — User Interface

**Status:** ☐ Not Started

### Tasks

- ☐ Keyword input
- ☐ Start research
- ☐ Progress display
- ☐ Completion notification
- ☐ Open HTML report
- ☐ Verify end-to-end user workflow

---

## Phase 8 — Testing

**Status:** ☐ Not Started

### Tasks

- ☐ Unit testing
- ☐ Integration testing
- ☐ End-to-end testing
- ☐ Error handling verification
- ☐ Database integrity verification
- ☐ Report verification

---

# 10. MVP Completion Checklist

Marketplace Research Lab Version 0.1 is complete only when the following workflow operates successfully without manual intervention.

```text
Launch Application

↓

Enter Keyword

↓

Search Redbubble

↓

Collect Products

↓

Extract Structured Data

↓

Store Data

↓

Run AI Analysis

↓

Generate HTML Report

↓

Open HTML Report
```

---

# 11. Final Rules

Marketplace Research Lab Version 0.1 is a specification-driven project.

Implementation must follow the approved documentation exactly.

If any implementation decision cannot be traced back to the documentation, implementation must stop until clarification is provided.

The AI coding assistant is an implementation assistant, not the software architect.

The AI must implement only one approved task at a time.

After completing a task, the AI must stop, report the implementation, and wait for approval before continuing.

The AI must never continue to the next task automatically.
