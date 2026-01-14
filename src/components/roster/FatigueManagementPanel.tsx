import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Clock,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  FatigueScore,
  FatigueViolation,
  FatigueRule,
  fatigueRiskColors,
} from '@/types/advancedRoster';
import { StaffMember, Shift } from '@/types/roster';
import { calculateAllFatigueScores, defaultFatigueRules } from '@/lib/fatigueCalculator';

// Mock data
const mockFatigueScores: FatigueScore[] = [
  {
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    currentScore: 35,
    riskLevel: 'low',
    factors: [
      { factor: 'Weekly Hours', contribution: 15, details: '38 of 40 max hours' },
      { factor: 'Consecutive Days', contribution: 10, details: '4 of 6 max days' },
      { factor: 'Night Shifts', contribution: 5, details: '0 night shifts this week' },
      { factor: 'Rest Between Shifts', contribution: 5, details: 'Avg 14 hours rest' },
    ],
    lastUpdated: new Date().toISOString(),
    recommendations: ['Schedule maintained well within limits'],
    projectedScoreNextWeek: 40,
  },
  {
    staffId: 'staff-2',
    staffName: 'Michael Chen',
    currentScore: 62,
    riskLevel: 'moderate',
    factors: [
      { factor: 'Weekly Hours', contribution: 25, details: '44 of 40 max hours (overtime)' },
      { factor: 'Consecutive Days', contribution: 20, details: '5 of 6 max days' },
      { factor: 'Night Shifts', contribution: 10, details: '2 night shifts this week' },
      { factor: 'Rest Between Shifts', contribution: 7, details: 'Avg 11 hours rest' },
    ],
    lastUpdated: new Date().toISOString(),
    recommendations: [
      'Consider reducing hours next week',
      'Ensure minimum 10 hours rest between shifts',
    ],
    projectedScoreNextWeek: 55,
  },
  {
    staffId: 'staff-3',
    staffName: 'Emma Williams',
    currentScore: 78,
    riskLevel: 'high',
    factors: [
      { factor: 'Weekly Hours', contribution: 30, details: '48 of 40 max hours (overtime)' },
      { factor: 'Consecutive Days', contribution: 25, details: '6 of 6 max days' },
      { factor: 'Night Shifts', contribution: 15, details: '4 night shifts this week' },
      { factor: 'Rest Between Shifts', contribution: 8, details: 'Avg 9 hours rest' },
    ],
    lastUpdated: new Date().toISOString(),
    recommendations: [
      'URGENT: Schedule rest day immediately',
      'Reduce night shifts next roster',
      'Review workload distribution',
    ],
    projectedScoreNextWeek: 70,
  },
  {
    staffId: 'staff-4',
    staffName: 'David Liu',
    currentScore: 92,
    riskLevel: 'critical',
    factors: [
      { factor: 'Weekly Hours', contribution: 35, details: '52 of 40 max hours' },
      { factor: 'Consecutive Days', contribution: 30, details: '7 consecutive days' },
      { factor: 'Night Shifts', contribution: 20, details: '5 night shifts' },
      { factor: 'Rest Between Shifts', contribution: 7, details: 'One 8-hour gap detected' },
    ],
    lastUpdated: new Date().toISOString(),
    recommendations: [
      'CRITICAL: Immediate intervention required',
      'Cancel next scheduled shift',
      'Mandatory 48-hour rest period',
      'Manager review required',
    ],
    projectedScoreNextWeek: 85,
  },
];

const mockViolations: FatigueViolation[] = [
  {
    id: 'viol-1',
    staffId: 'staff-4',
    staffName: 'David Liu',
    violationType: 'consecutive_days',
    severity: 'critical',
    description: 'Exceeded maximum consecutive work days',
    currentValue: 7,
    limitValue: 6,
    shiftIds: ['shift-1', 'shift-2', 'shift-3'],
    detectedAt: new Date().toISOString(),
    acknowledged: false,
  },
  {
    id: 'viol-2',
    staffId: 'staff-3',
    staffName: 'Emma Williams',
    violationType: 'weekly_hours',
    severity: 'violation',
    description: 'Exceeded maximum weekly hours',
    currentValue: 48,
    limitValue: 40,
    shiftIds: ['shift-4', 'shift-5'],
    detectedAt: new Date().toISOString(),
    acknowledged: true,
    acknowledgedBy: 'admin',
  },
  {
    id: 'viol-3',
    staffId: 'staff-4',
    staffName: 'David Liu',
    violationType: 'rest_break',
    severity: 'warning',
    description: 'Insufficient rest between shifts',
    currentValue: 8,
    limitValue: 10,
    shiftIds: ['shift-6', 'shift-7'],
    detectedAt: new Date().toISOString(),
    acknowledged: false,
  },
];

const mockRules: FatigueRule[] = [
  {
    id: 'rule-1',
    name: 'Standard Fatigue Management',
    description: 'Default fatigue rules based on Fair Work guidelines',
    maxConsecutiveDays: 6,
    maxWeeklyHours: 40,
    minRestBetweenShifts: 10,
    maxNightShiftsConsecutive: 3,
    nightShiftStart: '22:00',
    nightShiftEnd: '06:00',
    fatigueScoreThreshold: 80,
    isActive: true,
  },
];

