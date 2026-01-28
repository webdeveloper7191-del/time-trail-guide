import React, { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Download,
  DownloadCloud,
  CheckCircle2,
  Circle,
  Lock,
  Menu,
  X,
  Wifi,
  WifiOff,
  HardDrive,
  Trash2,
  Settings,
  Clock,
  Video,
  FileText,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Course, CourseModule, ModuleContent, Enrollment, difficultyLabels, difficultyColors, contentTypeLabels } from '@/types/lms';
import { OfflineCourse, MobileSettings } from '@/types/lmsAdvanced';
import { toast } from 'sonner';

interface MobileCoursePlayerProps {
  open: boolean;
  course: Course | null;
  enrollment: Enrollment | null;
  onClose: () => void;
  onProgressUpdate: (enrollmentId: string, moduleId: string, contentId: string, completed: boolean) => void;
  onModuleComplete: (enrollmentId: string, moduleId: string) => void;
  onCourseComplete: (enrollmentId: string) => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

// Simulated offline storage
const mockOfflineCourses: OfflineCourse[] = [];
const mockMobileSettings: MobileSettings = {
  downloadOverWifiOnly: true,
  autoDownloadAssigned: false,
  storageLimit: 500,
  notificationsEnabled: true,
  reminderTime: '09:00',
  offlineExpiryDays: 30,
};

export function MobileCoursePlayer({
  open,
  course,
  enrollment,
  onClose,
  onProgressUpdate,
  onModuleComplete,
  onCourseComplete,
}: MobileCoursePlayerProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModuleList, setShowModuleList] = useState(false);
  const [showOfflineSettings, setShowOfflineSettings] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCourses, setOfflineCourses] = useState<OfflineCourse[]>(mockOfflineCourses);
  const [settings, setSettings] = useState<MobileSettings>(mockMobileSettings);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentModule = course?.modules[currentModuleIndex];
  const currentContent = currentModule?.content[currentContentIndex];

  const isOfflineAvailable = useMemo(() => 
    offlineCourses.some(oc => oc.courseId === course?.id),
    [offlineCourses, course]
  );

  const offlineCourse = useMemo(() => 
    offlineCourses.find(oc => oc.courseId === course?.id),
    [offlineCourses, course]
  );

  const overallProgress = useMemo(() => {
    if (!enrollment || !course) return 0;
    const totalContent = course.modules.reduce((sum, m) => sum + m.content.length, 0);
    const completedContent = enrollment.moduleProgress.reduce(
      (sum, mp) => sum + mp.completedContentIds.length, 0
    );
    return Math.round((completedContent / totalContent) * 100);
  }, [enrollment, course]);

  const isContentCompleted = (contentId: string) => {
    if (!enrollment || !currentModule) return false;
    const mp = enrollment.moduleProgress.find(p => p.moduleId === currentModule.id);
    return mp?.completedContentIds.includes(contentId) || false;
  };

  const isModuleLocked = (module: CourseModule) => {
    if (!module.unlockAfterModuleId) return false;
    const prereqModule = enrollment?.moduleProgress.find(p => p.moduleId === module.unlockAfterModuleId);
    return prereqModule?.status !== 'completed';
  };

  const handleContentComplete = () => {
    if (!enrollment || !currentModule || !currentContent) return;
    
    if (!isContentCompleted(currentContent.id)) {
      onProgressUpdate(enrollment.id, currentModule.id, currentContent.id, true);
    }
    
    // Navigate to next
    if (currentContentIndex < currentModule.content.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
    } else if (currentModuleIndex < course!.modules.length - 1) {
      onModuleComplete(enrollment.id, currentModule.id);
      setCurrentModuleIndex(prev => prev + 1);
      setCurrentContentIndex(0);
      toast.success('Module complete! Moving to next module.');
    } else {
      onModuleComplete(enrollment.id, currentModule.id);
      onCourseComplete(enrollment.id);
      toast.success('🎉 Course completed!');
    }
  };

  const handleDownloadCourse = async () => {
    if (!course) return;
    
    if (!isOnline) {
      toast.error('No internet connection. Cannot download.');
      return;
    }

    if (settings.downloadOverWifiOnly && !(navigator as any).connection?.type?.includes('wifi')) {
      toast.error('WiFi-only mode enabled. Connect to WiFi to download.');
      return;
    }

    setIsDownloading(true);
    
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setDownloadProgress(prev => ({ ...prev, [course.id]: i }));
    }

    const newOfflineCourse: OfflineCourse = {
      courseId: course.id,
      title: course.title,
      downloadedAt: new Date().toISOString(),
      size: Math.round(course.duration * 2.5 * 1024 * 1024), // Approx 2.5MB per minute
      modules: course.modules.map(m => ({
        moduleId: m.id,
        title: m.title,
        downloaded: true,
        size: Math.round(m.duration * 2.5 * 1024 * 1024),
        content: m.content.map(c => ({
          contentId: c.id,
          title: c.title,
          type: c.type,
          downloaded: true,
          size: Math.round((c.duration || 5) * 2.5 * 1024 * 1024),
        })),
      })),
      expiresAt: new Date(Date.now() + settings.offlineExpiryDays * 24 * 60 * 60 * 1000).toISOString(),
      lastSyncedAt: new Date().toISOString(),
      progress: enrollment?.progress || 0,
    };

    setOfflineCourses(prev => [...prev, newOfflineCourse]);
    setIsDownloading(false);
    setDownloadProgress(prev => {
      const { [course.id]: _, ...rest } = prev;
      return rest;
    });
    toast.success('Course downloaded for offline viewing!');
  };

  const handleDeleteOffline = () => {
    if (!course) return;
    setOfflineCourses(prev => prev.filter(oc => oc.courseId !== course.id));
    toast.success('Offline content removed');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const navigateToContent = (moduleIdx: number, contentIdx: number) => {
    const module = course?.modules[moduleIdx];
    if (module && !isModuleLocked(module)) {
      setCurrentModuleIndex(moduleIdx);
      setCurrentContentIndex(contentIdx);
      setShowModuleList(false);
    }
  };

  if (!course || !enrollment) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side="right">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h3 className="font-medium text-sm truncate px-2">{course.title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {!isOnline && (
              <Badge variant="outline" className="text-amber-600 text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowModuleList(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{overallProgress}% complete</span>
            <span>Module {currentModuleIndex + 1}/{course.modules.length}</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentContent && (
            <>
              {/* Video/Content Player Area */}
              <div className="aspect-video bg-black relative flex items-center justify-center">
                {currentContent.type === 'video' ? (
                  <>
                    <div className="text-white text-center p-4">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">{currentContent.title}</p>
                      <p className="text-sm opacity-75 mt-1">{currentContent.duration} min</p>
                    </div>
                    
                    {/* Play Button Overlay */}
                    <button
                      className="absolute inset-0 flex items-center justify-center"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-full bg-white/20 flex items-center justify-center transition-transform",
                        isPlaying ? "scale-0" : "scale-100"
                      )}>
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </button>

                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3">
                      <Progress value={45} className="h-1 mb-2" />
                      <div className="flex items-center justify-between text-white text-xs">
                        <span>5:32 / 12:00</span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-white text-center p-4">
                    {contentTypeIcons[currentContent.type]}
                    <p className="font-medium mt-2">{currentContent.title}</p>
                    <p className="text-sm opacity-75">{contentTypeLabels[currentContent.type as keyof typeof contentTypeLabels]}</p>
                  </div>
                )}
              </div>

              {/* Content Info */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{contentTypeLabels[currentContent.type as keyof typeof contentTypeLabels]}</Badge>
                    {currentContent.mandatory && <Badge variant="secondary">Required</Badge>}
                    {isContentCompleted(currentContent.id) && (
                      <Badge className="bg-green-500">Completed</Badge>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-lg">{currentContent.title}</h2>
                    {currentContent.description && (
                      <p className="text-muted-foreground mt-2">{currentContent.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentContent.duration || 5} min
                    </span>
                  </div>

                  {/* Offline Download Section */}
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isOfflineAvailable ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="text-sm font-medium">Available Offline</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatBytes(offlineCourse?.size || 0)}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <DownloadCloud className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Download for Offline</p>
                                <p className="text-xs text-muted-foreground">
                                  ~{formatBytes(course.duration * 2.5 * 1024 * 1024)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {isDownloading ? (
                          <div className="flex items-center gap-2">
                            <Progress value={downloadProgress[course.id] || 0} className="w-20 h-2" />
                            <span className="text-xs">{downloadProgress[course.id] || 0}%</span>
                          </div>
                        ) : isOfflineAvailable ? (
                          <Button variant="ghost" size="sm" onClick={handleDeleteOffline}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" onClick={handleDownloadCourse}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Offline Settings Toggle */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowOfflineSettings(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Offline Settings
                  </Button>
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (currentContentIndex > 0) {
                  setCurrentContentIndex(prev => prev - 1);
                } else if (currentModuleIndex > 0) {
                  const prevModule = course.modules[currentModuleIndex - 1];
                  setCurrentModuleIndex(prev => prev - 1);
                  setCurrentContentIndex(prevModule.content.length - 1);
                }
              }}
              disabled={currentModuleIndex === 0 && currentContentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button className="flex-1" onClick={handleContentComplete}>
              {isContentCompleted(currentContent?.id || '') ? 'Next' : 'Complete'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Module List Drawer */}
        {showModuleList && (
          <div className="absolute inset-0 bg-background z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Course Content</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModuleList(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {course.modules.map((module, mIdx) => {
                  const locked = isModuleLocked(module);
                  const mp = enrollment.moduleProgress.find(p => p.moduleId === module.id);
                  const isComplete = mp?.status === 'completed';
                  const isActive = mIdx === currentModuleIndex;

                  return (
                    <div key={module.id} className="space-y-1">
                      <button
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                          isActive ? "bg-primary/10" : "hover:bg-muted",
                          locked && "opacity-50"
                        )}
                        onClick={() => !locked && navigateToContent(mIdx, 0)}
                        disabled={locked}
                      >
                        {locked ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : isComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{module.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {module.content.length} items • {module.duration} min
                          </p>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isActive && "rotate-180"
                        )} />
                      </button>

                      {isActive && !locked && (
                        <div className="ml-6 pl-4 border-l space-y-1">
                          {module.content.map((content, cIdx) => {
                            const completed = isContentCompleted(content.id);
                            const isCurrent = cIdx === currentContentIndex;

                            return (
                              <button
                                key={content.id}
                                className={cn(
                                  "w-full text-left p-2 rounded text-sm flex items-center gap-2",
                                  isCurrent ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                )}
                                onClick={() => navigateToContent(mIdx, cIdx)}
                              >
                                {completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  contentTypeIcons[content.type]
                                )}
                                <span className="truncate">{content.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Offline Settings Drawer */}
        {showOfflineSettings && (
          <div className="absolute inset-0 bg-background z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Offline Settings</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowOfflineSettings(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Download over WiFi only</Label>
                    <p className="text-xs text-muted-foreground">Save mobile data</p>
                  </div>
                  <Switch
                    checked={settings.downloadOverWifiOnly}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, downloadOverWifiOnly: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-download assigned</Label>
                    <p className="text-xs text-muted-foreground">Download new assignments</p>
                  </div>
                  <Switch
                    checked={settings.autoDownloadAssigned}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoDownloadAssigned: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Learning reminders</Label>
                    <p className="text-xs text-muted-foreground">Daily notification at {settings.reminderTime}</p>
                  </div>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, notificationsEnabled: v }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Offline expiry</Label>
                  <p className="text-sm">{settings.offlineExpiryDays} days</p>
                  <p className="text-xs text-muted-foreground">
                    Downloaded content expires after this period
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">Storage Used</p>
                        <Progress value={35} className="h-2 mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          175 MB of {settings.storageLimit} MB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {offlineCourses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Downloaded Courses</Label>
                    {offlineCourses.map((oc) => (
                      <div key={oc.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{oc.title}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(oc.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOfflineCourses(prev => prev.filter(c => c.courseId !== oc.courseId))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {!isOnline && (
                  <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="p-3 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-sm">You're offline</p>
                        <p className="text-xs text-muted-foreground">
                          Progress will sync when online
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button variant="outline" className="w-full" onClick={() => toast.success('Synced!')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Progress Now
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
