I understand, and I'll follow the original outline from now on without changing the document order.

However, I want to make one architectural note before writing the database design:

**This database is designed only for Version 0.1.** It supports exactly our agreed workflow:

> **Keyword → Search Redbubble → Collect Products → Store Data → AI Analysis → Generate HTML Report**

Nothing more.

No users, no authentication, no scheduling, no analytics, no historical tracking beyond individual research sessions, and no future features mixed into the schema.

---

# 007 — Database Design

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the database architecture for Marketplace Research Lab Version 0.1.

The database serves one purpose only:

**Persist all data generated during a research session.**

It is not designed to be a generic marketplace database.

It is not intended to synchronize data across multiple users or machines.

The database is optimized for:

- Local storage
- Fast reads
- Simple writes
- Reliability
- Data integrity
- Easy maintenance

---

# 2. Database Technology

## Selected Database

SQLite

---

## Reason

SQLite is selected because Version 0.1 is:

- Single user
- Desktop application
- Local-first
- Offline capable

SQLite provides:

- Zero configuration
- ACID transactions
- Excellent performance
- Single portable database file
- Mature ecosystem

No client-server database is required.

---

# 3. Database Design Principles

The database follows these principles.

## Principle 1

Each table represents one business entity.

---

## Principle 2

Avoid duplicated information whenever practical.

---

## Principle 3

Store structured data only.

Raw browser objects, Playwright objects, and HTML must never be stored in database tables.

---

## Principle 4

Large binary files remain on the filesystem.

The database stores references only.

---

## Principle 5

Every record should be traceable back to its Research Session.

---

# 4. Entity Relationship Diagram

```text
Research Session
        │
        │ 1
        │
        ├───────────────< Product
        │                    │
        │                    ├──────────< Product Image
        │                    │
        │                    ├──────────< Product Tag
        │                    │
        │                    └────────── Product Statistics
        │
        ├─────────────── AI Analysis
        │
        └─────────────── Report
```

---

# 5. Tables Overview

| Table              | Purpose                                |
| ------------------ | -------------------------------------- |
| research_sessions  | Stores one complete research execution |
| products           | Stores extracted marketplace products  |
| product_images     | Stores image metadata                  |
| product_tags       | Stores marketplace tags                |
| product_statistics | Stores measurable product information  |
| ai_analysis        | Stores AI-generated analysis           |
| reports            | Stores generated HTML report metadata  |

These are the only tables required for Version 0.1.

---

# 6. Table Design

---

## 6.1 research_sessions

### Purpose

Represents one research execution.

### Fields

| Field        | Type        | Required | Description              |
| ------------ | ----------- | -------- | ------------------------ |
| id           | TEXT (UUID) | Yes      | Primary Key              |
| keyword      | TEXT        | Yes      | User input keyword       |
| marketplace  | TEXT        | Yes      | Marketplace name         |
| status       | TEXT        | Yes      | Current execution status |
| ai_provider  | TEXT        | Yes      | Selected AI provider     |
| ai_model     | TEXT        | Yes      | Selected AI model        |
| started_at   | DATETIME    | Yes      | Session start            |
| completed_at | DATETIME    | No       | Session completion       |
| report_id    | TEXT        | No       | Related report           |

---

### Primary Key

```text
id
```

---

### Indexes

```text
keyword

started_at

status
```

---

# 6.2 products

### Purpose

Stores one Redbubble product.

---

### Fields

| Field        | Type        | Required |
| ------------ | ----------- | -------- |
| id           | TEXT (UUID) | Yes      |
| session_id   | TEXT        | Yes      |
| title        | TEXT        | Yes      |
| product_url  | TEXT        | Yes      |
| artist_name  | TEXT        | No       |
| description  | TEXT        | No       |
| product_type | TEXT        | No       |
| price        | REAL        | No       |
| currency     | TEXT        | No       |
| created_at   | DATETIME    | Yes      |

---

### Foreign Key

```text
session_id

↓

research_sessions.id
```

---

### Indexes

```text
session_id

product_url
```

---

# 6.3 product_images

### Purpose

Stores image metadata.

---

### Fields

| Field         | Type        |
| ------------- | ----------- |
| id            | TEXT (UUID) |
| product_id    | TEXT        |
| image_url     | TEXT        |
| local_path    | TEXT        |
| display_order | INTEGER     |

---

### Foreign Key

```text
product_id

↓

products.id
```

---

### Indexes

```text
product_id
```

---

# 6.4 product_tags

### Purpose

Stores marketplace tags.

---

### Fields

