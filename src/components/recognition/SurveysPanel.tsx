import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Survey, surveyStatusLabels } from '@/types/recognition';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { ClipboardList, Plus, Users, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveysPanelProps {
  surveys: Survey[];
  onCreateSurvey: () => void;
  onViewSurvey: (survey: Survey) => void;
  onTakeSurvey: (survey: Survey) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
};

export function SurveysPanel({ surveys, onCreateSurvey, onViewSurvey, onTakeSurvey }: SurveysPanelProps) {
  const activeSurveys = surveys.filter(s => s.status === 'active');
  const draftSurveys = surveys.filter(s => s.status === 'draft');
  const closedSurveys = surveys.filter(s => s.status === 'closed');

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

      {/* Active Surveys */}
      {activeSurveys.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Surveys</h3>
          {activeSurveys.map(survey => {
            const daysLeft = differenceInDays(parseISO(survey.endDate), new Date());
            const targetResponses = 5; // Mock target
            const responseRate = Math.min(100, (survey.responseCount / targetResponses) * 100);

            return (
              <Card key={survey.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                      <ClipboardList className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{survey.title}</h4>
                        <Badge className={statusColors[survey.status]}>{surveyStatusLabels[survey.status]}</Badge>
                        {survey.anonymous && <Badge variant="outline">Anonymous</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{survey.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {survey.responseCount} responses
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Ending today'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <Progress value={responseRate} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground">{Math.round(responseRate)}%</span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onTakeSurvey(survey)}>
                          Take Survey
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onViewSurvey(survey)}>
                          View Results
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Draft Surveys */}
      {draftSurveys.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Draft Surveys</h3>
          {draftSurveys.map(survey => (
            <Card key={survey.id} className="hover:shadow-sm transition-all cursor-pointer opacity-75" onClick={() => onViewSurvey(survey)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{survey.title}</h4>
                      <Badge className={statusColors[survey.status]}>{surveyStatusLabels[survey.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{survey.questions.length} questions</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {surveys.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No surveys yet</p>
            <Button variant="outline" className="mt-4" onClick={onCreateSurvey}>
              Create your first survey
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SurveysPanel;
