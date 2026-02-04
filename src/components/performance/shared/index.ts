// Shared performance components
export { PerformanceNavigation, tabGroups, allItems } from '../PerformanceNavigation';
export type { TabItem, TabGroup } from '../PerformanceNavigation';
export { PerformanceNotificationBell } from '../PerformanceNotificationBell';
export { PerformanceSettingsDrawer } from '../PerformanceSettingsDrawer';
export type { PerformanceSettings } from '../PerformanceSettingsDrawer';
export { RichTextEditor } from '../RichTextEditor';
export { BulkActionsBar, createGoalBulkActions, createReviewBulkActions } from './BulkActionsBar';
export { InlineBulkActions } from './InlineBulkActions';
export { GlobalSearch } from './GlobalSearch';

// UI Enhancement Components
export { StatusBadge, statusConfigs } from './StatusBadge';
export type { StatusType } from './StatusBadge';
export { SemanticProgressBar, getProgressStatus } from './SemanticProgressBar';
export type { ProgressStatus } from './SemanticProgressBar';
export { EnhancedCard } from './EnhancedCard';

// Layout Components
export { CollapsibleStatsGrid } from './CollapsibleStatsGrid';
export { ScrollableTable } from './ScrollableTable';
export { RowActionsMenu } from './RowActionsMenu';
export type { RowAction } from './RowActionsMenu';

// Form Section Components (for drawer/panel layouts)
export { FormSection, FormField, FormRow, FormActionsRow } from '@/components/ui/off-canvas/FormSection';
