import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AppliedAllowance, 
  AllowanceType, 
  AWARD_NAMES, 
  AwardType,
  formatAllowanceRate,
  calculateAllowanceTotal 
} from '@/types/allowances';
import { 
  DollarSign, 
  Info, 
  ShieldCheck, 
  Clock, 
  Car, 
  GraduationCap, 
  UtensilsCrossed,
  Heart,
  Shirt
} from 'lucide-react';
import { format } from 'date-fns';

interface AllowancesPanelProps {
  allowances: AppliedAllowance[];
  awardType?: AwardType;
}

const getCategoryIcon = (category: AllowanceType['category']) => {
  switch (category) {
    case 'shift':
      return Clock;
    case 'clothing':
      return Shirt;
    case 'travel':
      return Car;
    case 'qualification':
      return GraduationCap;
    case 'meal':
      return UtensilsCrossed;
    case 'first_aid':
      return Heart;
    default:
      return DollarSign;
  }
};

const getCategoryColor = (category: AllowanceType['category']) => {
  switch (category) {
    case 'shift':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'clothing':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'travel':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'qualification':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'meal':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'first_aid':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function AllowancesPanel({ allowances, awardType }: AllowancesPanelProps) {
  const total = calculateAllowanceTotal(allowances);
  const taxableTotal = allowances
    .filter(a => a.allowanceType.taxable)
    .reduce((sum, a) => sum + a.total, 0);
  const superTotal = allowances
    .filter(a => a.allowanceType.superIncluded)
    .reduce((sum, a) => sum + a.total, 0);

  if (allowances.length === 0) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <DollarSign className="h-5 w-5" />
          <div>
            <p className="font-medium">No Allowances Applied</p>
            <p className="text-sm">
              {awardType 
                ? `Covered under ${AWARD_NAMES[awardType]}`
                : 'No award type specified'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Award Header */}
      {awardType && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Award Classification</p>
            <p className="text-xs text-muted-foreground">{AWARD_NAMES[awardType]}</p>
          </div>
        </div>
      )}

      {/* Allowances List */}
      <div className="space-y-2">
        {allowances.map((allowance) => {
          const Icon = getCategoryIcon(allowance.allowanceType.category);
          const colorClass = getCategoryColor(allowance.allowanceType.category);
          
          return (
            <div 
              key={allowance.id} 
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{allowance.allowanceType.name}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{allowance.allowanceType.description}</p>
                          <div className="mt-2 flex gap-2 text-xs">
                            {allowance.allowanceType.taxable && (
                              <Badge variant="outline" className="text-xs">Taxable</Badge>
                            )}
                            {allowance.allowanceType.superIncluded && (
                              <Badge variant="outline" className="text-xs">Super Included</Badge>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatAllowanceRate(allowance.allowanceType)}</span>
                    <span>×</span>
                    <span>{allowance.quantity}</span>
                    {allowance.entryDate && (
                      <>
                        <span>•</span>
                        <span>{format(new Date(allowance.entryDate), 'MMM d')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${allowance.total.toFixed(2)}</p>
                {allowance.notes && (
                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {allowance.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Taxable Amount</span>
          <span>${taxableTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Super Contribution Basis</span>
          <span>${superTotal.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total Allowances</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
