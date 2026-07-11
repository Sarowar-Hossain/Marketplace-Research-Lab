# 004 — Domain Model & Core Business Entities

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the complete business domain model for Marketplace Research Lab.

It establishes the canonical business entities, their responsibilities, relationships, ownership boundaries, and lifecycle.

This is **not** a database design document.

It is the conceptual model that every subsystem—including storage, AI analysis, report generation, and future APIs—must follow.

All future implementations must treat these entities as the canonical representation of marketplace research data.

---

# 2. Domain Overview

Marketplace Research Lab models a research session as a deterministic business process.

The workflow transforms one keyword into structured marketplace intelligence.

```text
Keyword
    │
    ▼
Research Session
    │
    ▼
Marketplace Search
    │
    ▼
Products
    │
    ▼
Extracted Data
    │
    ▼
AI Analysis
    │
    ▼
Research Report
```

Every entity in the system exists to support this workflow.

---

# 3. Aggregate Root

The entire domain revolves around a single Aggregate Root.

```
Research Session
```

Everything produced during research belongs to exactly one Research Session.

Nothing exists independently.

Examples:

- Products belong to a Research Session.
- AI Analysis belongs to a Research Session.
- Reports belong to a Research Session.
- Images belong to Products.
- Tags belong to Products.

This ownership model simplifies lifecycle management and future deletion.

---

# 4. Core Business Entities

Version 0.1 contains the following domain entities.

| Entity                 | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| Research Session       | Represents one complete research execution        |
| Keyword                | User input and normalized search term             |
| Marketplace            | Metadata describing the target marketplace        |
| Search Result          | Represents marketplace search output              |
| Product                | Canonical representation of a marketplace listing |
| Product Image          | Product image metadata                            |
| Product Tag            | Marketplace tags                                  |
| Product Statistics     | Quantitative product information                  |
| Product Classification | AI and system-derived classifications             |
| AI Analysis            | Complete AI output                                |
| Research Report        | Generated HTML report                             |
| Configuration Snapshot | Configuration used during the session             |

---

# 5. Research Session

## Purpose

Represents one complete execution of the research pipeline.

Every other entity belongs to exactly one Research Session.

---

## Responsibilities

- Track execution lifecycle
- Own all collected data
- Record timestamps
- Record execution status
- Store execution metadata
- Link all downstream entities

---

## Lifecycle

```
Created

↓

Initialized

↓

Searching

↓

Collecting

↓

Extracting

↓

Normalizing

↓

Analyzing

↓

Generating Report

↓

Completed
```

or

```
Failed
```

---

## Ownership

Research Session owns:

- Keyword
- Search Result
- Products
- AI Analysis
- Reports
- Logs
- Configuration Snapshot

---

# 6. Keyword

## Purpose

Represents the normalized keyword requested by the user.

Example

```
Dog Mom
```

The Keyword entity should preserve:

- Original input
- Normalized version
- Validation result

Future versions may include:

- language
- locale
- synonyms
- semantic variations

---

# 7. Marketplace

## Purpose

Represents the marketplace being researched.

Version 0.1 supports only Redbubble.

However, the domain model intentionally treats marketplaces as first-class entities.

Future examples:

```
Redbubble

Etsy

Amazon

TeePublic

Spreadshirt
```

This prevents marketplace-specific assumptions from leaking into the rest of the domain.

---

# 8. Search Result

Represents the immediate output returned by marketplace search.

Responsibilities

- searched keyword
- discovered products
- search timestamp
- search metadata

Search Results are temporary discovery objects.

They should not contain detailed product information.

Detailed information belongs to Product.

---

# 9. Product

## Purpose

Represents one marketplace listing.

Product is the most important entity after Research Session.

Product should represent the business concept of a listing rather than HTML.

A Product should remain valid even if the marketplace website changes.

---

## Product owns

- Images
- Tags
- Statistics
- Extracted Metadata
- AI Classification

---

## Product should never own

- HTML
- Playwright objects
- DOM nodes
- CSS selectors

Those belong to the extraction layer only.

---

# 10. Product Image

Represents one image belonging to a Product.

Responsibilities

- local path
- original URL
- image dimensions
- image order
- checksum
- download status

