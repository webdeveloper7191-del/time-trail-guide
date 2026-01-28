import React, { useState, useMemo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  Circle,
  Lock,
  FileText,
  Video,
  HelpCircle,
  ExternalLink,
  Clock,
  ChevronRight,
  ChevronLeft,
  Award,
  AlertCircle,
  RefreshCw,
  MousePointer,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Course, 
  CourseModule, 
  ModuleContent, 
  Enrollment,
  Assessment,
  AssessmentQuestion,
  contentTypeLabels,
  difficultyLabels,
  difficultyColors,
} from '@/types/lms';
import { toast } from 'sonner';

interface CoursePlayerProps {
  open: boolean;
  course: Course | null;
  enrollment: Enrollment | null;
  onClose: () => void;
  onProgressUpdate: (enrollmentId: string, moduleId: string, contentId: string, completed: boolean) => void;
  onModuleComplete: (enrollmentId: string, moduleId: string) => void;
  onAssessmentSubmit: (enrollmentId: string, assessmentId: string, answers: Record<string, string | string[]>) => Promise<{ score: number; passed: boolean }>;
  onCourseComplete: (enrollmentId: string) => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  interactive: <MousePointer className="h-4 w-4" />,
  external_link: <ExternalLink className="h-4 w-4" />,
  scorm: <FileText className="h-4 w-4" />,
  webinar: <Video className="h-4 w-4" />,
};

