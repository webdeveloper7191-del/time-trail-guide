import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Survey, surveyStatusLabels } from '@/types/recognition';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ClipboardList, Plus, Users, Clock, ChevronRight, Eye, Play, MoreHorizontal } from 'lucide-react';
import { SemanticProgressBar } from '@/components/performance/shared/SemanticProgressBar';
import { StatusBadge } from '@/components/performance/shared/StatusBadge';

interface SurveysPanelProps {
  surveys: Survey[];
  onCreateSurvey: () => void;
  onViewSurvey: (survey: Survey) => void;
  onTakeSurvey: (survey: Survey) => void;
}

export function SurveysPanel({ surveys, onCreateSurvey, onViewSurvey, onTakeSurvey }: SurveysPanelProps) {
  const activeSurveys = surveys.filter(s => s.status === 'active');
  const draftSurveys = surveys.filter(s => s.status === 'draft');
  const closedSurveys = surveys.filter(s => s.status === 'closed');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'closed': return 'muted';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Surveys
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Gather feedback and insights from your team</p>
        </div>
        <Button onClick={onCreateSurvey}>
          <Plus className="h-4 w-4 mr-2" />
          Create Survey
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                <Play className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSurveys.length}</p>
                <p className="text-xs text-muted-foreground">Active Surveys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftSurveys.length}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {surveys.reduce((sum, s) => sum + s.responseCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {surveys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No surveys yet</p>
            <Button variant="outline" className="mt-4" onClick={onCreateSurvey}>
              Create your first survey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Survey</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map(survey => {
                const daysLeft = differenceInDays(parseISO(survey.endDate), new Date());
                const targetResponses = 10;
                const responseRate = Math.min(100, (survey.responseCount / targetResponses) * 100);
                const isEnding = daysLeft <= 3 && daysLeft >= 0 && survey.status === 'active';

                return (
                  <TableRow 
                    key={survey.id} 
                    className="group hover:bg-muted/50"
                    style={{
                      borderLeft: isEnding ? '3px solid hsl(var(--warning))' : undefined,
                    }}
                  >
                    <TableCell className="py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{survey.title}</p>
                          {survey.anonymous && (
                            <Badge variant="outline" className="text-xs py-0">Anonymous</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {survey.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge 
                        status={getStatusVariant(survey.status) as any}
                        label={surveyStatusLabels[survey.status]}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="font-normal">
                        {survey.questions.length} questions
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{survey.responseCount}</span>
                          <span className="text-xs text-muted-foreground">{Math.round(responseRate)}%</span>
                        </div>
                        <SemanticProgressBar value={responseRate} size="xs" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {survey.status === 'active' ? (
                            daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'
                          ) : survey.status === 'draft' ? (
                            `Starts ${format(parseISO(survey.startDate), 'MMM d')}`
                          ) : (
                            `Closed ${format(parseISO(survey.endDate), 'MMM d')}`
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(survey.startDate), 'MMM d')} – {format(parseISO(survey.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {survey.status === 'active' && (
                          <Button size="sm" variant="default" onClick={() => onTakeSurvey(survey)}>
                            Take
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => onViewSurvey(survey)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default SurveysPanel;
