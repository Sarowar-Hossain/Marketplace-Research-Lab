# 003 — High-Level System Architecture

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the complete high-level architecture of Marketplace Research Lab.

It describes how every major subsystem interacts, how data flows through the application, where responsibilities begin and end, and how the architecture supports future growth while remaining intentionally simple for Version 0.1.

This document is the primary architectural reference for all future implementation.

---

# 2. Architectural Overview

Marketplace Research Lab is a **local-first desktop application** built around a central **Research Engine**.

Unlike traditional desktop applications that revolve around CRUD operations, this system revolves around executing a deterministic research workflow.

The application consists of four major parts:

```text
┌──────────────────────────────┐
│        Desktop UI            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Application Layer       │
│  (Commands / Workflows)      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Research Engine        │
└──────────────┬───────────────┘
               │
 ┌─────────────┼─────────────┐
 ▼             ▼             ▼
Marketplace   Storage      AI Engine
 Adapter      Layer
```

The UI never communicates directly with Playwright, SQLite, or AI providers.

Everything passes through the Research Engine.

---

# 3. Architectural Layers

The application is organized into six logical layers.

```text
Presentation Layer

↓

Application Layer

↓

Research Engine

↓

Infrastructure Layer

↓

Persistence Layer

↓

External Services
```

Each layer has a single responsibility.

Lower layers never depend on higher layers.

---

# 4. Layer Responsibilities

## 4.1 Presentation Layer

Responsible for:

- User interface
- User interaction
- Displaying progress
- Displaying reports
- Displaying logs
- Collecting user input

This layer contains **no business logic**.

It never performs scraping.

It never calls AI providers directly.

It never queries SQLite directly.

---

## 4.2 Application Layer

Responsible for orchestrating user actions.

Examples:

- Start research
- Cancel research
- Open report
- Load history
- Export report

This layer coordinates workflows but does not perform the actual work.

---

## 4.3 Research Engine

The Research Engine is the heart of the application.

It coordinates the complete research lifecycle.

Responsibilities:

- Execute workflows
- Coordinate adapters
- Validate execution
- Manage research state
- Handle failures
- Produce deterministic outputs

The Research Engine contains no UI code.

---

## 4.4 Infrastructure Layer

Responsible for communication with external systems.

Examples:

- Playwright
- AI providers
- Local filesystem
- HTML parsing
- Logging

Infrastructure components should remain replaceable.

---

## 4.5 Persistence Layer

Responsible only for data storage.

Responsibilities:

- SQLite access
- Transactions
- Cache
- Local files
- Images
- Reports

Persistence contains no scraping logic.

Persistence contains no AI logic.

---

## 4.6 External Services

External services include:

- Redbubble
- OpenAI
- Gemini
- DeepSeek

These systems are considered unreliable by default.

Every interaction must include timeout, retry, and error handling.

---

# 5. Primary Data Flow

Every research session follows the same deterministic pipeline.

```text
User

↓

Keyword

↓

Research Engine

↓

Marketplace Adapter

↓

Search

↓

Product Discovery

↓

Product Extraction

↓

Normalization

↓

Validation

↓

Persistence

↓

AI Analysis

↓

HTML Report

↓

Complete
```

No component may bypass this pipeline.

---

# 6. Internal Module Architecture

The Research Engine is composed of specialized modules.

```text
Research Engine

├── Session Manager

├── Workflow Coordinator

├── Marketplace Manager

├── Extraction Manager

├── Normalization Manager

├── Validation Manager

├── Storage Manager

├── AI Analysis Manager

├── Report Manager

└── Error Manager
```

Each manager owns one responsibility.

Managers communicate only through defined interfaces.

---

# 7. Marketplace Adapter Architecture

Marketplace-specific logic must never leak into the core application.

Instead:

```text
Research Engine

↓

Marketplace Adapter

↓

Redbubble Adapter

↓

Playwright

↓

Website
```

Future marketplaces simply implement the same adapter contract.

```text
MarketplaceAdapter

↓

Redbubble

Etsy

TeePublic

Amazon
```

The Research Engine never knows which marketplace is being used.

---

# 8. AI Architecture

