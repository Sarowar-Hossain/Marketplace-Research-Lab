# Detailed Implementation Plan — Redbubble Research Improvements v2

**Status:** Awaiting approval
**Source:** Senior Redbubble seller review + verified URLs + full product-page UI capture (2026-07-12)
**Scope:** Improve research *result quality* — make the output actionable for sellers, not just descriptive.

---

## Part 1 — The Seller's Perspective (Why)

### 1.1 The two core problems with current research

| Problem | Effect |
|---|---|
| Search uses the default **Relevant** sort across **all product types** | Stickers dominate and pollute the data; the AI analyzes "what exists," not "what sells"; a t-shirt seller gets sticker-market conclusions |
| No demand signal is captured | Every product looks equally important; a #1 top seller and an invisible listing carry the same weight in the analysis |

### 1.2 What the professional workflow looks like

```
Step 1  Broad scan        — keyword, all products, relevant  → landscape, saturation, dominant types
Step 2  Narrow + demand   — SAME keyword, MY product type (e.g. t-shirts), TOP SELLING sort
                            → study the top 20–40: styles, typography, colors, prices, winning tags
Step 3  Long-tail         — 3–5 keyword variations, compare saturation vs demand
Step 4  Velocity check    — RECENT sort: is competition flooding in, or is there a gap?
```

The software must support **Step 2 first** — that is where the money data lives.

### 1.3 Demand & competition signals available on Redbubble (from the live product page)

The product page UI capture confirms what is and is not available:

| Signal | Visible on page? | Value to seller |
|---|---|---|
| **Top-Selling rank** (position in sorted results) | ✅ implicit in result order | **Primary demand proxy** — position #3 in top-selling ≈ 3rd best seller for that query |
| Star ratings / review counts | ❌ **not shown** on the product page UI | Demoted to "extract only if present in JSON-LD" — do not build the plan on it |
| **Artist design count** ("20,958 designs") | ✅ visible | Competition strength — a 20k-design artist is a professional operation |
| **"View this design on +40 products"** | ✅ visible | Cross-product availability — maps directly to our existing (empty) `available_products` column |
| **On-page tag lists** ("T-Shirts Tags" + "All Product Tags") | ✅ visible, as links | Richer and more accurate than meta-keywords — these are the listing's real SEO tags |
| Artist name ("Designed and sold by rafaeltto") | ✅ visible + in URL slug (`…-by-Chloe43212/…`) | Reliable artist extraction (URL slug is the most stable source) |
| Price + bulk price ("$23.96 when you buy any 3+") | ✅ | Base price analysis (bulk price out of scope) |
| Trending topics strip | ✅ | Site-wide trend hints (Wave 2 candidate) |

---

## Part 2 — The Engineer's Perspective (How)

### 2.1 Verified URL contract

| Purpose | URL (verified by product owner) |
|---|---|
| Default search | `https://www.redbubble.com/shop?query=dog%20mom%20gift&ref=search_box` |
| Filter: t-shirts | `https://www.redbubble.com/shop?iaCode=u-tees&query=dog%20mom` |
| Sort: top selling (all types) | `https://www.redbubble.com/shop?iaCode=all-departments&sortOrder=top%20selling&includeMatureContent=false&query=dog%20mom` |
| Filter + sort combined | `https://www.redbubble.com/shop?iaCode=u-tees&sortOrder=top%20selling&includeMatureContent=false&query=dog%20mom` |
| Product page pattern | `https://www.redbubble.com/i/t-shirt/<Slug>-by-<Artist>/<id>/<variant>` |

Parameters: `iaCode` (category), `sortOrder` (`top selling`, presumed `relevant`/`recent`), `includeMatureContent` (**`false` per the verified URLs**), `query`.

**Known iaCodes:** `all-departments`, `u-tees`. All other category codes (stickers, hoodies, mugs, phone cases, posters, sweatshirts) must be **harvested in the Wave 0 spike** — never guessed.

### 2.2 Extraction source inventory (per product page)

| Field | Primary source | Fallback |
|---|---|---|
| title | JSON-LD `name` | `og:title`, doc title (suffix-stripped) — *existing* |
| price / currency | JSON-LD `offers` | — *existing* |
| **artistName** | **URL slug `-by-<artist>/`** (new, most stable) | JSON-LD brand/author, og:title "for Sale by" — *existing* |
| productType | URL `/i/<type>/` — *existing* | JSON-LD category |
| **tags** | **On-page tag-list sections** (new; anchors under the tags blocks, spike locates a stable structural selector — likely by href pattern `/shop/…`, not CSS classes) | JSON-LD keywords, meta keywords — *existing* |
| **topSellingRank** | Discovery order (already preserved) — becomes meaningful once sort = top selling | — |
| **availableProducts** | "available on +N products" text (spike verifies stability) | null |
| **artistDesignCount** | "N designs" text near artist (spike verifies stability) | null |
| rating / reviewCount | JSON-LD `aggregateRating` **if present** (UI suggests absent) | null |
| totalResults (search page) | "X results" text (spike verifies) | null |

### 2.3 Architecture impact (boundaries unchanged)

- All new extraction stays inside `src/marketplace/` (Playwright confinement intact).
- Search options flow: **UI dropdowns → IPC → Application → runner options → engine deps → facade → search**; every hop is an injected value — no module learns anything it should not know.
- AI prompt changes are contained in `src/ai/prompt.ts`.
- Report metrics are computed at generation time in `src/reports/generate.ts` from stored rows (pure presentation aggregation).

### 2.4 Schema impact (requires Decision A)

