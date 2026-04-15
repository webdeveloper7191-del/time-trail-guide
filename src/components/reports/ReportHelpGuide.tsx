import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb, BarChart3, Target, AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HelpSection {
  title: string;
  content: string;
}

export interface ReportMetric {
  label: string;
  description: string;
  interpretation: string;
  goodRange?: string;
  warningRange?: string;
  criticalRange?: string;
}

interface ReportHelpGuideProps {
  reportName: string;
  reportDescription: string;
  purpose: string;
  whenToUse: string[];
  keyMetrics: ReportMetric[];
  howToRead: HelpSection[];
  actionableInsights: string[];
  relatedReports?: string[];
}

export function ReportHelpGuide({
  reportName,
  reportDescription,
  purpose,
  whenToUse,
  keyMetrics,
  howToRead,
  actionableInsights,
  relatedReports,
}: ReportHelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-xs h-8 border-dashed"
      >
        <BookOpen className="h-3.5 w-3.5" />
        How to Read This Report
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {isOpen && (
        <Card className="mt-3 border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-5 space-y-5">
            {/* Header */}
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {reportName} — Guide
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{reportDescription}</p>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" /> Purpose
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{purpose}</p>
            </div>

            {/* When to Use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> When to Use This Report
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

            {/* Key Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary" /> Key Metrics Explained
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {keyMetrics.map((metric, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-3 bg-background">
                    <p className="text-xs font-semibold text-foreground">{metric.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{metric.description}</p>
                    <p className="text-[11px] text-foreground/80 mt-1 italic">{metric.interpretation}</p>
                    {(metric.goodRange || metric.warningRange || metric.criticalRange) && (
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {metric.goodRange && <Badge variant="default" className="text-[10px] h-5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">✓ {metric.goodRange}</Badge>}
                        {metric.warningRange && <Badge variant="secondary" className="text-[10px] h-5 bg-amber-100 text-amber-700 hover:bg-amber-100">⚠ {metric.warningRange}</Badge>}
                        {metric.criticalRange && <Badge variant="destructive" className="text-[10px] h-5">✗ {metric.criticalRange}</Badge>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* How to Read Sections */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" /> How to Read Each Section
              </h4>
              {howToRead.map((section, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-background">
                  <button
                    className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
                    onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                  >
                    {section.title}
                    {expandedSection === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expandedSection === i && (
                    <div className="px-3 pb-3 pt-0">
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actionable Insights */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> What to Do With These Insights
              </h4>
              <ul className="space-y-1">
                {actionableInsights.map((insight, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="font-semibold text-foreground min-w-[16px]">{i + 1}.</span>
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Related Reports */}
            {relatedReports && relatedReports.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <h4 className="text-xs font-semibold text-muted-foreground">Related Reports</h4>
                <div className="flex flex-wrap gap-1.5">
                  {relatedReports.map((report, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{report}</Badge>
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
