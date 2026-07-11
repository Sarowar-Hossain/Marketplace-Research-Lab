import type { Logger } from 'pino';
import type { ExtractedProduct } from './extraction';

// Result of validating an extracted product (Doc 008 §10). A valid result
// carries the unchanged product; an invalid result carries the missing-field
// reasons. Validation never modifies extracted values.
export type ValidationResult =
  | { valid: true; product: ExtractedProduct }
  | { valid: false; reasons: string[] };

// A field is considered present only if it is a non-empty string once trimmed.
// The value itself is never modified — trimming is used for the check only.
function isPresent(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

// Data Validation stage (Doc 008 §10): confirm the required fields (title, URL)
// are present before storage. Missing required data is recoverable: the product
// is reported invalid and logged as skipped (WARN), never thrown.
export function validateProduct(product: ExtractedProduct, logger: Logger): ValidationResult {
  const reasons: string[] = [];
  if (!isPresent(product.title)) {
    reasons.push('missing title');
  }
  if (!isPresent(product.url)) {
    reasons.push('missing url');
  }

  if (reasons.length > 0) {
    logger.warn({ operation: 'validation', reasons }, 'Product skipped');
    return { valid: false, reasons };
  }

  return { valid: true, product };
}
