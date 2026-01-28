import { useState, useCallback } from 'react';
import { AssignedPlan, PerformancePlanTemplate, PlanStatus } from '@/types/performancePlan';
import { mockAssignedPlans, performancePlanTemplates } from '@/data/mockPerformancePlanTemplates';
import { toast } from 'sonner';

interface UsePlanManagementReturn {
  // Plans
  assignedPlans: AssignedPlan[];
  createPlan: (data: Omit<AssignedPlan, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => Promise<AssignedPlan | null>;
  updatePlanStatus: (planId: string, status: PlanStatus) => Promise<boolean>;
  deletePlan: (planId: string) => Promise<boolean>;
  extendPlan: (planId: string, newEndDate: string) => Promise<boolean>;
  
  // Templates
  customTemplates: PerformancePlanTemplate[];
  createTemplate: (data: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PerformancePlanTemplate | null>;
  updateTemplate: (templateId: string, updates: Partial<PerformancePlanTemplate>) => Promise<PerformancePlanTemplate | null>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  archiveTemplate: (templateId: string) => Promise<boolean>;
  duplicateTemplate: (template: PerformancePlanTemplate) => PerformancePlanTemplate;
}

export function usePlanManagement(): UsePlanManagementReturn {
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlan[]>(mockAssignedPlans);
  const [customTemplates, setCustomTemplates] = useState<PerformancePlanTemplate[]>([]);

  // Plan management
  const createPlan = useCallback(async (data: Omit<AssignedPlan, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<AssignedPlan | null> => {
    try {
      const newPlan: AssignedPlan = {
        ...data,
        id: `plan-${Date.now()}`,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAssignedPlans(prev => [...prev, newPlan]);
      toast.success('Performance plan created successfully');
      return newPlan;
    } catch (error) {
      toast.error('Failed to create plan');
      return null;
    }
  }, []);

  const updatePlanStatus = useCallback(async (planId: string, status: PlanStatus): Promise<boolean> => {
    try {
      setAssignedPlans(prev => prev.map(p => 
        p.id === planId 
          ? { ...p, status, updatedAt: new Date().toISOString() } 
          : p
      ));
      
      const statusMessages: Record<PlanStatus, string> = {
        active: 'Plan activated',
        completed: 'Plan marked as completed',
        cancelled: 'Plan cancelled',
        on_hold: 'Plan put on hold',
        draft: 'Plan reverted to draft',
      };
      
      toast.success(statusMessages[status] || 'Plan status updated');
      return true;
    } catch (error) {
      toast.error('Failed to update plan status');
      return false;
    }
  }, []);

  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    try {
      setAssignedPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Plan deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete plan');
      return false;
    }
  }, []);

  const extendPlan = useCallback(async (planId: string, newEndDate: string): Promise<boolean> => {
    try {
      setAssignedPlans(prev => prev.map(p => 
        p.id === planId 
          ? { ...p, endDate: newEndDate, updatedAt: new Date().toISOString() } 
          : p
      ));
      toast.success('Plan extended successfully');
      return true;
    } catch (error) {
      toast.error('Failed to extend plan');
      return false;
    }
  }, []);

  // Template management
  const createTemplate = useCallback(async (data: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformancePlanTemplate | null> => {
    try {
      const newTemplate: PerformancePlanTemplate = {
        ...data,
        id: `tpl-custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomTemplates(prev => [...prev, newTemplate]);
      toast.success('Template created successfully');
      return newTemplate;
    } catch (error) {
      toast.error('Failed to create template');
      return null;
    }
  }, []);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<PerformancePlanTemplate>): Promise<PerformancePlanTemplate | null> => {
    try {
      let updatedTemplate: PerformancePlanTemplate | null = null;
      setCustomTemplates(prev => prev.map(t => {
        if (t.id === templateId) {
          updatedTemplate = { ...t, ...updates, updatedAt: new Date().toISOString() };
          return updatedTemplate;
        }
        return t;
      }));
      toast.success('Template updated successfully');
      return updatedTemplate;
    } catch (error) {
      toast.error('Failed to update template');
      return null;
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      // Check if template is system template
      const isSystem = performancePlanTemplates.find(t => t.id === templateId)?.isSystem;
      if (isSystem) {
        toast.error('Cannot delete system templates');
        return false;
      }
      
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete template');
      return false;
    }
  }, []);

  const archiveTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      // In a real app, this would set an 'archived' flag
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template archived');
      return true;
    } catch (error) {
      toast.error('Failed to archive template');
      return false;
    }
  }, []);

  const duplicateTemplate = useCallback((template: PerformancePlanTemplate): PerformancePlanTemplate => {
    const duplicated: PerformancePlanTemplate = {
      ...template,
      id: `tpl-custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isSystem: false,
      goals: template.goals.map(g => ({
        ...g,
        id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        milestones: g.milestones.map(m => ({ ...m })),
      })),
      reviews: template.reviews.map(r => ({
        ...r,
        id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      conversations: template.conversations.map(c => ({
        ...c,
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return duplicated;
  }, []);

  return {
    assignedPlans,
    createPlan,
    updatePlanStatus,
    deletePlan,
    extendPlan,
    customTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    archiveTemplate,
    duplicateTemplate,
  };
}
