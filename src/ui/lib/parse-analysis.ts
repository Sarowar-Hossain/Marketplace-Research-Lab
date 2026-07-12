// One parsed section of the AI analysis response. The prompt (src/ai/prompt.ts)
// requests numbered sections ("1. Niche Summary", "2. Recurring Themes", …);
// this splits the response on those headers so each can render as its own card.
// When the response does not follow the numbered format, the whole response is
// returned as a single section so nothing is lost.
export type AnalysisSection = {
  title: string;
  body: string;
};

const SECTION_HEADER = /^\s*(\d+)[.)]\s+(.+?)\s*$/;

export function parseAnalysis(response: string): AnalysisSection[] {
  const lines = response.split('\n');
  const sections: AnalysisSection[] = [];
  let current: AnalysisSection | null = null;

  for (const line of lines) {
    const match = line.match(SECTION_HEADER);
    if (match) {
      if (current) sections.push(current);
      const title = match[2].replace(/[:.\-_]+$/, '').trim();
      current = { title, body: '' };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);

  const cleaned = sections
    .map((section) => ({ title: section.title, body: section.body.trim() }))
    .filter((section) => section.body.length > 0);

  if (cleaned.length > 0) return cleaned;
  const trimmed = response.trim();
  return trimmed ? [{ title: 'Analysis', body: trimmed }] : [];
}
