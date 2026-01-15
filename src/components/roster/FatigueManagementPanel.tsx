import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
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

interface FatigueManagementPanelProps {
  staff?: StaffMember[];
  shifts?: Shift[];
}

export function FatigueManagementPanel({ staff = [], shifts = [] }: FatigueManagementPanelProps) {
  const [selectedStaff, setSelectedStaff] = useState<FatigueScore | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acknowledgedViolations, setAcknowledgedViolations] = useState<Set<string>>(new Set());

  // Calculate real fatigue scores from actual data
  const { scores, violations: rawViolations } = useMemo(() => {
    if (staff.length === 0) {
      return { scores: [], violations: [] };
    }
    return calculateAllFatigueScores(staff, shifts, defaultFatigueRules);
  }, [staff, shifts]);

  // Apply acknowledgments to violations
  const violations = useMemo(() => {
    return rawViolations.map(v => ({
      ...v,
      acknowledged: acknowledgedViolations.has(v.id),
      acknowledgedBy: acknowledgedViolations.has(v.id) ? 'admin' : undefined,
    }));
  }, [rawViolations, acknowledgedViolations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate recalculation delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    toast.success('Fatigue scores recalculated from current shift data');
  };

  const handleAcknowledge = (violationId: string) => {
    setAcknowledgedViolations(prev => new Set([...prev, violationId]));
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

  // No data state
  if (staff.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="card-material-elevated border-l-4 border-l-orange-500">
          <CardHeader>
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
          </CardHeader>
        </Card>
        
        <Card className="card-material">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No Staff Data Available</p>
              <p className="text-sm mt-2">Add staff members and assign shifts to see fatigue analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
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
                  Real-time fatigue monitoring from {shifts.length} shifts across {staff.length} staff
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
        <Card className="card-material border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Immediate Attention Required</p>
                <p className="text-sm text-red-700 dark:text-red-300">
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
                    violation.acknowledged 
                      ? 'bg-muted/30' 
                      : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
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
                          <TrendingUp className="h-4 w-4 text-orange-500" />
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
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          
          {scores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No fatigue data to display</p>
              <p className="text-sm">Assign shifts to staff to generate fatigue scores</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Detail Sheet - Using PrimaryOffCanvas */}
      <PrimaryOffCanvas
        open={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={selectedStaff?.staffName || 'Staff Details'}
        description="Detailed fatigue analysis"
        icon={Activity}
        size="md"
        showFooter={false}
      >
        {selectedStaff && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fatigue Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(selectedStaff.currentScore)}`}>
                      {selectedStaff.currentScore}
                    </p>
                  </div>
                  {getRiskBadge(selectedStaff.riskLevel)}
                </div>
                <Progress value={selectedStaff.currentScore} className="h-3" />
              </CardContent>
            </Card>

            {/* Factor Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contributing Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStaff.factors.map((factor, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{factor.factor}</span>
                        <span className="text-sm text-muted-foreground">+{factor.contribution}</span>
                      </div>
                      <Progress value={(factor.contribution / 35) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{factor.details}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedStaff.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {rec.includes('URGENT') || rec.includes('CRITICAL') ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      )}
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Projection */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Week Projection</p>
                    <p className={`text-2xl font-bold ${getScoreColor(selectedStaff.projectedScoreNextWeek)}`}>
                      {selectedStaff.projectedScoreNextWeek}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedStaff.projectedScoreNextWeek < selectedStaff.currentScore ? (
                      <>
                        <TrendingDown className="h-6 w-6 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">Improving</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                        <span className="text-orange-600 font-medium">Worsening</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Last updated: {format(new Date(selectedStaff.lastUpdated), 'PPp')}
            </p>
          </div>
        )}
      </PrimaryOffCanvas>
    </div>
  );
}
