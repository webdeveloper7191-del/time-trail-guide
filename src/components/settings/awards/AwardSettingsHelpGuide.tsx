import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, Target, ListChecks, AlertTriangle } from 'lucide-react';

export interface HelpGuideProps {
  /** Module title (shown in the header) */
  title: string;
  /** Short summary of what the module does */
  summary: string;
  /** Why the module exists / business purpose */
  purpose: string;
  /** When/why a user would visit this tab */
  whenToUse: string[];
  /** Step-by-step or feature highlights */
  howItWorks: string[];
  /** Things to be careful about */
  bestPractices?: string[];
  /** Cross-links to related tabs to avoid overlap confusion */
  relatedTabs?: string[];
}

/**
 * Reusable collapsible help guide shown at the top of each Awards settings panel.
 * Keeps the surface clean by default while giving users on-demand context.
 */
export function AwardSettingsHelpGuide({
  title,
  summary,
  purpose,
  whenToUse,
  howItWorks,
  bestPractices,
  relatedTabs,
}: HelpGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2 h-8 text-xs border-dashed"
      >
        <BookOpen className="h-3.5 w-3.5" />
        How this works
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {open && (
        <Card className="mt-3 border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{summary}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" /> Purpose
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{purpose}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> When to use
              </h4>
              <ul className="space-y-1">
                {whenToUse.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5 text-primary" /> How it works
              </h4>
              <ol className="space-y-1">
                {howItWorks.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="font-semibold text-foreground min-w-[16px]">{i + 1}.</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {bestPractices && bestPractices.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Best practices
                </h4>
                <ul className="space-y-1">
                  {bestPractices.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">!</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {relatedTabs && relatedTabs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <h4 className="text-xs font-semibold text-muted-foreground">Related tabs</h4>
                <div className="flex flex-wrap gap-1.5">
                  {relatedTabs.map((tab, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{tab}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
