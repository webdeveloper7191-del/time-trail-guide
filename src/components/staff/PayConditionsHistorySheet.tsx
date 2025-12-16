import { StaffMember, PayCondition, employmentTypeLabels } from '@/types/staff';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, CalendarCheck, CalendarClock, DollarSign, Briefcase } from 'lucide-react';
import { format, isAfter, isBefore, isWithinInterval, addDays } from 'date-fns';

interface PayConditionsHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

export function PayConditionsHistorySheet({ open, onOpenChange, staff }: PayConditionsHistorySheetProps) {
  const today = new Date();
  
  // Categorize conditions
  const allConditions = [
    ...(staff.currentPayCondition ? [staff.currentPayCondition] : []),
    ...staff.payConditionHistory
  ];

  const upcomingConditions = allConditions.filter((c) => {
    const from = new Date(c.effectiveFrom);
    return isAfter(from, today);
  });

  const currentConditions = allConditions.filter((c) => {
    const from = new Date(c.effectiveFrom);
    const to = c.effectiveTo ? new Date(c.effectiveTo) : addDays(today, 365);
    return isWithinInterval(today, { start: from, end: to }) || (isBefore(from, today) && !c.effectiveTo);
  });

  const pastConditions = allConditions.filter((c) => {
    if (!c.effectiveTo) return false;
    const to = new Date(c.effectiveTo);
    return isBefore(to, today);
  });

  const ConditionCard = ({ condition, type }: { condition: PayCondition; type: 'upcoming' | 'current' | 'past' }) => (
    <Card className={type === 'current' ? 'border-primary/50 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant={type === 'current' ? 'default' : type === 'upcoming' ? 'secondary' : 'outline'}
            >
              {type === 'current' ? 'Active' : type === 'upcoming' ? 'Upcoming' : 'Expired'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(condition.effectiveFrom), 'dd MMM yyyy')}
              {condition.effectiveTo && ` - ${format(new Date(condition.effectiveTo), 'dd MMM yyyy')}`}
              {!condition.effectiveTo && type === 'current' && ' - Present'}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{condition.position || 'No position'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employment Type</p>
              <p className="font-medium">{employmentTypeLabels[condition.employmentType]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Classification</p>
              <p className="font-medium">{condition.classification || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hourly Rate</p>
              <p className="font-medium text-primary">${condition.hourlyRate.toFixed(2)}/hr</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contracted Hours</p>
              <p className="font-medium">{condition.contractedHours || 0} hrs/week</p>
            </div>
          </div>

          {condition.industryAward && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Industry Award</p>
              <Badge variant="outline" className="text-xs">{condition.industryAward}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <History className="h-12 w-12 mx-auto text-muted-foreground/30" />
      <p className="mt-4 text-muted-foreground">No {type} pay conditions</p>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5 text-primary" />
            Pay Conditions History
          </SheetTitle>
          <SheetDescription>
            View upcoming, current, and past pay conditions for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="current" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Upcoming
              {upcomingConditions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">{upcomingConditions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="current" className="flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5" />
              Current
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Past
              {pastConditions.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5">{pastConditions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)] mt-4">
            <TabsContent value="upcoming" className="space-y-4 mt-0">
              {upcomingConditions.length > 0 ? (
                upcomingConditions.map((c) => (
                  <ConditionCard key={c.id} condition={c} type="upcoming" />
                ))
              ) : (
                <EmptyState type="upcoming" />
              )}
            </TabsContent>

            <TabsContent value="current" className="space-y-4 mt-0">
              {currentConditions.length > 0 ? (
                currentConditions.map((c) => (
                  <ConditionCard key={c.id} condition={c} type="current" />
                ))
              ) : (
                <EmptyState type="current" />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-0">
              {pastConditions.length > 0 ? (
                pastConditions.map((c) => (
                  <ConditionCard key={c.id} condition={c} type="past" />
                ))
              ) : (
                <EmptyState type="past" />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
