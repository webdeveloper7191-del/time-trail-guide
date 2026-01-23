import { useState, useEffect } from 'react';
import { offlineFormService, OfflineSubmission } from '@/lib/offlineFormService';

interface OfflineSyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<OfflineSyncStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    isSyncing: false,
  });
  const [pendingSubmissions, setPendingSubmissions] = useState<OfflineSubmission[]>([]);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = offlineFormService.subscribe(({ isOnline, pendingCount }) => {
      setStatus(prev => ({ ...prev, isOnline, pendingCount }));
    });

    // Load pending submissions
    loadPendingSubmissions();

    return () => unsubscribe();
  }, []);

  const loadPendingSubmissions = async () => {
    const submissions = await offlineFormService.getPendingSubmissions();
    setPendingSubmissions(submissions);
  };

  const saveSubmission = async (
    templateId: string,
    templateVersion: number,
    responses: Record<string, any>,
    attachments: { fieldId: string; file: File }[] = []
  ) => {
    const id = `submission-${Date.now()}`;
    await offlineFormService.saveSubmission({
      id,
      templateId,
      templateVersion,
      responses,
      attachments,
      savedAt: new Date().toISOString(),
    });
    await loadPendingSubmissions();
    return id;
  };

  const saveDraft = async (templateId: string, responses: Record<string, any>) => {
    return offlineFormService.saveDraft(templateId, responses);
  };

  const getDraft = async (templateId: string) => {
    return offlineFormService.getDraft(templateId);
  };

  const deleteDraft = async (templateId: string) => {
    return offlineFormService.deleteDraft(templateId);
  };

  const retrySync = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true }));
    await offlineFormService.retryFailed();
    await loadPendingSubmissions();
    setStatus(prev => ({ ...prev, isSyncing: false }));
  };

  const forceSync = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true }));
    await offlineFormService.processSyncQueue();
    await loadPendingSubmissions();
    setStatus(prev => ({ ...prev, isSyncing: false }));
  };

  return {
    ...status,
    pendingSubmissions,
    saveSubmission,
    saveDraft,
    getDraft,
    deleteDraft,
    retrySync,
    forceSync,
    refreshPending: loadPendingSubmissions,
  };
}
