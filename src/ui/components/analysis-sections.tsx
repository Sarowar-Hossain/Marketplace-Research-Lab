import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { AnalysisSection } from '../lib/parse-analysis';

// Renders each parsed AI section as its own card so the analysis is scannable
// rather than a wall of text. The report generator never modifies this output.
export function AnalysisSections({ sections }: { sections: AnalysisSection[] }) {
  if (sections.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{section.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
