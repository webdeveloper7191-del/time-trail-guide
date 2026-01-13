import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Flag,
  Lightbulb,
  BarChart3,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, Centre } from '@/types/roster';
import { generateForecast, ForecastSummary, formatCurrency } from '@/lib/labourForecasting';
import { format, parseISO } from 'date-fns';

interface LabourCostForecastingProps {
  shifts: Shift[];
  staff: StaffMember[];
  centre: Centre;
  weeklyBudget: number;
  onClose?: () => void;
}

export function LabourCostForecasting({
  shifts,
  staff,
  centre,
  weeklyBudget,
  onClose,
}: LabourCostForecastingProps) {
  const [forecastWeeks, setForecastWeeks] = useState(4);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const forecast = useMemo(() => {
    return generateForecast(shifts, staff, centre, forecastWeeks, weeklyBudget);
  }, [shifts, staff, centre, forecastWeeks, weeklyBudget]);

  const selectedWeekData = selectedWeek !== null 
    ? forecast.weeks.find(w => w.weekNumber === selectedWeek) 
    : null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Labour Cost Forecasting
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[2, 4, 8].map(weeks => (
                <Button
                  key={weeks}
                  size="sm"
                  variant={forecastWeeks === weeks ? 'default' : 'outline'}
                  onClick={() => setForecastWeeks(weeks)}
                  className="text-xs h-7 px-2"
                >
                  {weeks}w
                </Button>
              ))}
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Projected Cost</div>
            <div className="text-lg font-bold">{formatCurrency(forecast.totalProjectedCost)}</div>
            <div className="text-xs text-muted-foreground">{forecastWeeks} weeks</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Avg Weekly</div>
            <div className="text-lg font-bold">{formatCurrency(forecast.avgWeeklyCost)}</div>
            <div className={cn(
              "text-xs flex items-center gap-1",
              forecast.avgWeeklyCost > weeklyBudget ? "text-destructive" : "text-emerald-600"
            )}>
              {forecast.avgWeeklyCost > weeklyBudget ? (
                <><TrendingUp className="h-3 w-3" /> Over budget</>
              ) : (
                <><TrendingDown className="h-3 w-3" /> On track</>
              )}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total Hours</div>
            <div className="text-lg font-bold">{forecast.totalProjectedHours.toFixed(0)}h</div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(forecast.avgHourlyCost)}/hr avg
            </div>
          </div>
          <div className={cn(
            "rounded-lg p-3",
            forecast.isOverBudget ? "bg-destructive/10" : "bg-emerald-500/10"
          )}>
            <div className="text-xs text-muted-foreground">Budget Variance</div>
            <div className={cn(
              "text-lg font-bold",
              forecast.isOverBudget ? "text-destructive" : "text-emerald-600"
            )}>
              {forecast.isOverBudget ? '+' : ''}{formatCurrency(forecast.projectedVariance)}
            </div>
            <div className="text-xs text-muted-foreground">
              {forecast.percentVariance > 0 ? '+' : ''}{forecast.percentVariance.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Period Budget Usage</span>
            <span className="font-medium">
              {formatCurrency(forecast.totalProjectedCost)} / {formatCurrency(forecast.periodBudget)}
            </span>
          </div>
          <Progress 
            value={Math.min(100, (forecast.totalProjectedCost / forecast.periodBudget) * 100)} 
            className={cn(
              "h-2",
              forecast.isOverBudget && "[&>div]:bg-destructive"
            )}
          />
        </div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="risks">Risks & Advice</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {forecast.weeks.map((week) => (
                  <div
                    key={week.weekNumber}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedWeek === week.weekNumber ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                      week.vsBudget.isOverBudget && "border-destructive/30"
                    )}
                    onClick={() => setSelectedWeek(selectedWeek === week.weekNumber ? null : week.weekNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          Week {week.weekNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(week.weekStart), 'MMM d')} - {format(parseISO(week.weekEnd), 'MMM d')}
                        </div>
                        {week.days.some(d => d.isPublicHoliday) && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            <Flag className="h-3 w-3 mr-1" />
                            Public Holiday
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{formatCurrency(week.totalCost)}</div>
                          <div className={cn(
                            "text-xs",
                            week.vsBudget.isOverBudget ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {week.vsBudget.isOverBudget ? '+' : ''}{formatCurrency(week.vsBudget.variance)}
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          selectedWeek === week.weekNumber && "rotate-90"
                        )} />
                      </div>
                    </div>

                    {/* Expanded week details */}
                    {selectedWeek === week.weekNumber && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-7 gap-1">
                          {week.days.map(day => (
                            <div 
                              key={day.date}
                              className={cn(
                                "p-1.5 rounded text-center text-xs",
                                day.isPublicHoliday && "bg-destructive/10",
                                day.isSchoolHoliday && !day.isPublicHoliday && "bg-amber-500/10"
                              )}
                            >
                              <div className="font-medium">{day.dayOfWeek.slice(0, 3)}</div>
                              <div className="text-muted-foreground">{formatCurrency(day.totalProjectedCost)}</div>
                              <div className="text-[10px] text-muted-foreground">{day.projectedHours.toFixed(1)}h</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Peak: {week.peakDay} ({formatCurrency(week.peakDayCost)})</span>
                          <span>Confidence: {(week.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(forecast.byDayType).map(([key, data]) => (
                  <div key={key} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <Badge variant="outline" className="text-xs">
                        {data.percent.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(data.cost)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {data.hours.toFixed(1)} hours
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost per hour by day type */}
              <div className="bg-muted/30 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Effective Hourly Rate by Day Type</h4>
                <div className="space-y-2">
                  {Object.entries(forecast.byDayType).map(([key, data]) => {
                    const effectiveRate = data.hours > 0 ? data.cost / data.hours : 0;
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{formatCurrency(effectiveRate)}/hr</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risks" className="mt-4">
            <div className="space-y-4">
              {/* Risk Factors */}
              {forecast.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risk Factors
                  </h4>
                  {forecast.riskFactors.map((risk, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border",
                        risk.severity === 'high' && "border-destructive/50 bg-destructive/5",
                        risk.severity === 'medium' && "border-amber-500/50 bg-amber-500/5",
                        risk.severity === 'low' && "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium">{risk.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Estimated impact: {formatCurrency(risk.estimatedImpact)}
                          </div>
                        </div>
                        <Badge 
                          variant={risk.severity === 'high' ? 'destructive' : 'outline'}
                          className="text-xs capitalize"
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {forecast.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Recommendations
                  </h4>
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    {forecast.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {forecast.riskFactors.length === 0 && forecast.recommendations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">No significant risks identified</p>
                  <p className="text-xs">Your roster is on track for the forecast period</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
