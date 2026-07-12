import type { ComponentType } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

function ScoreRow({ label, barClass }: { label: string; barClass: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="text-faint">Soon</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel">
        <div className={`h-full w-1/3 rounded-full ${barClass}`} />
      </div>
    </div>
  );
}

// Circular Niche Score gauge placeholder (dashed ring) until AI scoring lands.
function NicheScore() {
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#374151" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="#10B981"
          strokeWidth="6"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none text-faint">—</span>
        <span className="text-[10px] text-faint">/100</span>
      </div>
    </div>
  );
}

function ComingSoonNote({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-hairline bg-panel/40 px-3 py-2 text-xs text-muted">
      <Icon className="h-3.5 w-3.5 shrink-0 text-faint" />
      <span className="text-ink">{label}</span>
      <span className="ml-auto text-faint">Coming soon</span>
    </div>
  );
}

// Sticky AI Insights summary. Scores and recommendations are placeholders
// until the seller-focused AI (structured scoring) ships; the real free-text
// analysis lives in the main column and is reached via "View Full Analysis".
export function AiInsightsPanel({ onViewAnalysis }: { onViewAnalysis: () => void }) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <h3 className="text-base font-semibold text-ink">AI Insights</h3>
      </div>

      <div className="flex items-center gap-4">
        <NicheScore />
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Niche Score</p>
          <p className="text-sm text-muted">High Potential</p>
          <p className="text-xs text-faint">Coming soon</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <ScoreRow label="Demand" barClass="bg-brand/30" />
        <ScoreRow label="Competition" barClass="bg-danger/30" />
        <ScoreRow label="Opportunity" barClass="bg-info/30" />
        <ScoreRow label="Seasonality" barClass="bg-warning/30" />
        <ScoreRow label="Trend" barClass="bg-violet/30" />
      </div>

      <ComingSoonNote icon={Sparkles} label="Recommendations" />
      <ComingSoonNote icon={CheckCircle2} label="Opportunity checklist" />

      <div className="rounded-md border border-hairline bg-panel/40 p-3 text-xs text-muted">
        AI Insight Engine is under development. Structured scores arrive with the seller-focused AI
        update.
      </div>

      <Button variant="outline" className="w-full" onClick={onViewAnalysis}>
        View Full Analysis
      </Button>
    </Card>
  );
}