| Table | New columns | Reason |
|---|---|---|
| `research_sessions` | `product_type TEXT NULL`, `sort_order TEXT NULL`, `total_results INTEGER NULL` | Report header + saturation metric; reproducibility of what was searched |
| `product_statistics` | `rank INTEGER NULL`, `artist_design_count INTEGER NULL`, `rating REAL NULL`, `review_count INTEGER NULL` | Demand + competition signals; `available_products` column **already exists** and finally gets real data |

Mechanism: guarded `ALTER TABLE` inside `createSchema` (checks `PRAGMA table_info` first — idempotent initialization, **not** a migration framework). Alternative: delete the dev database and let the fresh schema apply.

---

## Part 3 — Implementation Waves

### Wave 0 — Verification Spike (throwaway, ~30 min, ≤8 polite requests)

1. Harvest **iaCodes** for the dropdown categories from the search page's category filter links.
2. Confirm `sortOrder` accepted values (`relevant`, `top selling`, `recent`).
3. Product page: confirm presence/absence of JSON-LD `aggregateRating`; locate stable anchors for **tag-list sections**, **"+N products"**, **"N designs"**.
4. Search page: locate the **"X results"** count.

**Rule:** anything the spike cannot verify ships disabled, not guessed.

---

### Wave 1 — Core Improvements

#### R1 — Product-Type Filter + Sort Order
- `search.ts`: `searchKeyword(page, keyword, logger, options)` with `{ iaCode, sortOrder }` → verified URL format, `includeMatureContent=false`.
- `collect.ts`: `SearchOptions` passthrough + `PRODUCT_CATEGORIES` map (from spike).
- `engine.ts` / `bootstrap.ts` / `research-service.ts` / `main.ts` (IPC) / `app.tsx`: thread options end to end.
- **UI:** two dropdowns beside the keyword — *Product Type* (default: All Departments) and *Sort* (**default: Top Selling**; Relevant; Recent).
- **Acceptance:** exact-URL fixture tests for every combination; end-to-end pass-through verified; live smoke returns type-filtered results.

#### R2 — Demand & Competition Signals
- `discovery.ts`: attach `rank` (1-based position) to each `ProductReference` — free, order already preserved.
- `extraction.ts`: artist from URL slug (primary); on-page tag lists (structural selector from spike) merged ahead of meta keywords; `availableProducts`, `artistDesignCount`, and `aggregateRating` fields **if the spike confirms sources** — all nullable, missing data never fails extraction.
- `search.ts`: capture `totalResults` if the spike found a stable source.
- `persistence.ts`: write `product_statistics` row per product (rank + confirmed signals); session columns per Decision A.
- **Acceptance:** fixture tests per source + fallback; rank stored 1..N in collection order; live smoke shows real artist names from slugs and real tag lists.

#### R3 — Seller-Focused AI Prompt
- `prompt.ts`: inputs gain target product type, sort order, per-product **rank**, artist strength, availability; computed aggregates included.
- Requested output becomes:
  1. **Niche Summary**
  2. **Design Briefs** — 3–5 concrete, differentiated design ideas
  3. **Recommended Tags** — 15–25, ranked by frequency among top-ranked products
  4. **Title Formulas** — structures observed in winners (weighted by rank)
  5. **Saturation Verdict** — exactly one of `ENTER` / `ENTER WITH DIFFERENT ANGLE` / `SKIP`, with reasoning
  6. **Differentiation Strategy** — vs. the current top sellers
  7. **Buyer Intent & Trends** (condensed)
- **Acceptance:** determinism test; prompt contains rank/context; live run yields the verdict format.

#### R4 — Report Metrics Panel
- `generate.ts`: new **Market Metrics** section — total results (if captured), price min/median/max, unique-artist count, artist-dominance note (top artist's share of results), avg artist design count, products analyzed; product cards show **Top-Selling Rank** badge and artist.
- **Acceptance:** metrics math unit-tested; report renders rank-ordered.

#### R5 — Scraping Politeness
- `collect.ts`: jittered 800–1500 ms delay between product pages. Session shape stays `1 search → N product pages → done`.

---

### Wave 2 — Backlog (planned separately after Wave 1 is used in anger)

- **Multi-keyword comparison** — 3–5 variations in one session, comparison table (saturation / price / competition / demand), polite pacing between searches.
- **Recent-sort trend velocity** — upload-recency analysis for competition direction.
- **Trending-topics capture** from product pages (site-wide signals).
- Image downloading (report thumbnails) — carried over from earlier backlog.

---

## Part 4 — Decisions Required Before Coding

| # | Decision | Recommendation |
|---|---|---|
| **A** | Schema additions (2.4) via guarded ALTER vs fresh dev DB | Guarded ALTER — safe on both fresh and existing databases |
| **B** | v1 dropdown categories | All Departments, T-Shirts, Stickers, Hoodies, Sweatshirts, Mugs, Phone Cases, Posters — locked by spike-harvested iaCodes |
| **C** | Include `recent` in the sort dropdown now | Yes (free once R1 exists); the *velocity analysis* stays Wave 2 |
| **D** | `includeMatureContent` | Fixed `false` (matches verified URLs); revisit as a setting later if needed |
| **E** | AI output sections as in R3 | As listed |
| **F** | Rank-as-demand-proxy replaces review-count as the primary signal (reviews kept only if JSON-LD carries them) | Yes — grounded in the verified UI |

---

## Part 5 — Verification & Rollout

1. **Wave 0 spike** → findings reported before any production code.
2. Implement R1–R5; **existing 54 tests stay green**; ~12 new tests (URL matrix, rank, slug-artist, tag-section fixtures, metrics math, schema guard, prompt shape).
3. **Live end-to-end:** `dog mom` × T-Shirts × Top Selling → report with rank badges, artist data, metrics panel, and the seller-focused AI sections.
4. Wave 2 planned only after Wave 1 has produced real research sessions.

**Scope estimate:** ~9 files modified, 0 new dependencies, 1 schema decision (A).
