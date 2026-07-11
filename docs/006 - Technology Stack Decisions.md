# 006 — Technology Stack Decisions

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the official technology stack for Marketplace Research Lab Version 0.1.

The goal of this document is to establish a single source of truth for every technology used throughout the project.

Each technology has been selected based on the following priorities:

- Local-first desktop application
- AI-assisted development
- Simplicity
- Reliability
- Maintainability
- Strong ecosystem
- Long-term stability

Only technologies required to complete Version 0.1 are included.

---

# 2. Technology Stack Overview

| Layer                | Technology                      |
| -------------------- | ------------------------------- |
| Desktop Runtime      | Electron                        |
| Programming Language | TypeScript                      |
| Frontend Framework   | React                           |
| UI Styling           | Tailwind CSS                    |
| UI Components        | shadcn/ui                       |
| Backend Runtime      | Node.js (Electron Main Process) |
| Browser Automation   | Playwright                      |
| Database             | SQLite                          |
| SQLite Driver        | better-sqlite3                  |
| HTML Parsing         | Playwright DOM APIs             |
| Data Validation      | Zod                             |
| Logging              | Pino                            |
| Package Manager      | pnpm                            |
| Build Tool           | Vite                            |
| Desktop Packaging    | Electron Builder                |
| AI Integration       | Provider Abstraction Layer      |
| Report Generation    | Native HTML Templates           |

---

# 3. Desktop Runtime

## Selected Technology

Electron

---

## Reason for Selection

Marketplace Research Lab is a desktop application that requires:

- Full filesystem access
- Browser automation
- Local database access
- Background processing
- Native desktop packaging

Electron provides mature support for all of these requirements.

Its ecosystem is well established and works seamlessly with Playwright and Node.js.

---

## Alternatives Considered

### Tauri

Advantages

- Smaller application size
- Lower memory usage

Reasons Rejected

- Smaller ecosystem
- More Rust integration when extending functionality
- Less mature for complex browser automation workflows

---

### Native Desktop Frameworks

Reasons Rejected

- Platform-specific development
- Reduced development speed
- Less suitable for AI-assisted implementation

---

# 4. Programming Language

## Selected Technology

TypeScript

---

## Reason for Selection

The entire project uses one programming language.

Benefits include:

- End-to-end type safety
- Excellent IDE support
- Better AI-generated code quality
- Shared interfaces across frontend and backend
- Reduced context switching

---

## Alternatives Considered

### JavaScript

Rejected because:

- No static typing
- Higher runtime error risk
- Less maintainable

---

### Python

Python is excellent for research and scraping.

However, using both Python and TypeScript would introduce unnecessary complexity for Version 0.1.

Maintaining a single language simplifies development and AI-assisted implementation.

---

# 5. Frontend Framework

## Selected Technology

React

---

## Reason for Selection

React provides:

- Mature ecosystem
- Component-based architecture
- Excellent Electron compatibility
- Strong TypeScript support
- Predictable UI development

Only standard React features should be used.

No unnecessary abstraction layers.

---

# 6. Styling System

## Selected Technology

Tailwind CSS

---

## Reason for Selection

Tailwind CSS enables:

- Fast UI development
- Consistent design
- Minimal custom CSS
- Predictable styling

Component styling should remain utility-based.

---

# 7. UI Components

## Selected Technology

shadcn/ui

---

## Reason for Selection

Provides:

- Accessible components
- Full source ownership
- Excellent TypeScript support
- Easy customization

No additional component libraries are required.

---

# 8. Backend Runtime

## Selected Technology

Node.js (Electron Main Process)

---

## Reason for Selection

The backend requires:

- Playwright execution
- SQLite access
- File management
- AI communication

Node.js supports these requirements natively.

No additional backend framework is required.

---

# 9. Browser Automation

## Selected Technology

Playwright

---

## Purpose

Responsible for:

- Opening Redbubble
- Searching keywords
- Navigating product pages
- Reading page content
- Extracting structured information

---

## Reason for Selection

Playwright provides:

- Reliable browser automation
- Excellent stability
- Modern API
- Strong TypeScript support

It is the industry standard for modern browser automation.

---

## Design Rule

Playwright must exist only inside the Marketplace module.

No other module may directly depend on Playwright.

---

# 10. HTML Extraction

## Selected Technology

Playwright DOM APIs

---

## Reason for Selection

Version 0.1 extracts data directly from the live DOM using Playwright locators and evaluation methods.

No separate HTML parser is required.

This reduces complexity and keeps extraction logic in one place.

---

# 11. Database

## Selected Technology

SQLite

---

## Reason for Selection

The application is:

- Single-user
- Local-first
- Desktop-only

SQLite provides:

- Zero configuration
- High reliability
- Excellent performance
- Portable database file
- Proven stability

