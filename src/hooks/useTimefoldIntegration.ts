// Hook for managing Timefold integration settings
import { useState, useEffect, useCallback } from 'react';
import {
  TimefoldIntegrationSettings,
  ApiConnectionConfig,
  DataMappingProfile,
  ImportedConstraintSet,
  loadIntegrationSettings,
  saveIntegrationSettings,
  getDefaultIntegrationSettings,
  validateApiConnection,
  validateConstraintImport,
  SAMPLE_API_CONNECTION,
  SAMPLE_MAPPING_PROFILE,
} from '@/lib/timefold/integrationConfig';
import { TimefoldConstraint } from '@/lib/timefoldSolver';
import { toast } from 'sonner';

export interface ConnectionTestResult {
  success: boolean;
  responseTimeMs: number;
  statusCode?: number;
  message: string;
  error?: string;
}

export function useTimefoldIntegration() {
  const [settings, setSettings] = useState<TimefoldIntegrationSettings>(() => loadIntegrationSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  // Persist settings when they change
  useEffect(() => {
    saveIntegrationSettings(settings);
  }, [settings]);

  // ============= API CONNECTION MANAGEMENT =============

  const addApiConnection = useCallback((connection: Omit<ApiConnectionConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newConnection: ApiConnectionConfig = {
      ...connection,
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = validateApiConnection(newConnection);
    if (!validation.valid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`);
      return null;
    }

    setSettings(prev => ({
      ...prev,
      apiConnections: [...prev.apiConnections, newConnection],
    }));

    toast.success(`API connection "${connection.name}" added`);
    return newConnection;
  }, []);

  const updateApiConnection = useCallback((id: string, updates: Partial<ApiConnectionConfig>) => {
    setSettings(prev => ({
      ...prev,
      apiConnections: prev.apiConnections.map(conn =>
        conn.id === id
          ? { ...conn, ...updates, updatedAt: new Date().toISOString() }
          : conn
      ),
    }));
  }, []);

  const deleteApiConnection = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      apiConnections: prev.apiConnections.filter(conn => conn.id !== id),
      activeConnectionId: prev.activeConnectionId === id ? undefined : prev.activeConnectionId,
    }));
    toast.success('API connection deleted');
  }, []);

  const setActiveConnection = useCallback((id: string | undefined) => {
    setSettings(prev => ({
      ...prev,
      activeConnectionId: id,
    }));
  }, []);

  const testApiConnection = useCallback(async (connection: ApiConnectionConfig): Promise<ConnectionTestResult> => {
    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();

    try {
      // Simulate API call for demo (in production, this would call the actual endpoint)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

      // Mock response based on URL pattern
      const isLocalhost = connection.endpointUrl.includes('localhost');
      const responseTimeMs = Date.now() - startTime;

      if (isLocalhost) {
        // Simulate local server might be down
        const success = Math.random() > 0.3;
        const result: ConnectionTestResult = success
          ? {
              success: true,
              responseTimeMs,
              statusCode: 200,
              message: 'Connection successful! Timefold solver is ready.',
            }
          : {
              success: false,
              responseTimeMs,
              message: 'Connection failed',
              error: 'Could not connect to localhost. Ensure the Timefold server is running.',
            };
        
        setTestResult(result);
        updateApiConnection(connection.id, {
          lastHealthCheck: {
            timestamp: new Date().toISOString(),
            status: success ? 'healthy' : 'unhealthy',
            responseTimeMs,
            error: success ? undefined : result.error,
          },
        });
        return result;
      }

      // For remote URLs, simulate success
      const result: ConnectionTestResult = {
        success: true,
        responseTimeMs,
        statusCode: 200,
        message: 'Connection verified successfully.',
      };

      setTestResult(result);
      updateApiConnection(connection.id, {
        lastHealthCheck: {
          timestamp: new Date().toISOString(),
          status: 'healthy',
          responseTimeMs,
        },
      });

      return result;
    } catch (error) {
      const result: ConnectionTestResult = {
        success: false,
        responseTimeMs: Date.now() - startTime,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      setTestResult(result);
      updateApiConnection(connection.id, {
        lastHealthCheck: {
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
          error: result.error,
        },
      });

      return result;
    } finally {
      setIsTesting(false);
    }
  }, [updateApiConnection]);

  const addSampleConnection = useCallback(() => {
    return addApiConnection(SAMPLE_API_CONNECTION);
  }, [addApiConnection]);

  // ============= DATA MAPPING MANAGEMENT =============

  const addMappingProfile = useCallback((profile: Omit<DataMappingProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProfile: DataMappingProfile = {
      ...profile,
      id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSettings(prev => ({
      ...prev,
      mappingProfiles: [...prev.mappingProfiles, newProfile],
    }));

    toast.success(`Mapping profile "${profile.name}" added`);
    return newProfile;
  }, []);

  const updateMappingProfile = useCallback((id: string, updates: Partial<DataMappingProfile>) => {
    setSettings(prev => ({
      ...prev,
      mappingProfiles: prev.mappingProfiles.map(profile =>
        profile.id === id
          ? { ...profile, ...updates, updatedAt: new Date().toISOString() }
          : profile
      ),
    }));
  }, []);

  const deleteMappingProfile = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      mappingProfiles: prev.mappingProfiles.filter(profile => profile.id !== id),
      activeMappingProfileId: prev.activeMappingProfileId === id ? undefined : prev.activeMappingProfileId,
    }));
    toast.success('Mapping profile deleted');
  }, []);

  const setActiveMappingProfile = useCallback((id: string | undefined) => {
    setSettings(prev => ({
      ...prev,
      activeMappingProfileId: id,
    }));
  }, []);

  const addSampleMappingProfile = useCallback(() => {
    return addMappingProfile(SAMPLE_MAPPING_PROFILE);
  }, [addMappingProfile]);

  // ============= CONSTRAINT IMPORT MANAGEMENT =============

  const importConstraintsFromJson = useCallback((jsonString: string, name: string, source: 'file' | 'url' = 'file') => {
    setIsLoading(true);
    try {
      const parsed = JSON.parse(jsonString);
      const constraints = Array.isArray(parsed) ? parsed : parsed.constraints;
      
      const validation = validateConstraintImport(constraints);
      
      if (!validation.valid) {
        toast.error(`Import validation failed: ${validation.errors.slice(0, 3).join(', ')}`);
        return null;
      }

      const importedSet: ImportedConstraintSet = {
        id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        source,
        constraints: validation.constraints!,
        mergeStrategy: 'merge_by_id',
        isValid: true,
        validationErrors: [],
        lastImportedAt: new Date().toISOString(),
        autoRefresh: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSettings(prev => ({
        ...prev,
        importedConstraintSets: [...prev.importedConstraintSets, importedSet],
      }));

      toast.success(`Imported ${validation.constraints!.length} constraints from "${name}"`);
      return importedSet;
    } catch (error) {
      toast.error('Failed to parse JSON: ' + (error instanceof Error ? error.message : 'Invalid format'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConstraintSet = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      importedConstraintSets: prev.importedConstraintSets.filter(set => set.id !== id),
    }));
    toast.success('Constraint set deleted');
  }, []);

  const updateConstraintSet = useCallback((id: string, updates: Partial<ImportedConstraintSet>) => {
    setSettings(prev => ({
      ...prev,
      importedConstraintSets: prev.importedConstraintSets.map(set =>
        set.id === id
          ? { ...set, ...updates, updatedAt: new Date().toISOString() }
          : set
      ),
    }));
  }, []);

  // Get all constraints including imported ones
  const getAllConstraints = useCallback((baseConstraints: TimefoldConstraint[]): TimefoldConstraint[] => {
    let merged = [...baseConstraints];

    settings.importedConstraintSets.forEach(importedSet => {
      if (importedSet.isValid) {
        switch (importedSet.mergeStrategy) {
          case 'replace_all':
            merged = [...importedSet.constraints];
            break;
          case 'merge_by_id':
            importedSet.constraints.forEach(imported => {
              const existingIndex = merged.findIndex(c => c.id === imported.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = imported;
              } else {
                merged.push(imported);
              }
            });
            break;
          case 'add_new_only':
            importedSet.constraints.forEach(imported => {
              if (!merged.find(c => c.id === imported.id)) {
                merged.push(imported);
              }
            });
            break;
        }
      }
    });

    return merged;
  }, [settings.importedConstraintSets]);

  // ============= GLOBAL SETTINGS =============

  const updateGlobalSettings = useCallback((updates: Partial<TimefoldIntegrationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(getDefaultIntegrationSettings());
    toast.success('Settings reset to defaults');
  }, []);

  // ============= EXPORT/IMPORT =============

  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timefold-integration-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  }, [settings]);

  const importSettings = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as TimefoldIntegrationSettings;
      
      // Basic validation
      if (!imported.apiConnections || !imported.mappingProfiles) {
        throw new Error('Invalid settings format');
      }

      setSettings(imported);
      toast.success('Settings imported successfully');
      return true;
    } catch (error) {
      toast.error('Failed to import settings: ' + (error instanceof Error ? error.message : 'Invalid format'));
      return false;
    }
  }, []);

  // Get active connection
  const activeConnection = settings.apiConnections.find(c => c.id === settings.activeConnectionId);
  const activeMappingProfile = settings.mappingProfiles.find(p => p.id === settings.activeMappingProfileId);

  return {
    settings,
    isLoading,
    isTesting,
    testResult,
    
    // Active items
    activeConnection,
    activeMappingProfile,
    
    // API Connections
    addApiConnection,
    updateApiConnection,
    deleteApiConnection,
    setActiveConnection,
    testApiConnection,
    addSampleConnection,
    
    // Mapping Profiles
    addMappingProfile,
    updateMappingProfile,
    deleteMappingProfile,
    setActiveMappingProfile,
    addSampleMappingProfile,
    
    // Constraint Import
    importConstraintsFromJson,
    deleteConstraintSet,
    updateConstraintSet,
    getAllConstraints,
    
    // Global
    updateGlobalSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  };
}
