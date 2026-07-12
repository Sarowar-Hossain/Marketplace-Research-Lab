import type { ExtractedProduct } from './extraction';

// The canonical application representation of a product (Doc 008 §11). Same
// shape as ExtractedProduct, but `title` is a required string because
// validation (Stage 5) guarantees it before normalization runs.
export type NormalizedProduct = {
  url: string;
  title: string;
  description: string | null;
  artistName: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  imageUrls: string[];
  tags: string[];
  availableProducts: number | null;
  artistDesignCount: number | null;
  // 1-based search-result position, attached by the collection facade; the
  // demand rank when the search is sorted by "top selling".
  rank: number | null;
};

// Trims leading/trailing whitespace and normalizes line endings (\r\n and lone
// \r become \n). Internal whitespace and capitalization are preserved. Returns
// null when nothing remains, so empty optional text becomes absent.
function normalizeText(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const normalized = value.replace(/\r\n?/g, '\n').trim();
  return normalized.length > 0 ? normalized : null;
}

// Trims only (no line-ending changes); empty becomes null. Used for short code
// fields such as currency.
function trimToNull(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Trims each entry, drops empties, and removes duplicates. Deduplication is
// case-sensitive so original capitalization is preserved.
function cleanStringList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

// Data Normalization stage (Doc 008 §11): transform a validated product into
// the canonical representation. Pure transformation — the input object is never
// mutated and a new object is returned. No semantic interpretation is performed.
export function normalizeProduct(product: ExtractedProduct): NormalizedProduct {
  return {
    url: product.url.trim(),
    title: normalizeText(product.title) ?? '',
    description: normalizeText(product.description),
    artistName: normalizeText(product.artistName),
    productType: trimToNull(product.productType),
    price: product.price,
    currency: trimToNull(product.currency),
    imageUrls: cleanStringList(product.imageUrls),
    tags: cleanStringList(product.tags),
    availableProducts: product.availableProducts,
    artistDesignCount: product.artistDesignCount,
    rank: null,
  };
}
