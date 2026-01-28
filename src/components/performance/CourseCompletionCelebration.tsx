import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Award,
  Star,
  Sparkles,
  Share2,
  Download,
  CheckCircle2,
  Clock,
  Target,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Course, Enrollment, Certificate } from '@/types/lms';
import { format } from 'date-fns';

interface CourseCompletionCelebrationProps {
  open: boolean;
  course: Course | null;
  enrollment: Enrollment | null;
  certificate?: Certificate;
  onClose: () => void;
  onViewCertificate?: () => void;
  onBrowseMore?: () => void;
}

export function CourseCompletionCelebration({
  open,
  course,
  enrollment,
  certificate,
  onClose,
  onViewCertificate,
  onBrowseMore,
}: CourseCompletionCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!course || !enrollment) return null;

  const completionDate = enrollment.completedAt
    ? format(new Date(enrollment.completedAt), 'MMMM d, yyyy')
    : format(new Date(), 'MMMM d, yyyy');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    i % 4 === 0 ? "bg-primary" :
                    i % 4 === 1 ? "bg-amber-400" :
                    i % 4 === 2 ? "bg-green-400" :
                    "bg-purple-400"
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-center text-primary-foreground">
          <div className="absolute top-4 right-4">
            <PartyPopper className="h-8 w-8 text-primary-foreground/60 animate-bounce" />
          </div>
          <div className="absolute top-4 left-4">
            <Sparkles className="h-8 w-8 text-primary-foreground/60 animate-pulse" />
          </div>

          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Trophy className="h-12 w-12 text-amber-300" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
          <p className="text-primary-foreground/80">You've completed the course</p>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {/* Course Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">{course.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Completed on {completionDate}
            </p>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-bold text-green-700 dark:text-green-400">100%</p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{course.duration}m</p>
                <p className="text-xs text-muted-foreground">Time Spent</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
              <CardContent className="p-3 text-center">
                <Target className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{course.modules.length}</p>
                <p className="text-xs text-muted-foreground">Modules</p>
              </CardContent>
            </Card>
          </div>

          {/* Skills Earned */}
          {course.skills.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Skills Earned
              </p>
              <div className="flex flex-wrap gap-2">
                {course.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Certificate Preview */}
          {course.certificateOnCompletion && (
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Certificate Earned!</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {certificate?.certificateNumber || 'CERT-' + Date.now().toString(36).toUpperCase()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-amber-300 hover:bg-amber-100"
                    onClick={onViewCertificate}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button className="flex-1" onClick={onBrowseMore}>
              Browse More Courses
            </Button>
          </div>
        </div>

        <style>{`
          @keyframes fall {
            0% {
              transform: translateY(-20px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(500px) rotate(360deg);
              opacity: 0;
            }
          }
          .animate-fall {
            animation: fall linear forwards;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