Images should remain filesystem assets.

The database stores metadata only.

---

# 11. Product Tag

Represents one marketplace tag.

Tags should remain normalized.

Examples

```
dog mom

gift

pet lover
```

Responsibilities

- original value
- normalized value
- source marketplace

Future versions may include

- semantic cluster
- keyword score
- search volume

---

# 12. Product Statistics

Represents measurable information extracted from the marketplace.

Examples include

- price
- currency
- favorites
- product type
- availability

Only objective measurements belong here.

AI-derived conclusions belong elsewhere.

---

# 13. Product Classification

Represents structured knowledge derived by the application.

Examples

```
Audience

Occasion

Design Style

Color Palette

Typography

Illustration Style

Complexity

Seasonality
```

Classification may be generated using deterministic rules, AI, or a combination of both.

This entity exists to separate facts from interpretations.

---

# 14. AI Analysis

Represents the complete reasoning generated by the AI provider.

AI Analysis should never overwrite extracted data.

Instead it should reference Products and produce higher-level intelligence.

Examples

- niche summary
- recurring themes
- keyword opportunities
- buyer intent
- competition observations
- design trends
- strategic recommendations

AI Analysis should always remain reproducible.

Inputs and outputs should be traceable.

---

# 15. Research Report

Represents the final deliverable produced by the system.

A report is immutable.

Once generated it becomes a historical artifact.

Future regeneration should produce a new version rather than modifying an existing report.

---

# 16. Configuration Snapshot

Every Research Session should preserve the configuration used during execution.

Examples

- AI provider
- AI model
- timeout values
- extraction options
- report template version

This ensures historical reproducibility.

---

# 17. Entity Relationships

```
Research Session
│
├── Keyword
│
├── Marketplace
│
├── Search Result
│
├── Products
│      │
│      ├── Images
│      ├── Tags
│      ├── Statistics
│      └── Classification
│
├── AI Analysis
│
├── Report
│
└── Configuration Snapshot
```

This relationship hierarchy must remain stable throughout the lifetime of Version 0.1.

---

# 18. Domain Ownership Rules

Ownership rules are mandatory.

Research Session owns Products.

Products own Images.

Products own Tags.

Products own Statistics.

Products own Classification.

Reports never own Products.

AI never owns Products.

The AI references Products but never modifies them.

---

# 19. Immutable vs Mutable Entities

## Immutable

- Report
- Configuration Snapshot

---

## Mostly Immutable

- Product
- Images
- Tags

Once extracted they should rarely change.

---

## Mutable

- Research Session Status
- AI Analysis (until completed)

---

# 20. Domain Invariants

The following rules must always hold true.

A Product must belong to exactly one Research Session.

A Tag cannot exist without a Product.

An Image cannot exist without a Product.

AI Analysis cannot exist without a Research Session.

A Report cannot exist without a completed Research Session.

Configuration Snapshot must be created before research execution begins.

These invariants should be enforced by the application, not left to chance.

---

# 21. Domain Boundaries

The domain model must never contain implementation-specific objects.

Forbidden examples include:

- Playwright `Page`
- Playwright `Locator`
- Browser instances
- HTML documents
- CSS selectors
- SQL queries
- SQLite connections
- File handles
- AI SDK responses

These belong to the infrastructure layer and must be transformed into domain entities before entering the business domain.

---

# 22. Future Expansion

The domain model has been intentionally designed so that Version 0.1 can evolve without breaking existing concepts.

Future entities may include:

- Marketplace Profile
- Historical Snapshot
- Trend Analysis
- Vision Analysis
- Color Cluster
- Typography Analysis
- Competitor Group
- Product Similarity
- Keyword Cluster
- Opportunity Score
- Market Trend
- User Notes
- Export Package

These should be introduced as new entities rather than altering the responsibilities of existing ones.

---

# 23. Definition of Domain Completeness

The domain model is considered complete when every piece of business information generated by the research workflow can be represented by one of the defined entities without exposing implementation details.

The domain model should remain stable even if the application changes its UI framework, database technology, AI provider, or marketplace extraction mechanism. This separation ensures that the business concepts outlive the underlying technical implementation and provides a durable foundation for all future versions of Marketplace Research Lab.
