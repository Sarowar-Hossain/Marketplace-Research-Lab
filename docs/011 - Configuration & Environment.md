---

# 011 — Configuration & Environment

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the configuration system used by Marketplace Research Lab Version 0.1.

The application is a local desktop application and requires only a minimal set of configuration values.

The purpose of the configuration system is to:

- Store application settings.
- Store AI provider settings.
- Store local storage locations.
- Provide a consistent configuration source for the application.

The configuration system must remain simple, predictable, and easy to maintain.

---

# 2. Configuration Principles

The configuration system follows these principles.

## Principle 1

Configuration belongs to the application.

It is not part of the research data.

---

## Principle 2

Configuration is loaded during application startup.

---

## Principle 3

Configuration should be validated before the application begins normal execution.

---

## Principle 4

Invalid configuration should prevent application startup.

---

## Principle 5

Configuration should not contain temporary runtime state.

---

# 3. Configuration Categories

Version 0.1 contains only the following configuration categories.

- Application
- AI
- Storage

No additional categories are required.

---

# 4. Application Configuration

Application configuration defines general application behavior.

## Fields

| Setting             | Description                 |
| ------------------- | --------------------------- |
| Application Name    | Marketplace Research Lab    |
| Application Version | Current application version |
| Default Marketplace | Redbubble                   |

These values are read-only for Version 0.1.

---

# 5. AI Configuration

AI configuration defines how the application communicates with the selected AI provider.

## Fields

| Setting     | Description                                  |
| ----------- | -------------------------------------------- |
| AI Provider | Selected provider                            |
| AI Model    | Selected model                               |
| API Key     | Authentication key for the selected provider |

The AI configuration is required before AI analysis can be performed.

---

# 6. Storage Configuration

Storage configuration defines where local application data is stored.

## Fields

| Setting            | Description                           |
| ------------------ | ------------------------------------- |
| Database Directory | Location of the SQLite database       |
| Reports Directory  | Location of generated HTML reports    |
| Images Directory   | Location of downloaded product images |
| Logs Directory     | Location of application log files     |
| Cache Directory    | Location of temporary cached data     |

All paths should refer to local filesystem locations.

---

# 7. Configuration Loading

Configuration is loaded once during application startup.

The loading sequence is:

```text
Start Application
        │
        ▼
Load Configuration
        │
        ▼
Validate Configuration
        │
        ▼
Initialize Application
```

If configuration validation fails, the application must stop before initializing any other components.

---

# 8. Configuration Validation

Every configuration value must be validated after loading.

Validation includes:

- Required values are present.
- Directory paths are valid.
- AI provider is specified.
- AI model is specified.
- API key is available.

If any required value is missing or invalid, startup must fail with a clear error message.

---

# 9. Environment Variables

Version 0.1 uses environment variables only for sensitive information.

The only required environment variable is:

| Variable   | Purpose                                      |
| ---------- | -------------------------------------------- |
| AI API Key | Authentication with the selected AI provider |

No other application settings should depend on environment variables.

---

# 10. Directory Structure

The application should organize its local data using the following directories.

```text
Application Data

├── database/
│
├── reports/
│
├── images/
│
├── logs/
│
└── cache/
```

Each directory has a single responsibility.

---

# 11. Configuration Usage

Configuration values are read by the modules that require them.

Examples:

- Storage Module reads storage paths.
- AI Module reads AI provider settings.
- Application Module reads application settings.

Modules should receive configuration values through their public interfaces.

They should not load configuration files directly.

---

# 12. Configuration Scope

Configuration applies to the application as a whole.

It does not belong to individual research sessions.

Research sessions store only the configuration snapshot required for reproducibility, as defined in the domain model.

---

# 13. Error Handling

Configuration errors are considered startup errors.

Examples include:

- Missing configuration file.
- Missing required setting.
- Invalid storage path.
- Missing AI API key.

When a configuration error occurs:

- Stop application initialization.
- Display a clear error message.
- Do not initialize the Research Engine.

---

# 14. Configuration Lifecycle

The configuration lifecycle is:

```text
Load

↓

Validate

↓

Provide to Modules

↓

Application Running
```

Configuration remains available for the lifetime of the application.

---

# 15. Configuration Scope Summary

Version 0.1 requires only the configuration necessary to:

- Identify the application.
- Connect to the selected AI provider.
- Locate local storage directories.

No additional configuration is required.

The configuration system should remain intentionally minimal, reflecting the overall design philosophy of Marketplace Research Lab Version 0.1: simple, local-first, and focused solely on the research workflow.
