// Offline Form Sync Service
// Handles offline storage, sync queue, and connection detection

export interface OfflineSubmission {
  id: string;
  templateId: string;
  templateVersion: number;
  responses: Record<string, any>;
  attachments: { fieldId: string; file: File; }[];
  savedAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt?: string;
  errorMessage?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'submission' | 'draft' | 'attachment';
  data: any;
  priority: number;
  createdAt: string;
  retryCount: number;
}

const DB_NAME = 'formOfflineDB';
const DB_VERSION = 1;
const STORES = {
  submissions: 'offlineSubmissions',
  drafts: 'formDrafts',
  syncQueue: 'syncQueue',
  templates: 'cachedTemplates',
};

class OfflineFormService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Set<(status: { isOnline: boolean; pendingCount: number }) => void> = new Set();

  constructor() {
    this.initDB();
    this.setupConnectionListeners();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Offline submissions store
        if (!db.objectStoreNames.contains(STORES.submissions)) {
          const submissionStore = db.createObjectStore(STORES.submissions, { keyPath: 'id' });
          submissionStore.createIndex('templateId', 'templateId', { unique: false });
          submissionStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          submissionStore.createIndex('savedAt', 'savedAt', { unique: false });
        }

        // Drafts store
        if (!db.objectStoreNames.contains(STORES.drafts)) {
          const draftStore = db.createObjectStore(STORES.drafts, { keyPath: 'id' });
          draftStore.createIndex('templateId', 'templateId', { unique: false });
          draftStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.syncQueue)) {
          const queueStore = db.createObjectStore(STORES.syncQueue, { keyPath: 'id' });
          queueStore.createIndex('priority', 'priority', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Cached templates store
        if (!db.objectStoreNames.contains(STORES.templates)) {
          db.createObjectStore(STORES.templates, { keyPath: 'id' });
        }
      };
    });
  }

  private setupConnectionListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private async notifyListeners(): Promise<void> {
    const pendingCount = await this.getPendingCount();
    this.listeners.forEach(listener => {
      listener({ isOnline: this.isOnline, pendingCount });
    });
  }

  // Subscribe to connection/sync status changes
  subscribe(callback: (status: { isOnline: boolean; pendingCount: number }) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    this.getPendingCount().then(count => {
      callback({ isOnline: this.isOnline, pendingCount: count });
    });
    return () => this.listeners.delete(callback);
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Save form submission for offline sync
  async saveSubmission(submission: Omit<OfflineSubmission, 'syncStatus' | 'syncAttempts'>): Promise<string> {
    const db = this.db || await this.initDB();
    const fullSubmission: OfflineSubmission = {
      ...submission,
      syncStatus: 'pending',
      syncAttempts: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.submissions, 'readwrite');
      const store = transaction.objectStore(STORES.submissions);
      const request = store.put(fullSubmission);

      request.onsuccess = () => {
        this.notifyListeners();
        // Try to sync immediately if online
        if (this.isOnline) {
          this.processSyncQueue();
        }
        resolve(submission.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Save draft locally
  async saveDraft(templateId: string, responses: Record<string, any>): Promise<string> {
    const db = this.db || await this.initDB();
    const draft = {
      id: `draft-${templateId}`,
      templateId,
      responses,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.drafts, 'readwrite');
      const store = transaction.objectStore(STORES.drafts);
      const request = store.put(draft);

      request.onsuccess = () => resolve(draft.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get saved draft for a template
  async getDraft(templateId: string): Promise<{ responses: Record<string, any>; updatedAt: string } | null> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.drafts, 'readonly');
      const store = transaction.objectStore(STORES.drafts);
      const request = store.get(`draft-${templateId}`);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete draft after successful submission
  async deleteDraft(templateId: string): Promise<void> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.drafts, 'readwrite');
      const store = transaction.objectStore(STORES.drafts);
      const request = store.delete(`draft-${templateId}`);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending submissions
  async getPendingSubmissions(): Promise<OfflineSubmission[]> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.submissions, 'readonly');
      const store = transaction.objectStore(STORES.submissions);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get count of pending items
  async getPendingCount(): Promise<number> {
    const submissions = await this.getPendingSubmissions();
    return submissions.length;
  }

  // Process sync queue
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    const pendingSubmissions = await this.getPendingSubmissions();

    for (const submission of pendingSubmissions) {
      try {
        await this.syncSubmission(submission);
      } catch (error) {
        console.error('Failed to sync submission:', submission.id, error);
      }
    }

    this.syncInProgress = false;
    this.notifyListeners();
  }

  private async syncSubmission(submission: OfflineSubmission): Promise<void> {
    const db = this.db || await this.initDB();

    // Update status to syncing
    await this.updateSubmissionStatus(submission.id, 'syncing');

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation:
      // const response = await fetch('/api/forms/submissions', {
      //   method: 'POST',
      //   body: JSON.stringify(submission),
      // });
      // if (!response.ok) throw new Error('Sync failed');

      // Mark as synced
      await this.updateSubmissionStatus(submission.id, 'synced');
      
      // Remove from offline storage after successful sync
      await this.removeSubmission(submission.id);
    } catch (error) {
      // Mark as failed and increment retry count
      await this.updateSubmissionStatus(
        submission.id, 
        'failed', 
        submission.syncAttempts + 1,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async updateSubmissionStatus(
    id: string, 
    status: OfflineSubmission['syncStatus'],
    syncAttempts?: number,
    errorMessage?: string
  ): Promise<void> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.submissions, 'readwrite');
      const store = transaction.objectStore(STORES.submissions);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const submission = getRequest.result;
        if (submission) {
          submission.syncStatus = status;
          submission.lastSyncAttempt = new Date().toISOString();
          if (syncAttempts !== undefined) submission.syncAttempts = syncAttempts;
          if (errorMessage) submission.errorMessage = errorMessage;
          
          const putRequest = store.put(submission);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async removeSubmission(id: string): Promise<void> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.submissions, 'readwrite');
      const store = transaction.objectStore(STORES.submissions);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache template for offline use
  async cacheTemplate(template: any): Promise<void> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.templates, 'readwrite');
      const store = transaction.objectStore(STORES.templates);
      const request = store.put({ ...template, cachedAt: new Date().toISOString() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached template
  async getCachedTemplate(templateId: string): Promise<any | null> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.templates, 'readonly');
      const store = transaction.objectStore(STORES.templates);
      const request = store.get(templateId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Retry failed submissions
  async retryFailed(): Promise<void> {
    const db = this.db || await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.submissions, 'readwrite');
      const store = transaction.objectStore(STORES.submissions);
      const index = store.index('syncStatus');
      const request = index.openCursor('failed');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const submission = cursor.value;
          submission.syncStatus = 'pending';
          cursor.update(submission);
          cursor.continue();
        } else {
          this.notifyListeners();
          if (this.isOnline) {
            this.processSyncQueue();
          }
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const offlineFormService = new OfflineFormService();
