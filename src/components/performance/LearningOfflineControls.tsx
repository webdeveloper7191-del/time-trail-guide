import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Trash2, HardDrive, CheckCircle2 } from 'lucide-react';
import { cachedCourseAvailable, downloadLearningCourse, learningDownloads, learningOfflineSettings, removeLearningDownload, verifyLearningProgress } from '@/lib/learningOfflineStore';
import type { Course, Enrollment } from '@/types/lms';
import { toast } from 'sonner';
export function LearningOfflineControls({course, enrollment}: {course: Course; enrollment: Enrollment}) {
  const rows = useSyncExternalStore(learningDownloads.subscribe, learningDownloads.get, learningDownloads.get);
  const settings = useSyncExternalStore(learningOfflineSettings.subscribe, learningOfflineSettings.get, learningOfflineSettings.get);
  const [busy, setBusy] = useState(false);
  const row = rows[course.id]; const used = Object.values(rows).reduce((sum, item) => sum + item.bytes, 0);
  async function download() { setBusy(true); try { await downloadLearningCourse(course); toast.success('Course files saved in this browser'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Download failed'); } finally { setBusy(false); } }
  return <section className="space-y-3 border-t border-border p-4">
    <div className="flex flex-wrap items-center gap-2"><HardDrive className="h-4 w-4"/><span className="text-xs text-muted-foreground">{(used / 1048576).toFixed(2)} MB / {settings.storageLimitMb} MB · Browser downloads</span>
      <Button size="sm" variant="outline" disabled={busy} onClick={download}><Download className="mr-2 h-4 w-4"/>{busy ? 'Downloading…' : cachedCourseAvailable(row) ? 'Refresh download' : 'Download course'}</Button>
      {row && <Button size="icon" variant="ghost" aria-label="Remove course download" onClick={async () => { try { await removeLearningDownload(course.id); } catch { toast.error('Could not remove download'); } }}><Trash2 className="h-4 w-4"/></Button>}
      <Button size="sm" variant="outline" onClick={() => { try { const progress = verifyLearningProgress(enrollment.id); toast.success(`${progress}% progress saved in this browser`); } catch(error) { toast.error(error instanceof Error ? error.message : 'Could not verify progress'); } }}><CheckCircle2 className="mr-2 h-4 w-4"/>Check saved progress</Button>
    </div>
    {row && <p className="text-xs text-muted-foreground">{cachedCourseAvailable(row) ? 'Available in this browser' : 'Download expired'} · Expires {new Date(row.expiresAt).toLocaleDateString()}</p>}
    <div className="flex flex-wrap items-center gap-3 text-xs"><label className="flex items-center gap-2">Storage limit (MB)<Input aria-label="Offline storage limit" type="number" className="h-8 w-20" min={1} max={1000} value={settings.storageLimitMb} onChange={e => { const n=Number(e.target.value); if(n>=1 && n<=1000) learningOfflineSettings.set(s=>({...s,storageLimitMb:n})); }}/></label><label className="flex items-center gap-2">Expiry (days)<Input aria-label="Offline expiry days" type="number" className="h-8 w-20" min={1} max={365} value={settings.expiryDays} onChange={e => { const n=Number(e.target.value); if(n>=1 && n<=365) learningOfflineSettings.set(s=>({...s,expiryDays:n})); }}/></label></div>
    <p className="text-xs text-muted-foreground">Browser-only saving; no online sync. Offline files require this app to remain open. External activities may still require a connection.</p>
  </section>;
}
