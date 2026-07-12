// Result of Stage 1 keyword validation (Doc 008 §5). A valid result carries the
// normalized keyword; an invalid result carries the reason. The Research Engine
// decides how the workflow reacts — this function never throws.
export type KeywordValidationResult =
  | { valid: true; keyword: string }
  | { valid: false; reason: string };

// Upper bound keeps unbounded input out of search URLs and the database; real
// marketplace keywords are far shorter.
const MAX_KEYWORD_LENGTH = 200;

// Keyword Validation stage (Doc 008 §5): runs before any browser activity.
// Trims the input, collapses whitespace sequences into single spaces, and
// rejects keywords that are empty after normalization. Pure logic — no
// logging, no dependencies, no semantic analysis.
export function validateKeyword(keyword: string): KeywordValidationResult {
  const normalized = keyword.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) {
    return { valid: false, reason: 'keyword is empty' };
  }
  if (normalized.length > MAX_KEYWORD_LENGTH) {
    return { valid: false, reason: 'keyword is too long' };
  }
  return { valid: true, keyword: normalized };
}
