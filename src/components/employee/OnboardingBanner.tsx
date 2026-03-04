import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ArrowRight } from 'lucide-react';

interface OnboardingBannerProps {
  progressPct: number;
  onNavigate: () => void;
}

export function OnboardingBanner({ progressPct, onNavigate }: OnboardingBannerProps) {
  if (progressPct >= 100) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Complete your onboarding</p>
          <p className="text-xs text-muted-foreground">
            You're {progressPct}% done — finish up to get started with your team.
          </p>
          <Progress value={progressPct} className="h-1.5 mt-2 max-w-xs" />
        </div>
        <Button size="sm" onClick={onNavigate} className="shrink-0 gap-1.5">
          Continue <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