The AI subsystem is completely isolated.

```text
Research Engine

↓

AI Manager

↓

AI Provider

↓

OpenAI

Gemini

DeepSeek
```

The AI Manager always receives structured domain objects.

It never receives HTML.

It never performs scraping.

It never queries the database directly.

---

# 9. Storage Architecture

Storage is divided into structured and unstructured data.

```text
SQLite

Research Sessions

Products

AI Results

Metadata

Configuration
```

Filesystem

```text
Images

Reports

Logs

Cache

Temporary Files
```

Large binary objects should remain outside SQLite.

SQLite stores references only.

---

# 10. Session Lifecycle

Every research execution creates a Research Session.

```text
Created

↓

Running

↓

Collecting

↓

Extracting

↓

Analyzing

↓

Generating Report

↓

Completed

or

Failed
```

The current session state is always known.

Unexpected termination should never corrupt previous sessions.

---

# 11. Communication Model

All communication follows dependency inversion.

```text
UI

↓

Application Services

↓

Research Engine

↓

Interfaces

↓

Implementations
```

Concrete implementations should never be referenced directly by higher layers.

---

# 12. Error Flow

Errors should propagate upward in a controlled manner.

```text
Playwright Error

↓

Marketplace Adapter

↓

Research Engine

↓

Application Layer

↓

UI Notification

↓

Log
```

Errors should never terminate the application unless recovery is impossible.

---

# 13. Logging Flow

Every significant operation should produce structured logs.

```text
Research Started

↓

Marketplace Search

↓

Products Found

↓

Extraction Complete

↓

AI Started

↓

AI Finished

↓

Report Generated

↓

Research Completed
```

Logs must include timestamps, durations, severity, and session identifiers.

---

# 14. Configuration Flow

Configuration is loaded once during application startup.

```text
Configuration File

↓

Validation

↓

Configuration Service

↓

Application
```

Configuration should be treated as immutable during runtime unless explicitly reloaded.

---

# 15. Startup Sequence

```text
Launch Application

↓

Load Configuration

↓

Validate Environment

↓

Initialize Logger

↓

Initialize Database

↓

Initialize Research Engine

↓

Initialize AI Providers

↓

Load UI

↓

Ready
```

If a critical component fails during startup, the application should display a clear diagnostic message and prevent further execution until the issue is resolved.

---

# 16. Shutdown Sequence

```text
Cancel Active Tasks

↓

Flush Logs

↓

Complete Pending Database Transactions

↓

Release Playwright Resources

↓

Close Database

↓

Exit Application
```

Shutdown should be graceful and deterministic.

---

# 17. Dependency Rules

The following dependency rules are mandatory:

- UI must not access SQLite directly.
- UI must not call Playwright directly.
- UI must not call AI providers directly.
- Marketplace adapters must not know about AI.
- AI modules must not know about Playwright.
- Database modules must not contain business logic.
- Report generation must consume structured data only.
- Every module communicates through documented interfaces.

Violations of these rules are architectural defects.

---

# 18. Future Expansion Strategy

The architecture is intentionally designed so that future capabilities require adding new implementations rather than modifying existing core components.

Examples include:

- Adding a new marketplace by implementing a new `MarketplaceAdapter`.
- Adding a new AI provider by implementing a new `AIProvider`.
- Adding a new report format (PDF, Markdown) by implementing a new `ReportGenerator`.
- Adding image analysis by introducing a dedicated `VisionAnalysis` module without altering the existing research workflow.

This approach minimizes regression risk and keeps the core Research Engine stable.

---

# 19. High-Level Architecture Summary

Marketplace Research Lab is architected around a single deterministic **Research Engine** that orchestrates discovery, extraction, normalization, persistence, AI analysis, and report generation.

The architecture deliberately separates concerns into independent, replaceable modules with clear interfaces. Marketplace-specific logic, AI providers, storage technologies, and reporting formats are isolated behind contracts, allowing future evolution without fundamental redesign.

This architecture prioritizes **clarity, maintainability, local-first operation, deterministic workflows, and AI-assisted development**, providing a stable foundation for Version 0.1 and a scalable path toward a multi-marketplace intelligence platform.