A client-server database is unnecessary for Version 0.1.

---

# 12. SQLite Driver

## Selected Technology

better-sqlite3

---

## Reason for Selection

Provides:

- High performance
- Simple synchronous API
- Excellent stability
- Mature ecosystem

The expected workload of Version 0.1 does not require asynchronous database operations.

---

# 13. Data Validation

## Selected Technology

Zod

---

## Purpose

Used for:

- Configuration validation
- AI response validation
- Structured data validation

Validation should occur before data enters the domain model.

---

# 14. Logging

## Selected Technology

Pino

---

## Purpose

Used for:

- Application logs
- Research execution logs
- Error logs
- AI request logs

Logging should use structured JSON output.

---

# 15. Package Manager

## Selected Technology

pnpm

---

## Reason for Selection

Provides:

- Faster dependency installation
- Efficient disk usage
- Reliable lockfile
- Excellent workspace support

All project dependencies should be managed through pnpm.

---

# 16. Build Tool

## Selected Technology

Vite

---

## Reason for Selection

Provides:

- Fast development server
- Efficient production builds
- Excellent React integration
- Strong TypeScript support

---

# 17. Desktop Packaging

## Selected Technology

Electron Builder

---

## Purpose

Responsible for:

- Production builds
- Installer generation
- Desktop distribution

No alternative packaging solution is required.

---

# 18. AI Integration

## Architecture

AI communication is isolated behind a Provider Abstraction Layer.

The rest of the application communicates only with the abstraction.

The implementation details of individual AI providers remain hidden.

---

## Responsibilities

The AI layer is responsible for:

- Sending prompts
- Receiving responses
- Validating responses
- Returning structured analysis

The AI layer is not responsible for:

- Scraping
- HTML parsing
- Database operations
- Report generation

---

# 19. Report Generation

## Selected Technology

Native HTML Templates

---

## Reason for Selection

The final output of Version 0.1 is a standalone HTML report.

Generating HTML directly provides:

- Offline viewing
- Easy sharing
- Simple styling
- No external dependencies

No PDF generation is included in Version 0.1.

---

# 20. Configuration Management

Configuration is stored locally.

Configuration includes:

- AI provider
- AI model
- API keys
- Application settings

Configuration must be validated during application startup.

---

# 21. File Storage

The application stores all generated assets locally.

Examples include:

- Database file
- Downloaded images
- HTML reports
- Log files
- Temporary files

Binary assets remain on the filesystem.

The database stores references where appropriate.

---

# 22. Technologies Not Used

The following technologies are intentionally excluded from Version 0.1.

| Technology        | Reason                                                   |
| ----------------- | -------------------------------------------------------- |
| Docker            | Local desktop application                                |
| Microservices     | Unnecessary complexity                                   |
| Express / Fastify | No HTTP server required                                  |
| PostgreSQL        | SQLite satisfies all requirements                        |
| MongoDB           | Relational storage is sufficient                         |
| Prisma            | Unnecessary abstraction for the project size             |
| Redis             | No distributed caching required                          |
| RabbitMQ          | No background job infrastructure required                |
| GraphQL           | No API layer exists                                      |
| Redux             | Application state is simple                              |
| Zustand           | Not required for Version 0.1                             |
| ORM Frameworks    | Direct database access is sufficient with better-sqlite3 |

---

# 23. Technology Decision Principles

Every technology selected for Version 0.1 satisfies the following requirements:

- Solves an actual project requirement.
- Has a mature ecosystem.
- Supports TypeScript.
- Works well in a local desktop environment.
- Can be understood and maintained by AI coding agents.
- Does not introduce unnecessary architectural complexity.

Any new dependency added in the future must satisfy these same principles.

---

# 24. Final Approved Technology Stack

| Category             | Selected Technology             |
| -------------------- | ------------------------------- |
| Desktop Runtime      | Electron                        |
| Programming Language | TypeScript                      |
| Frontend             | React                           |
| Styling              | Tailwind CSS                    |
| Components           | shadcn/ui                       |
| Backend Runtime      | Node.js (Electron Main Process) |
| Browser Automation   | Playwright                      |
| Database             | SQLite                          |
| Database Driver      | better-sqlite3                  |
| HTML Extraction      | Playwright DOM APIs             |
| Validation           | Zod                             |
| Logging              | Pino                            |
| Package Manager      | pnpm                            |
| Build Tool           | Vite                            |
| Desktop Packaging    | Electron Builder                |
| AI Integration       | Provider Abstraction Layer      |
| Report Generation    | Native HTML Templates           |

This technology stack is the official foundation for Marketplace Research Lab Version 0.1. All implementation decisions should align with these selections unless a documented architectural decision explicitly approves a change.
