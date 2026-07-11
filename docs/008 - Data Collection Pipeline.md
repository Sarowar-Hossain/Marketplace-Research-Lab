# 008 — Data Collection Pipeline

**Project Name:** Marketplace Research Lab

**Version:** 0.1 MVP

**Document Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the complete data collection workflow for Marketplace Research Lab Version 0.1.

The Data Collection Pipeline is responsible for transforming a user keyword into structured marketplace data.

Its responsibilities include:

- Searching Redbubble
- Discovering products
- Visiting product pages
- Extracting structured information
- Validating extracted data
- Normalizing collected data
- Persisting the results

The pipeline ends immediately after all extracted data has been successfully stored in the local database.

AI analysis and report generation are outside the scope of this document.

---

# 2. Pipeline Overview

The complete pipeline follows the sequence below.

```text
User Keyword
      │
      ▼
Validate Keyword
      │
      ▼
Search Redbubble
      │
      ▼
Collect Product URLs
      │
      ▼
Visit Product Pages
      │
      ▼
Extract Product Data
      │
      ▼
Validate Data
      │
      ▼
Normalize Data
      │
      ▼
Save Database
      │
      ▼
Pipeline Complete
```

Every stage must complete successfully before moving to the next stage.

---

# 3. Pipeline Objectives

The pipeline must:

- Produce deterministic structured data.
- Avoid duplicate product records within a research session.
- Preserve extraction consistency.
- Handle temporary failures gracefully.
- Isolate marketplace-specific logic from the rest of the application.

The pipeline is **not** responsible for generating insights or reports.

---

# 4. Pipeline Stages

The pipeline consists of seven sequential stages.

1. Keyword Validation
2. Marketplace Search
3. Product Discovery
4. Product Extraction
5. Data Validation
6. Data Normalization
7. Data Persistence

Each stage has a single responsibility.

---

# 5. Stage 1 — Keyword Validation

## Purpose

Validate the keyword provided by the user before any browser activity begins.

---

## Responsibilities

- Remove leading whitespace.
- Remove trailing whitespace.
- Collapse repeated spaces into a single space.
- Ensure the keyword is not empty.

---

## Input

```text
Dog Mom
```

---

## Output

```text
Dog Mom
```

The validated keyword becomes the input for the Marketplace Search stage.

---

# 6. Stage 2 — Marketplace Search

## Purpose

Open Redbubble and perform a search using the validated keyword.

---

## Responsibilities

- Launch Playwright.
- Navigate to the Redbubble search page.
- Perform the keyword search.
- Wait until search results have fully loaded.

---

## Output

A fully loaded Redbubble search results page.

No product information is extracted during this stage.

---

# 7. Stage 3 — Product Discovery

## Purpose

Identify the products displayed on the search results page.

---

## Responsibilities

- Read the search results.
- Identify individual product listings.
- Collect the product URLs.
- Ignore duplicate URLs.

---

## Output

A list of unique product URLs.

Example:

```text
Product 1 URL

Product 2 URL

Product 3 URL
```

No product details are extracted during this stage.

---

# 8. Stage 4 — Product Extraction

## Purpose

Visit each discovered product page and extract structured information.

---

## Responsibilities

For each product:

- Open the product page.
- Wait until the page has fully loaded.
- Extract required fields.
- Convert extracted information into domain objects.

---

## Required Product Data

The following information should be collected whenever available.

### Basic Information

- Product title
- Product URL
- Artist name
- Product description
- Product type

---

### Pricing

- Price
- Currency

---

### Images

- Product image URLs

---

### Tags

- Product tags

---

No AI analysis is performed during extraction.

---

# 9. Extraction Rules

The extraction layer should:

- Read only visible marketplace information.
- Ignore decorative page elements.
- Ignore advertisements.
- Ignore unrelated navigation components.

Only information belonging to the product itself should be extracted.

---

# 10. Stage 5 — Data Validation

## Purpose

Verify that extracted information is usable before storage.

---

## Responsibilities

Required fields should be checked for completeness.

Examples include:

- Product title
- Product URL

If required information is missing, the product should be skipped and the reason recorded in the application log.

Validation should never modify extracted values.

---

# 11. Stage 6 — Data Normalization

## Purpose

Transform validated data into the application's canonical format.

---

## Responsibilities

### Text

- Trim whitespace.
- Normalize line endings.
- Preserve original capitalization where appropriate.

---

### URLs

Ensure product URLs are stored as absolute URLs.

---

### Tags

Normalize tag formatting consistently.

No semantic interpretation is performed during normalization.

---

# 12. Stage 7 — Data Persistence

## Purpose

Persist normalized data to the local SQLite database.

---

## Responsibilities

Store:

- Research Session
- Products
- Product Images
- Product Tags
- Product Statistics

Each product should be associated with the current Research Session.

---

# 13. Error Handling

Failures should be isolated whenever possible.

Examples include:

### Search Failure

If the search page cannot be loaded:

- Stop the pipeline.
- Record the failure.
- Notify the user.

---

### Product Extraction Failure

If one product cannot be extracted:

- Skip that product.
- Record the error.
- Continue processing the remaining products.

---

### Database Failure

If data cannot be saved:

- Stop the pipeline.
- Roll back the current transaction.
- Record the error.

---

# 14. Retry Strategy

Temporary browser or network failures may occur.

The pipeline should retry failed navigation a limited number of times before considering the operation unsuccessful.

Retries should be performed only for recoverable failures.

Validation failures should not be retried.

---

# 15. Duplicate Handling

Duplicate product URLs discovered during the same research session should be ignored.

Each product should be processed only once per session.

Duplicate detection should occur before product extraction begins.

---

# 16. Browser Lifecycle

A single Playwright browser instance should be used for the entire research session.

The browser should remain open while all product pages are processed.

Once all extraction has completed, the browser should be closed gracefully.

---

# 17. Data Integrity

Only validated and normalized data should be written to the database.

Invalid or incomplete records should never be partially stored.

Database writes should occur inside transactions to ensure consistency.

---

# 18. Pipeline Completion

The Data Collection Pipeline is considered complete when:

- The keyword has been successfully searched.
- Product URLs have been collected.
- Each product has been processed.
- Structured product data has been validated.
- Normalized data has been stored successfully.
- Browser resources have been released.

At this point, control returns to the Research Engine, which proceeds to the next stage of the overall application workflow (AI analysis), as defined in the system architecture.