interface FatigueManagementPanelProps {
  staff?: StaffMember[];
  shifts?: Shift[];
}

export function FatigueManagementPanel({ staff, shifts }: FatigueManagementPanelProps) {
  const [scores] = useState(mockFatigueScores);
  const [violations, setViolations] = useState(mockViolations);
  const [selectedStaff, setSelectedStaff] = useState<FatigueScore | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success('Fatigue scores recalculated');
  };

  const handleAcknowledge = (violationId: string) => {
    setViolations(prev =>
      prev.map(v =>
        v.id === violationId ? { ...v, acknowledged: true, acknowledgedBy: 'admin' } : v
      )
    );
    toast.success('Violation acknowledged');
  };

  const getRiskBadge = (level: FatigueScore['riskLevel']) => {
    return <Badge className={fatigueRiskColors[level]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Badge>;
  };

  const getSeverityBadge = (severity: FatigueViolation['severity']) => {
    switch (severity) {
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-700">Warning</Badge>;
      case 'violation':
        return <Badge className="bg-orange-500/10 text-orange-700">Violation</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-700">Critical</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-emerald-600';
    if (score < 60) return 'text-amber-600';
    if (score < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const criticalCount = scores.filter(s => s.riskLevel === 'critical').length;
  const highCount = scores.filter(s => s.riskLevel === 'high').length;
  const unacknowledgedViolations = violations.filter(v => !v.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Fatigue Management</CardTitle>
                <CardDescription>
                  Monitor staff fatigue levels and ensure compliance with rest requirements
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recalculate
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alert Banner */}
      {(criticalCount > 0 || unacknowledgedViolations > 0) && (
        <Card className="card-material border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Immediate Attention Required</p>
                <p className="text-sm text-red-700">
                  {criticalCount} staff at critical fatigue level, {unacknowledgedViolations} unacknowledged violations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {scores.filter(s => s.riskLevel === 'low').length}
                </p>
                <p className="text-sm text-muted-foreground">Low Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {scores.filter(s => s.riskLevel === 'moderate').length}
                </p>
                <p className="text-sm text-muted-foreground">Moderate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{highCount}</p>
                <p className="text-sm text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{violations.length}</p>
                <p className="text-sm text-muted-foreground">Violations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="card-material">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Active Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violations.map(violation => (
                <div
                  key={violation.id}
                  className={`p-4 rounded-lg border ${
                    violation.acknowledged ? 'bg-muted/30' : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {violation.severity === 'critical' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : violation.severity === 'violation' ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        ) : (
                          <Info className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{violation.staffName}</p>
                          {getSeverityBadge(violation.severity)}
                          {violation.acknowledged && (
                            <Badge variant="secondary">Acknowledged</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {violation.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Current: {violation.currentValue} | Limit: {violation.limitValue}
                        </p>
                      </div>
                    </div>
                    {!violation.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(violation.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Fatigue Scores */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Staff Fatigue Scores</CardTitle>
          <CardDescription>
            Real-time fatigue monitoring based on hours, consecutive days, and rest periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Fatigue Score</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Key Factors</TableHead>
                <TableHead>Projection</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores
                .sort((a, b) => b.currentScore - a.currentScore)
                .map(score => (
                  <TableRow key={score.staffId}>
                    <TableCell>
                      <p className="font-medium">{score.staffName}</p>
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-lg font-bold ${getScoreColor(score.currentScore)}`}>
                            {score.currentScore}
                          </span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                        <Progress
                          value={score.currentScore}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getRiskBadge(score.riskLevel)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {score.factors.slice(0, 2).map((f, i) => (
                          <p key={i} className="text-muted-foreground">
                            {f.factor}: +{f.contribution}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {score.projectedScoreNextWeek < score.currentScore ? (
                          <TrendingDown className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{score.projectedScoreNextWeek}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStaff(score)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Detail Sheet */}
      <Sheet open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedStaff && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStaff.staffName}</SheetTitle>
                <SheetDescription>Fatigue Analysis Details</SheetDescription>
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                {/* Score Summary */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Score</p>
                        <p className={`text-4xl font-bold ${getScoreColor(selectedStaff.currentScore)}`}>
                          {selectedStaff.currentScore}
                        </p>
                      </div>
                      <div>{getRiskBadge(selectedStaff.riskLevel)}</div>
                    </div>
                    <Progress value={selectedStaff.currentScore} className="h-3 mt-4" />
                  </CardContent>
                </Card>

                {/* Contributing Factors */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Contributing Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedStaff.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{factor.factor}</p>
                            <p className="text-xs text-muted-foreground">{factor.details}</p>
                          </div>
                          <Badge variant="outline">+{factor.contribution}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedStaff.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Projection */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Next Week</p>
                        <p className="text-2xl font-bold">{selectedStaff.projectedScoreNextWeek}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedStaff.projectedScoreNextWeek < selectedStaff.currentScore ? (
                          <>
                            <TrendingDown className="h-5 w-5 text-emerald-500" />
                            <span className="text-emerald-600">Improving</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-5 w-5 text-red-500" />
                            <span className="text-red-600">Worsening</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedStaff(null)}>
                  Close
                </Button>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