| Field      | Type        |
| ---------- | ----------- |
| id         | TEXT (UUID) |
| product_id | TEXT        |
| tag        | TEXT        |

---

### Foreign Key

```text
product_id

↓

products.id
```

---

### Indexes

```text
product_id

tag
```

---

# 6.5 product_statistics

### Purpose

Stores structured numerical information.

---

### Fields

| Field              | Type    |
| ------------------ | ------- |
| product_id         | TEXT    |
| favorites          | INTEGER |
| available_products | INTEGER |

---

### Primary Key

```text
product_id
```

Each product has exactly one statistics record.

---

# 6.6 ai_analysis

### Purpose

Stores the AI-generated research analysis.

---

### Fields

| Field        | Type        |
| ------------ | ----------- |
| id           | TEXT (UUID) |
| session_id   | TEXT        |
| provider     | TEXT        |
| model        | TEXT        |
| prompt       | TEXT        |
| response     | TEXT        |
| generated_at | DATETIME    |

---

### Foreign Key

```text
session_id

↓

research_sessions.id
```

---

### Indexes

```text
session_id
```

---

# 6.7 reports

### Purpose

Stores generated HTML report metadata.

---

### Fields

| Field        | Type        |
| ------------ | ----------- |
| id           | TEXT (UUID) |
| session_id   | TEXT        |
| report_path  | TEXT        |
| generated_at | DATETIME    |

---

### Foreign Key

```text
session_id

↓

research_sessions.id
```

---

# 7. Relationships

## Research Session

One Research Session

↓

Many Products

---

## Product

One Product

↓

Many Images

---

## Product

One Product

↓

Many Tags

---

## Product

One Product

↓

One Statistics Record

---

## Research Session

One Research Session

↓

One AI Analysis

---

## Research Session

One Research Session

↓

One Report

---

# 8. Referential Integrity

The following foreign key relationships are mandatory.

```text
products.session_id

↓

research_sessions.id
```

---

```text
product_images.product_id

↓

products.id
```

---

```text
product_tags.product_id

↓

products.id
```

---

```text
product_statistics.product_id

↓

products.id
```

---

```text
ai_analysis.session_id

↓

research_sessions.id
```

---

```text
reports.session_id

↓

research_sessions.id
```

SQLite foreign key enforcement must be enabled.

---

# 9. Normalization

The schema follows Third Normal Form (3NF).

Reasons:

- Eliminates duplicated product information.
- Prevents update anomalies.
- Keeps relationships explicit.
- Simplifies future maintenance.

No denormalization is required for Version 0.1.

---

# 10. Primary Key Strategy

All primary keys use UUID values stored as TEXT.

Reasons:

- Globally unique.
- Independent of insertion order.
- Easy to generate locally.
- No dependency on auto-increment behavior.

---

# 11. Delete Rules

Deleting a Research Session should also remove:

- Products
- Product Images
- Product Tags
- Product Statistics
- AI Analysis
- Report metadata

Database relationships should use **ON DELETE CASCADE** where appropriate to maintain consistency.

---

# 12. Transactions

The following operations should execute inside a database transaction:

- Creating a Research Session
- Saving extracted products
- Saving related images
- Saving related tags
- Saving product statistics
- Saving AI analysis
- Saving report metadata

This ensures that partially completed writes do not leave the database in an inconsistent state.

---

# 13. Index Strategy

Indexes should be created only for fields used frequently in lookups.

Required indexes:

- research_sessions.keyword
- research_sessions.started_at
- research_sessions.status
- products.session_id
- products.product_url
- product_images.product_id
- product_tags.product_id
- product_tags.tag
- ai_analysis.session_id
- reports.session_id

No additional indexes are required for Version 0.1.

---

# 14. Database Constraints

The database must enforce the following constraints:

- Every Product must belong to a valid Research Session.
- Every Product Image must belong to a valid Product.
- Every Product Tag must belong to a valid Product.
- Every Statistics record must belong to a valid Product.
- Every AI Analysis must belong to a valid Research Session.
- Every Report must belong to a valid Research Session.

These constraints ensure referential integrity and prevent orphaned records.

---

# 15. Database Scope

The Version 0.1 database is intentionally minimal. It stores only the data required to execute the complete research workflow:

**Research Session → Products → Product Details → AI Analysis → HTML Report**

It does not include unrelated concepts such as users, authentication, permissions, scheduling, marketplace publishing, or analytics. The schema is designed to remain simple, predictable, and aligned with the MVP goals while providing a solid foundation for the rest of the application.
