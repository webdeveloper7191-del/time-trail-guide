import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  User,
  Link2,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockObjectives } from '@/data/mockOKRData';
import type { Objective, KeyResult, OKRStatus } from '@/types/okr';

interface EmployeeOKRPanelProps {
  currentUserId: string;
}

// Pastel color palette
const pastelColors = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-100' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-100' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-100' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', accent: 'bg-slate-100' },
};

const getStatusPastel = (status: OKRStatus) => {
  switch (status) {
    case 'on_track': return pastelColors.green;
    case 'at_risk': return pastelColors.rose;
    case 'completed': return pastelColors.blue;
    case 'active': return pastelColors.amber;
    default: return pastelColors.slate;
  }
};

const getLevelPastel = (level: string) => {
  switch (level) {
    case 'company': return pastelColors.purple;
    case 'team': return pastelColors.blue;
    case 'individual': return pastelColors.green;
    default: return pastelColors.slate;
  }
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'company': return Building2;
    case 'team': return Users;
    case 'individual': return User;
    default: return Target;
  }
};

const getProgressColor = (progress: number, status: OKRStatus) => {
  if (status === 'completed' || progress >= 100) return 'bg-emerald-500';
  if (status === 'at_risk' || progress < 30) return 'bg-rose-500';
  if (progress >= 70) return 'bg-emerald-500';
  if (progress >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
};

export function EmployeeOKRPanel({ currentUserId }: EmployeeOKRPanelProps) {
  const [expandedObjectives, setExpandedObjectives] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [objectives, setObjectives] = useState(mockObjectives);
  const [editingKR, setEditingKR] = useState<string | null>(null);

  // Filter to show individual objectives for this user
  const myObjectives = objectives.filter(o => o.level === 'individual');
  const teamObjectives = objectives.filter(o => o.level === 'team');
  const companyObjectives = objectives.filter(o => o.level === 'company');

  // Stats
  const stats = {
    total: myObjectives.length,
    onTrack: myObjectives.filter(o => o.status === 'on_track' || o.status === 'completed').length,
    atRisk: myObjectives.filter(o => o.status === 'at_risk').length,
    avgProgress: myObjectives.length > 0 
      ? Math.round(myObjectives.reduce((sum, o) => sum + o.progress, 0) / myObjectives.length)
      : 0,
  };

  const toggleExpand = (id: string) => {
    setExpandedObjectives(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateKeyResult = (objectiveId: string, krId: string, newValue: number) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const updatedKRs = obj.keyResults.map(kr => {
        if (kr.id !== krId) return kr;
        const progress = Math.round((newValue / kr.targetValue) * 100);
        return { ...kr, currentValue: newValue, progress: Math.min(progress, 100) };
      });
      
      const avgProgress = Math.round(
        updatedKRs.reduce((sum, kr) => sum + kr.progress, 0) / updatedKRs.length
      );
      
      const newStatus: OKRStatus = avgProgress >= 100 ? 'completed' : avgProgress >= 70 ? 'on_track' : 'at_risk';
      
      return { 
        ...obj, 
        keyResults: updatedKRs, 
        progress: avgProgress,
        status: newStatus,
      };
    }));
    setEditingKR(null);
  };

  const renderObjectiveCard = (objective: Objective) => {
    const isExpanded = expandedObjectives.includes(objective.id);
    const statusPastel = getStatusPastel(objective.status);
    const levelPastel = getLevelPastel(objective.level);
    const LevelIcon = getLevelIcon(objective.level);
    const parentObjective = objective.parentObjectiveId 
      ? objectives.find(o => o.id === objective.parentObjectiveId)
      : null;

    return (
      <Card 
        key={objective.id} 
        className={cn(
          "overflow-hidden transition-all duration-200 hover:shadow-md",
          `border-l-4`,
          objective.status === 'on_track' || objective.status === 'completed' ? 'border-l-emerald-400' :
          objective.status === 'at_risk' ? 'border-l-rose-400' : 'border-l-amber-400'
        )}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div 
            className="p-4 cursor-pointer"
            onClick={() => toggleExpand(objective.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn("text-xs gap-1", levelPastel.bg, levelPastel.text, levelPastel.border, "border")}>
                    <LevelIcon className="h-3 w-3" />
                    {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)}
                  </Badge>
                  <Badge className={cn("text-xs", statusPastel.bg, statusPastel.text, statusPastel.border, "border")}>
                    {objective.status === 'on_track' ? 'On Track' : 
                     objective.status === 'at_risk' ? 'At Risk' :
                     objective.status === 'completed' ? 'Completed' : 
                     objective.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </div>
                <h4 className="font-semibold text-foreground mb-1">{objective.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">{objective.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "text-2xl font-bold",
                  objective.progress >= 70 ? 'text-emerald-600' :
                  objective.progress >= 40 ? 'text-amber-600' : 'text-rose-600'
                )}>
                  {objective.progress}%
                </p>
                <p className="text-xs text-muted-foreground">{objective.keyResults.length} Key Results</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getProgressColor(objective.progress, objective.status))}
                  style={{ width: `${objective.progress}%` }}
                />
              </div>
            </div>

            {/* Expand toggle */}
            <div className="flex items-center justify-center mt-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Expanded Key Results */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-border bg-muted/30">
              {parentObjective && (
                <div className="mt-3 p-3 rounded-lg bg-violet-50 border border-violet-200 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-violet-600" />
                  <span className="text-sm text-violet-700">
                    Aligned to: <strong>{parentObjective.title}</strong>
                  </span>
                </div>
              )}
              
              <div className="mt-4 space-y-3">
                {objective.keyResults.map((kr) => (
                  <div 
                    key={kr.id} 
                    className="p-3 rounded-lg bg-background border border-border"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium flex-1">{kr.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium">
                          {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                        </span>
                        <Badge className={cn(
                          "text-xs",
                          kr.progress >= 70 ? cn(pastelColors.green.bg, pastelColors.green.text) :
                          kr.progress >= 40 ? cn(pastelColors.amber.bg, pastelColors.amber.text) :
                          cn(pastelColors.rose.bg, pastelColors.rose.text)
                        )}>
                          {kr.progress}%
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingKR(editingKR === kr.id ? null : kr.id);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressColor(kr.progress, objective.status))}
                        style={{ width: `${kr.progress}%` }}
                      />
                    </div>

                    {/* Quick update slider */}
                    {editingKR === kr.id && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-700 mb-2">Update progress:</p>
                        <Slider
                          value={[kr.currentValue]}
                          min={kr.startValue}
                          max={kr.targetValue}
                          step={1}
                          onValueChange={(val) => updateKeyResult(objective.id, kr.id, val[0])}
                          className="mb-2"
                        />
                        <p className="text-xs text-center text-blue-600 font-medium">
                          {kr.currentValue} / {kr.targetValue} {kr.unit}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards with pastel colors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("border", pastelColors.purple.bg, pastelColors.purple.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">My OKRs</p>
                <p className={cn("text-2xl font-bold", pastelColors.purple.text)}>{stats.total}</p>
              </div>
              <Target className={cn("h-8 w-8 opacity-50", pastelColors.purple.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.green.bg, pastelColors.green.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">On Track</p>
                <p className={cn("text-2xl font-bold", pastelColors.green.text)}>{stats.onTrack}</p>
              </div>
              <TrendingUp className={cn("h-8 w-8 opacity-50", pastelColors.green.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.rose.bg, pastelColors.rose.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">At Risk</p>
                <p className={cn("text-2xl font-bold", pastelColors.rose.text)}>{stats.atRisk}</p>
              </div>
              <AlertTriangle className={cn("h-8 w-8 opacity-50", pastelColors.rose.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.blue.bg, pastelColors.blue.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Progress</p>
                <p className={cn("text-2xl font-bold", pastelColors.blue.text)}>{stats.avgProgress}%</p>
              </div>
              <CheckCircle2 className={cn("h-8 w-8 opacity-50", pastelColors.blue.text)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OKR Tabs */}
      <Tabs defaultValue="my-okrs">
        <TabsList>
          <TabsTrigger value="my-okrs" className="gap-2">
            <User className="h-4 w-4" /> My OKRs ({myObjectives.length})
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" /> Team ({teamObjectives.length})
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" /> Company ({companyObjectives.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-okrs" className="mt-6 space-y-4">
          {myObjectives.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-medium">No OKRs assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your personal objectives will appear here once created
                </p>
              </CardContent>
            </Card>
          ) : (
            myObjectives.map(renderObjectiveCard)
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-6 space-y-4">
          {teamObjectives.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-medium">No team OKRs</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Team objectives will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            teamObjectives.map(renderObjectiveCard)
          )}
        </TabsContent>

        <TabsContent value="company" className="mt-6 space-y-4">
          {companyObjectives.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-medium">No company OKRs</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Company-wide objectives will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            companyObjectives.map(renderObjectiveCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
