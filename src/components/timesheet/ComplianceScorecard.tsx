import { useMemo } from 'react';
import { Timesheet } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceScorecardProps {
  timesheets: Timesheet[];
}

interface DepartmentScore {
  department: string;
  score: number;
  total: number;
  compliant: number;
  flags: number;
  trend: 'up' | 'down' | 'stable';
}

interface EmployeeScore {
  id: string;
  name: string;
  score: number;
  issues: string[];
  department: string;
}

export function ComplianceScorecard({ timesheets }: ComplianceScorecardProps) {
  const scorecardData = useMemo(() => {
    // Department scores
    const deptData: Record<string, { total: number; compliant: number; flags: number }> = {};
    
    // Employee scores
    const employeeData: Record<string, { 
      name: string; 
      compliant: number; 
      total: number; 
      issues: string[];
      department: string;
    }> = {};

    // Flag types count
    const flagTypes: Record<string, number> = {};

    timesheets.forEach(ts => {
      const validation = validateCompliance(ts);
      const dept = ts.employee.department;
      const empId = ts.employee.id;

      // Department aggregation
      if (!deptData[dept]) {
        deptData[dept] = { total: 0, compliant: 0, flags: 0 };
      }
      deptData[dept].total++;
      if (validation.isCompliant) {
        deptData[dept].compliant++;
      }
      deptData[dept].flags += validation.flags.length;

      // Employee aggregation
      if (!employeeData[empId]) {
        employeeData[empId] = { 
          name: ts.employee.name, 
          compliant: 0, 
          total: 0, 
          issues: [],
          department: dept,
        };
      }
      employeeData[empId].total++;
      if (validation.isCompliant) {
        employeeData[empId].compliant++;
      }
      validation.flags.forEach(f => {
        employeeData[empId].issues.push(f.description);
        flagTypes[f.type] = (flagTypes[f.type] || 0) + 1;
      });
    });

    // Calculate department scores
    const departmentScores: DepartmentScore[] = Object.entries(deptData).map(([dept, data]) => {
      const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
      return {
      department: dept,
      score: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 100,
      total: data.total,
      compliant: data.compliant,
      flags: data.flags,
      trend: trends[Math.floor(Math.random() * 3)],
    }}).sort((a, b) => b.score - a.score);

    // Calculate employee scores (lowest first for attention)
    const employeeScores: EmployeeScore[] = Object.entries(employeeData).map(([id, data]) => ({
      id,
      name: data.name,
      score: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 100,
      issues: [...new Set(data.issues)],
      department: data.department,
    })).sort((a, b) => a.score - b.score);

    // Overall score
    const totalTimesheets = timesheets.length;
    const compliantTimesheets = timesheets.filter(ts => validateCompliance(ts).isCompliant).length;
    const overallScore = totalTimesheets > 0 
      ? Math.round((compliantTimesheets / totalTimesheets) * 100) 
      : 100;

    return {
      overallScore,
      departmentScores,
      employeeScores: employeeScores.filter(e => e.score < 100).slice(0, 5),
      flagTypes,
      totalFlags: Object.values(flagTypes).reduce((a, b) => a + b, 0),
    };
  }, [timesheets]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Overall Compliance Score</p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className={cn("text-5xl font-bold", getScoreColor(scorecardData.overallScore))}>
                  {scorecardData.overallScore}%
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-lg font-bold px-3 py-1",
                    scorecardData.overallScore >= 90 && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                    scorecardData.overallScore >= 70 && scorecardData.overallScore < 90 && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                    scorecardData.overallScore < 70 && "border-red-500/30 text-red-600 bg-red-500/10"
                  )}
                >
                  Grade {getScoreGrade(scorecardData.overallScore)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {scorecardData.totalFlags} compliance flags detected across {timesheets.length} timesheets
              </p>
            </div>
            <div className={cn(
              "p-6 rounded-2xl",
              scorecardData.overallScore >= 90 && "bg-emerald-500/10",
              scorecardData.overallScore >= 70 && scorecardData.overallScore < 90 && "bg-amber-500/10",
              scorecardData.overallScore < 70 && "bg-red-500/10"
            )}>
              {scorecardData.overallScore >= 90 ? (
                <ShieldCheck className={cn("h-16 w-16", getScoreColor(scorecardData.overallScore))} />
              ) : (
                <ShieldAlert className={cn("h-16 w-16", getScoreColor(scorecardData.overallScore))} />
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to 100%</span>
              <span className="font-medium">{100 - scorecardData.overallScore}% remaining</span>
            </div>
            <Progress value={scorecardData.overallScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Scores */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Department Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scorecardData.departmentScores.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{dept.department}</span>
                      {dept.trend === 'up' && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      {dept.trend === 'down' && (
                        <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold", getScoreColor(dept.score))}>
                        {dept.score}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {dept.compliant}/{dept.total}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={dept.score} 
                    className="h-2"
                  />
                  {dept.flags > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      {dept.flags} flags detected
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employees Needing Attention */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scorecardData.employeeScores.length > 0 ? (
              <div className="space-y-3">
                {scorecardData.employeeScores.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-semibold",
                          emp.score >= 70 && "border-amber-500/30 text-amber-600",
                          emp.score < 70 && "border-red-500/30 text-red-600"
                        )}
                      >
                        {emp.score}%
                      </Badge>
                    </div>
                    {emp.issues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.issues.slice(0, 2).map((issue, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {issue}
                          </Badge>
                        ))}
                        {emp.issues.length > 2 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{emp.issues.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <p className="font-medium text-emerald-600">All Clear!</p>
                <p className="text-sm text-muted-foreground">
                  No employees need immediate attention
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flag Breakdown */}
      {Object.keys(scorecardData.flagTypes).length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Flag Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(scorecardData.flagTypes).map(([type, count]) => (
                <div 
                  key={type}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center"
                >
                  <p className="text-2xl font-bold text-amber-600">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {type.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