export function CoursePlayer({
  open,
  course,
  enrollment,
  onClose,
  onProgressUpdate,
  onModuleComplete,
  onAssessmentSubmit,
  onCourseComplete,
}: CoursePlayerProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string | string[]>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<{ score: number; passed: boolean } | null>(null);

  const currentModule = course?.modules[currentModuleIndex];
  const currentContent = currentModule?.content[currentContentIndex];
  
  const moduleProgress = useMemo(() => {
    if (!enrollment || !currentModule) return { completed: 0, total: 0 };
    const mp = enrollment.moduleProgress.find(p => p.moduleId === currentModule.id);
    return {
      completed: mp?.completedContentIds.length || 0,
      total: currentModule.content.length,
    };
  }, [enrollment, currentModule]);

  const overallProgress = useMemo(() => {
    if (!enrollment || !course) return 0;
    const totalContent = course.modules.reduce((sum, m) => sum + m.content.length, 0);
    const completedContent = enrollment.moduleProgress.reduce(
      (sum, mp) => sum + mp.completedContentIds.length, 0
    );
    return Math.round((completedContent / totalContent) * 100);
  }, [enrollment, course]);

  const isContentCompleted = useCallback((contentId: string) => {
    if (!enrollment || !currentModule) return false;
    const mp = enrollment.moduleProgress.find(p => p.moduleId === currentModule.id);
    return mp?.completedContentIds.includes(contentId) || false;
  }, [enrollment, currentModule]);

  const isModuleLocked = useCallback((module: CourseModule) => {
    if (!module.unlockAfterModuleId) return false;
    const prereqModule = enrollment?.moduleProgress.find(p => p.moduleId === module.unlockAfterModuleId);
    return prereqModule?.status !== 'completed';
  }, [enrollment]);

  const handleContentComplete = () => {
    if (!enrollment || !currentModule || !currentContent) return;
    
    if (!isContentCompleted(currentContent.id)) {
      onProgressUpdate(enrollment.id, currentModule.id, currentContent.id, true);
      toast.success('Content completed!');
    }
    
    // Auto-advance to next content
    if (currentContentIndex < currentModule.content.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
    } else if (currentModule.assessment && !assessmentSubmitted) {
      setShowAssessment(true);
    } else {
      // Module complete
      onModuleComplete(enrollment.id, currentModule.id);
      
      // Check if course is complete
      if (currentModuleIndex === course!.modules.length - 1) {
        onCourseComplete(enrollment.id);
        toast.success('🎉 Course completed! Certificate earned.');
      } else {
        setCurrentModuleIndex(prev => prev + 1);
        setCurrentContentIndex(0);
        toast.success('Module completed! Moving to next module.');
      }
    }
  };

  const handleAssessmentSubmit = async () => {
    if (!enrollment || !currentModule?.assessment) return;
    
    const result = await onAssessmentSubmit(enrollment.id, currentModule.assessment.id, assessmentAnswers);
    setAssessmentResult(result);
    setAssessmentSubmitted(true);
    
    if (result.passed) {
      toast.success(`Assessment passed with ${result.score}%!`);
    } else {
      toast.error(`Assessment not passed. Score: ${result.score}%. Required: ${currentModule.assessment.passingScore}%`);
    }
  };

  const handleRetryAssessment = () => {
    setAssessmentAnswers({});
    setAssessmentSubmitted(false);
    setAssessmentResult(null);
  };

  const navigateToContent = (moduleIdx: number, contentIdx: number) => {
    const module = course?.modules[moduleIdx];
    if (module && !isModuleLocked(module)) {
      setCurrentModuleIndex(moduleIdx);
      setCurrentContentIndex(contentIdx);
      setShowAssessment(false);
      setAssessmentSubmitted(false);
      setAssessmentResult(null);
      setAssessmentAnswers({});
    }
  };

  if (!course || !enrollment) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col" side="right">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{course.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs", difficultyColors[course.difficulty])}>
                  {difficultyLabels[course.difficulty]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {overallProgress}% complete
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Progress value={overallProgress} className="h-2 mt-3" />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Module Navigation */}
          <div className="w-72 border-r bg-muted/20 overflow-hidden flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-medium text-sm">Course Content</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {course.modules.map((module, mIdx) => {
                  const locked = isModuleLocked(module);
                  const mp = enrollment.moduleProgress.find(p => p.moduleId === module.id);
                  const isComplete = mp?.status === 'completed';
                  const isActive = mIdx === currentModuleIndex;
                  
                  return (
                    <div key={module.id}>
                      <button
                        className={cn(
                          "w-full text-left p-2 rounded-lg transition-colors",
                          isActive ? "bg-primary/10" : "hover:bg-muted",
                          locked && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !locked && navigateToContent(mIdx, 0)}
                        disabled={locked}
                      >
                        <div className="flex items-center gap-2">
                          {locked ? (
                            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{module.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-6 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {module.duration} min
                        </div>
                      </button>
                      
                      {isActive && !locked && (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {module.content.map((content, cIdx) => {
                            const completed = isContentCompleted(content.id);
                            const isCurrent = cIdx === currentContentIndex && !showAssessment;
                            
                            return (
                              <button
                                key={content.id}
                                className={cn(
                                  "w-full text-left p-2 rounded text-sm flex items-center gap-2 transition-colors",
                                  isCurrent ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                )}
                                onClick={() => navigateToContent(mIdx, cIdx)}
                              >
                                {completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                ) : (
                                  contentTypeIcons[content.type]
                                )}
                                <span className="truncate">{content.title}</span>
                              </button>
                            );
                          })}
                          
                          {module.assessment && (
                            <button
                              className={cn(
                                "w-full text-left p-2 rounded text-sm flex items-center gap-2 transition-colors",
                                showAssessment ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                              )}
                              onClick={() => setShowAssessment(true)}
                            >
                              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{module.assessment.title}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              {showAssessment && currentModule?.assessment ? (
                <AssessmentView
                  assessment={currentModule.assessment}
                  answers={assessmentAnswers}
                  onAnswerChange={setAssessmentAnswers}
                  submitted={assessmentSubmitted}
                  result={assessmentResult}
                  onSubmit={handleAssessmentSubmit}
                  onRetry={handleRetryAssessment}
                />
              ) : currentContent ? (
                <ContentView
                  content={currentContent}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  videoProgress={videoProgress}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                  onMuteToggle={() => setIsMuted(!isMuted)}
                  onVideoProgress={setVideoProgress}
                  isCompleted={isContentCompleted(currentContent.id)}
                />
              ) : null}
            </ScrollArea>

            {/* Footer Navigation */}
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (showAssessment) {
                    setShowAssessment(false);
                  } else if (currentContentIndex > 0) {
                    setCurrentContentIndex(prev => prev - 1);
                  } else if (currentModuleIndex > 0) {
                    const prevModule = course.modules[currentModuleIndex - 1];
                    setCurrentModuleIndex(prev => prev - 1);
                    setCurrentContentIndex(prevModule.content.length - 1);
                  }
                }}
                disabled={currentModuleIndex === 0 && currentContentIndex === 0 && !showAssessment}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Module {currentModuleIndex + 1} of {course.modules.length}
              </div>

              {showAssessment ? (
                assessmentSubmitted && assessmentResult?.passed ? (
                  <Button onClick={handleContentComplete}>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : null
              ) : (
                <Button onClick={handleContentComplete}>
                  {isContentCompleted(currentContent?.id || '') ? 'Next' : 'Mark Complete & Next'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Content View Component
interface ContentViewProps {
  content: ModuleContent;
  isPlaying: boolean;
  isMuted: boolean;
  videoProgress: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVideoProgress: (progress: number) => void;
  isCompleted: boolean;
}

function ContentView({
  content,
  isPlaying,
  isMuted,
  videoProgress,
  onPlayPause,
  onMuteToggle,
  onVideoProgress,
  isCompleted,
}: ContentViewProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        {contentTypeIcons[content.type]}
        <Badge variant="outline">{contentTypeLabels[content.type]}</Badge>
        {content.mandatory && <Badge variant="secondary">Required</Badge>}
        {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
      </div>
      
      <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
      
      {content.description && (
        <p className="text-muted-foreground mb-6">{content.description}</p>
      )}

      {content.type === 'video' && (
        <div className="space-y-4">
          {/* Video Player Mockup */}
          <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-75">Video Content: {content.title}</p>
                <p className="text-sm opacity-50 mt-2">{content.duration} minutes</p>
              </div>
            </div>
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <Progress value={videoProgress} className="h-1 mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => onVideoProgress(Math.max(0, videoProgress - 10))}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={onPlayPause}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => onVideoProgress(Math.min(100, videoProgress + 10))}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={onMuteToggle}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {content.type === 'document' && (
        <Card>
          <CardContent className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <div className="border rounded-lg p-8 bg-muted/30 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Document: {content.title}</p>
                <p className="text-muted-foreground mt-2">
                  This document covers important concepts and guidelines.
                  Estimated reading time: {content.duration} minutes.
                </p>
                <Button className="mt-4" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {content.type === 'interactive' && (
        <Card>
          <CardContent className="p-6">
            <div className="border rounded-lg p-8 bg-gradient-to-br from-primary/10 to-primary/5 text-center">
              <MousePointer className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Interactive Exercise</p>
              <p className="text-muted-foreground mt-2">
                Complete this hands-on activity to practice what you've learned.
                Estimated time: {content.duration} minutes.
              </p>
              <Button className="mt-4">
                Start Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(content.type === 'external_link' || content.type === 'webinar') && (
        <Card>
          <CardContent className="p-6 text-center">
            <ExternalLink className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">{content.title}</p>
            <p className="text-muted-foreground mt-2">
              This content is hosted externally.
            </p>
            <Button className="mt-4">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Assessment View Component
interface AssessmentViewProps {
  assessment: Assessment;
  answers: Record<string, string | string[]>;
  onAnswerChange: (answers: Record<string, string | string[]>) => void;
  submitted: boolean;
  result: { score: number; passed: boolean } | null;
  onSubmit: () => void;
  onRetry: () => void;
}

function AssessmentView({
  assessment,
  answers,
  onAnswerChange,
  submitted,
  result,
  onSubmit,
  onRetry,
}: AssessmentViewProps) {
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessment.questions.length;

  const updateAnswer = (questionId: string, answer: string | string[]) => {
    onAnswerChange({ ...answers, [questionId]: answer });
  };

  if (submitted && result) {
    return (
      <div className="p-6">
        <Card className={cn(
          "border-2",
          result.passed ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"
        )}>
          <CardContent className="p-8 text-center">
            {result.passed ? (
              <>
                <Award className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                  Assessment Passed!
                </h3>
                <p className="text-lg mt-2">
                  You scored <span className="font-bold">{result.score}%</span>
                </p>
                <p className="text-muted-foreground mt-1">
                  Required: {assessment.passingScore}%
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">
                  Assessment Not Passed
                </h3>
                <p className="text-lg mt-2">
                  You scored <span className="font-bold">{result.score}%</span>
                </p>
                <p className="text-muted-foreground mt-1">
                  Required: {assessment.passingScore}%
                </p>
                <Button className="mt-4" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {assessment.showCorrectAnswers && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold">Review Answers</h4>
            {assessment.questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.correctAnswer);
              
              return (
                <Card key={q.id} className={cn(
                  "border-l-4",
                  isCorrect ? "border-l-green-500" : "border-l-red-500"
                )}>
                  <CardContent className="p-4">
                    <p className="font-medium">Q{idx + 1}: {q.question}</p>
                    <p className="text-sm mt-2">
                      Your answer: <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                        {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || 'Not answered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600 mt-1">
                        Correct: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-sm text-muted-foreground mt-2 italic">{q.explanation}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">{assessment.title}</h3>
          <p className="text-muted-foreground mt-1">
            {answeredCount} of {totalQuestions} questions answered
          </p>
        </div>
        <div className="text-right">
          <Badge variant="outline">Passing: {assessment.passingScore}%</Badge>
          {assessment.timeLimit && (
            <p className="text-sm text-muted-foreground mt-1">
              Time limit: {assessment.timeLimit} min
            </p>
          )}
        </div>
      </div>

      <Progress value={(answeredCount / totalQuestions) * 100} className="h-2 mb-6" />

      <div className="space-y-6">
        {assessment.questions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={idx}
            answer={answers[question.id]}
            onAnswer={(answer) => updateAnswer(question.id, answer)}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button 
          size="lg" 
          onClick={onSubmit}
          disabled={answeredCount < totalQuestions}
        >
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// Question Card Component
interface QuestionCardProps {
  question: AssessmentQuestion;
  index: number;
  answer: string | string[] | undefined;
  onAnswer: (answer: string | string[]) => void;
}

function QuestionCard({ question, index, answer, onAnswer }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {index + 1}
          </span>
          {question.question}
        </CardTitle>
        <Badge variant="outline" className="w-fit">{question.points} points</Badge>
      </CardHeader>
      <CardContent>
        {question.type === 'multiple_choice' && (
          <RadioGroup value={answer as string} onValueChange={onAnswer}>
            <div className="space-y-2">
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {question.type === 'true_false' && (
          <RadioGroup value={answer as string} onValueChange={onAnswer}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question.id}-true`} />
                <Label htmlFor={`${question.id}-true`} className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question.id}-false`} />
                <Label htmlFor={`${question.id}-false`} className="cursor-pointer">False</Label>
              </div>
            </div>
          </RadioGroup>
        )}

        {question.type === 'multi_select' && (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const selected = Array.isArray(answer) && answer.includes(option);
              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(answer) ? answer : [];
                      if (checked) {
                        onAnswer([...current, option]);
                      } else {
                        onAnswer(current.filter(a => a !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'short_answer' && (
          <Textarea
            value={answer as string || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Enter your answer..."
            rows={3}
          />
        )}
      </CardContent>
    </Card>
  );
}
