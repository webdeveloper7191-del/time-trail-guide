import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkspaceTone = 'primary' | 'muted' | 'success' | 'warning' | 'danger';

export interface WorkspaceKpi {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  tone?: WorkspaceTone;
}

export interface WorkspaceStep {
  title: string;
  body: string;
  cta?: string;
  onClick?: () => void;
}

export interface WorkspaceAction {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ModuleWorkspaceProps {
  /** Stable key used to remember whether the guide has been dismissed. */
  storageKey: string;
  icon: React.ElementType;
  title: string;
  description: string;
  actions?: WorkspaceAction[];
  kpis?: WorkspaceKpi[];
  guideTitle?: string;
  steps?: WorkspaceStep[];
  children: React.ReactNode;
}

const toneClasses: Record<WorkspaceTone, string> = {
  primary: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]',
  danger: 'bg-destructive/10 text-destructive',
};

const DISMISS_PREFIX = 'rostered.workspaceGuide.';

/**
 * Shared presentation scaffold for module tabs:
 * plain-English header, optional 3-step "how this works" guide and a KPI strip.
 */
export function ModuleWorkspace({
  storageKey,
  icon: Icon,
  title,
  description,
  actions = [],
  kpis = [],
  guideTitle = 'New here? This is how it works',
  steps = [],
  children,
}: ModuleWorkspaceProps) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (steps.length === 0) {
      setShowGuide(false);
      return;
    }
    try {
      setShowGuide(localStorage.getItem(DISMISS_PREFIX + storageKey) !== 'dismissed');
    } catch {
      setShowGuide(true);
    }
  }, [storageKey, steps.length]);

  const dismiss = useCallback(() => {
    setShowGuide(false);
    try {
      localStorage.setItem(DISMISS_PREFIX + storageKey, 'dismissed');
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const gridCols =
    kpis.length >= 6
      ? 'md:grid-cols-3 xl:grid-cols-6'
      : kpis.length === 5
        ? 'md:grid-cols-3 xl:grid-cols-5'
        : kpis.length === 4
          ? 'md:grid-cols-4'
          : 'md:grid-cols-3';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((a) => (
              <Button key={a.label} size="sm" variant={a.variant ?? 'outline'} onClick={a.onClick}>
                {a.icon && <a.icon className="mr-2 h-4 w-4" />}
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Getting started guide */}
      {showGuide && steps.length > 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="relative p-5">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7 text-muted-foreground"
              onClick={dismiss}
              aria-label="Hide getting started"
            >
              <X className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium tracking-tight">{guideTitle}</p>
            <div className={cn('mt-3 grid gap-3', steps.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
              {steps.map((s, i) => (
                <div key={s.title} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium">{s.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                  {s.cta && s.onClick && (
                    <Button variant="link" size="sm" className="mt-1 h-auto px-0 text-xs" onClick={s.onClick}>
                      {s.cta} <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI strip */}
      {kpis.length > 0 && (
        <div className={cn('grid grid-cols-2 gap-3', gridCols)}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
                  {kpi.hint && <p className="truncate text-[11px] text-muted-foreground">{kpi.hint}</p>}
                </div>
                <span className={cn('rounded-full p-2.5', toneClasses[kpi.tone ?? 'primary'])}>
                  <kpi.icon className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}
