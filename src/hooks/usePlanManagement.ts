import { AssignedPlan, PerformancePlanTemplate, PlanStatus } from '@/types/performancePlan';
import { toast } from 'sonner';
import { performancePlanStore, usePerformancePlanStore } from '@/lib/performancePlanStore';

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
  const { assignedPlans, customTemplates } = usePerformancePlanStore();

  // Plan management
  const createPlan = async (data: Omit<AssignedPlan, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<AssignedPlan | null> => {
    try {
      const newPlan = performancePlanStore.createPlan(data);
      toast.success('Performance plan created successfully');
      return newPlan;
    } catch (error) {
      toast.error('Failed to create plan');
      return null;
    }
  };

  const updatePlanStatus = async (planId: string, status: PlanStatus): Promise<boolean> => {
    try {
      if (!performancePlanStore.updatePlanStatus(planId, status)) throw new Error('Plan not found');
      
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
  };

  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      if (!performancePlanStore.deletePlan(planId)) throw new Error('Plan not found');
      toast.success('Plan deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete plan');
      return false;
    }
  };

  const extendPlan = async (planId: string, newEndDate: string): Promise<boolean> => {
    try {
      if (!performancePlanStore.extendPlan(planId, newEndDate)) throw new Error('Plan not found');
      toast.success('Plan extended successfully');
      return true;
    } catch (error) {
      toast.error('Failed to extend plan');
      return false;
    }
  };

  // Template management
  const createTemplate = async (data: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformancePlanTemplate | null> => {
    try {
      const newTemplate = performancePlanStore.createTemplate(data);
      toast.success('Template created successfully');
      return newTemplate;
    } catch (error) {
      toast.error('Failed to create template');
      return null;
    }
  };

  const updateTemplate = async (templateId: string, updates: Partial<PerformancePlanTemplate>): Promise<PerformancePlanTemplate | null> => {
    try {
      const updatedTemplate = performancePlanStore.updateTemplate(templateId, updates);
      if (!updatedTemplate) throw new Error('Template not found');
      toast.success('Template updated successfully');
      return updatedTemplate;
    } catch (error) {
      toast.error('Failed to update template');
      return null;
    }
  };

  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    try {
      if (!performancePlanStore.deleteTemplate(templateId)) throw new Error('Template cannot be deleted');
      toast.success('Template deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete template');
      return false;
    }
  };

  const archiveTemplate = async (templateId: string): Promise<boolean> => {
    try {
      if (!performancePlanStore.archiveTemplate(templateId)) throw new Error('Template cannot be archived');
      toast.success('Template archived');
      return true;
    } catch (error) {
      toast.error('Failed to archive template');
      return false;
    }
  };

  const duplicateTemplate = (template: PerformancePlanTemplate): PerformancePlanTemplate => {
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
  };

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
