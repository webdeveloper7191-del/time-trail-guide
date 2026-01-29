import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Send,
  CheckCircle2,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Meh,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPulseSurveys, mockPulseResponses } from '@/data/mockAdvancedPerformanceData';
import type { PulseSurvey, PulseQuestion } from '@/types/advancedPerformance';
import { toast } from 'sonner';

interface EmployeeSurveyPanelProps {
  currentUserId: string;
}

// Pastel color palette
const pastelColors = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
};

export function EmployeeSurveyPanel({ currentUserId }: EmployeeSurveyPanelProps) {
  const [selectedSurvey, setSelectedSurvey] = useState<PulseSurvey | null>(null);
  const [showSurveySheet, setShowSurveySheet] = useState(false);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [completedSurveys, setCompletedSurveys] = useState<string[]>(['pulse-3']);

  const activeSurveys = mockPulseSurveys.filter(s => s.status === 'active');
  const pendingSurveys = activeSurveys.filter(s => !completedSurveys.includes(s.id));
  const myCompletedSurveys = mockPulseSurveys.filter(s => completedSurveys.includes(s.id));

  const handleOpenSurvey = (survey: PulseSurvey) => {
    setSelectedSurvey(survey);
    setResponses({});
    setShowSurveySheet(true);
  };

  const handleSubmitSurvey = () => {
    if (!selectedSurvey) return;
    
    // Validate required questions
    const requiredQuestions = selectedSurvey.questions.filter(q => q.required);
    const missingRequired = requiredQuestions.some(q => responses[q.id] === undefined || responses[q.id] === '');
    
    if (missingRequired) {
      toast.error('Please answer all required questions');
      return;
    }

    setCompletedSurveys(prev => [...prev, selectedSurvey.id]);
    toast.success('Survey submitted successfully! Thank you for your feedback.');
    setShowSurveySheet(false);
    setSelectedSurvey(null);
    setResponses({});
  };

  const renderRatingQuestion = (question: PulseQuestion) => {
    const value = (responses[question.id] as number) || 0;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Not at all</span>
          <span className="text-sm text-muted-foreground">Extremely</span>
        </div>
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => setResponses(prev => ({ ...prev, [question.id]: rating }))}
              className={cn(
                "flex-1 py-3 rounded-lg border-2 transition-all text-lg font-semibold",
                value === rating 
                  ? cn(pastelColors.blue.bg, pastelColors.blue.border, pastelColors.blue.text)
                  : "bg-background border-border hover:border-blue-300"
              )}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderENPSQuestion = (question: PulseQuestion) => {
    const value = (responses[question.id] as number) ?? -1;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <ThumbsDown className="h-3 w-3" /> Not likely
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            Very likely <ThumbsUp className="h-3 w-3" />
          </span>
        </div>
        <div className="grid grid-cols-11 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
            const isDetractor = rating <= 6;
            const isPassive = rating >= 7 && rating <= 8;
            const isPromoter = rating >= 9;
            
            return (
              <button
                key={rating}
                onClick={() => setResponses(prev => ({ ...prev, [question.id]: rating }))}
                className={cn(
                  "py-2 rounded-lg border-2 transition-all text-sm font-medium",
                  value === rating 
                    ? isPromoter ? cn(pastelColors.green.bg, pastelColors.green.border, pastelColors.green.text)
                    : isPassive ? cn(pastelColors.amber.bg, pastelColors.amber.border, pastelColors.amber.text)
                    : cn(pastelColors.rose.bg, pastelColors.rose.border, pastelColors.rose.text)
                    : "bg-background border-border hover:border-blue-300"
                )}
              >
                {rating}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-xs">
          <span className={cn("px-2 py-1 rounded", pastelColors.rose.bg, pastelColors.rose.text)}>Detractor (0-6)</span>
          <span className={cn("px-2 py-1 rounded", pastelColors.amber.bg, pastelColors.amber.text)}>Passive (7-8)</span>
          <span className={cn("px-2 py-1 rounded", pastelColors.green.bg, pastelColors.green.text)}>Promoter (9-10)</span>
        </div>
      </div>
    );
  };

  const renderYesNoQuestion = (question: PulseQuestion) => {
    const value = responses[question.id];
    
    return (
      <div className="flex gap-4">
        <button
          onClick={() => setResponses(prev => ({ ...prev, [question.id]: 'yes' }))}
          className={cn(
            "flex-1 py-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium",
            value === 'yes' 
              ? cn(pastelColors.green.bg, pastelColors.green.border, pastelColors.green.text)
              : "bg-background border-border hover:border-green-300"
          )}
        >
          <ThumbsUp className="h-5 w-5" />
          Yes
        </button>
        <button
          onClick={() => setResponses(prev => ({ ...prev, [question.id]: 'no' }))}
          className={cn(
            "flex-1 py-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium",
            value === 'no' 
              ? cn(pastelColors.rose.bg, pastelColors.rose.border, pastelColors.rose.text)
              : "bg-background border-border hover:border-rose-300"
          )}
        >
          <ThumbsDown className="h-5 w-5" />
          No
        </button>
      </div>
    );
  };

  const renderTextQuestion = (question: PulseQuestion) => {
    return (
      <Textarea
        value={(responses[question.id] as string) || ''}
        onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
        placeholder="Share your thoughts..."
        rows={4}
        className="resize-none"
      />
    );
  };

  const renderSurveyCard = (survey: PulseSurvey, isCompleted: boolean = false) => {
    const colorSet = isCompleted ? pastelColors.green : pastelColors.blue;
    
    return (
      <Card 
        key={survey.id}
        className={cn(
          "transition-all hover:shadow-md cursor-pointer border",
          isCompleted ? "opacity-75" : "",
          colorSet.border
        )}
        onClick={() => !isCompleted && handleOpenSurvey(survey)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-xs", colorSet.bg, colorSet.text, colorSet.border, "border")}>
                  {survey.frequency}
                </Badge>
                {survey.anonymousResponses && (
                  <Badge variant="outline" className="text-xs">Anonymous</Badge>
                )}
              </div>
              <h4 className="font-semibold mb-1">{survey.title}</h4>
              <p className="text-sm text-muted-foreground">
                {survey.questions.length} questions
              </p>
            </div>
            <div className="flex-shrink-0">
              {isCompleted ? (
                <div className={cn("p-2 rounded-full", pastelColors.green.bg)}>
                  <CheckCircle2 className={cn("h-5 w-5", pastelColors.green.text)} />
                </div>
              ) : (
                <Button size="sm" className="gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Take Survey
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn("border", pastelColors.amber.bg, pastelColors.amber.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending</p>
                <p className={cn("text-2xl font-bold", pastelColors.amber.text)}>{pendingSurveys.length}</p>
              </div>
              <Clock className={cn("h-8 w-8 opacity-50", pastelColors.amber.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.green.bg, pastelColors.green.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                <p className={cn("text-2xl font-bold", pastelColors.green.text)}>{myCompletedSurveys.length}</p>
              </div>
              <CheckCircle2 className={cn("h-8 w-8 opacity-50", pastelColors.green.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.purple.bg, pastelColors.purple.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Available</p>
                <p className={cn("text-2xl font-bold", pastelColors.purple.text)}>{activeSurveys.length}</p>
              </div>
              <ClipboardCheck className={cn("h-8 w-8 opacity-50", pastelColors.purple.text)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> Pending ({pendingSurveys.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Completed ({myCompletedSurveys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingSurveys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mx-auto mb-4" />
                <p className="font-medium text-emerald-700">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You've completed all available surveys
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingSurveys.map(survey => renderSurveyCard(survey))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {myCompletedSurveys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-medium">No completed surveys</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your completed surveys will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            myCompletedSurveys.map(survey => renderSurveyCard(survey, true))
          )}
        </TabsContent>
      </Tabs>

      {/* Survey Sheet */}
      <Sheet open={showSurveySheet} onOpenChange={setShowSurveySheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              {selectedSurvey?.title}
            </SheetTitle>
          </SheetHeader>

          {selectedSurvey && (
            <div className="mt-6 space-y-6">
              <div className={cn("p-3 rounded-lg flex items-center gap-2", pastelColors.blue.bg)}>
                <MessageSquare className={cn("h-4 w-4", pastelColors.blue.text)} />
                <span className={cn("text-sm", pastelColors.blue.text)}>
                  {selectedSurvey.anonymousResponses ? 'Your responses are anonymous' : 'Your name will be visible to administrators'}
                </span>
              </div>

              {selectedSurvey.questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      pastelColors.purple.bg, pastelColors.purple.text
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium mb-1">
                        {question.text}
                        {question.required && <span className="text-rose-500 ml-1">*</span>}
                      </p>
                      <Badge variant="outline" className="text-xs mb-3">
                        {question.category}
                      </Badge>
                      
                      {question.type === 'rating' && renderRatingQuestion(question)}
                      {question.type === 'enps' && renderENPSQuestion(question)}
                      {question.type === 'yes_no' && renderYesNoQuestion(question)}
                      {question.type === 'text' && renderTextQuestion(question)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => setShowSurveySheet(false)}>
              Save for Later
            </Button>
            <Button onClick={handleSubmitSurvey} className="gap-2">
              <Send className="h-4 w-4" />
              Submit Survey
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
