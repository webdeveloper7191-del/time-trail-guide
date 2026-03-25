import { useState } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Repeat, RefreshCw, LayoutList, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, Centre } from '@/types/roster';
import { RecurringPatternsPanel } from './RecurringPatternsPanel';
import { RecurringShiftManagementPanel } from './RecurringShiftManagementPanel';

type TabId = 'patterns' | 'series';

interface UnifiedRecurringPanelProps {
  open: boolean;
  onClose: () => void;
  centreId: string;
  centre: Centre;
  centres: Centre[];
  staff: StaffMember[];
  shifts: Shift[];
  existingShifts: Shift[];
  onGenerateShifts: (shifts: Omit<Shift, 'id'>[]) => void;
  onDeleteSeries: (groupId: string) => void;
  onExtendSeries: (groupId: string, newEndDate: string) => void;
  initialTab?: TabId;
}

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'patterns', label: 'Patterns', icon: LayoutList, description: 'Reusable templates that generate shifts' },
  { id: 'series', label: 'Active Series', icon: CalendarClock, description: 'Manage shifts already on the roster' },
];

export function UnifiedRecurringPanel({
  open,
  onClose,
  centreId,
  centre,
  centres,
  staff,
  shifts,
  existingShifts,
  onGenerateShifts,
  onDeleteSeries,
  onExtendSeries,
  initialTab = 'patterns',
}: UnifiedRecurringPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // When opening with a specific tab, sync it
  const handleClose = () => {
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={handleClose}
      title="Recurring Shifts"
      description="Manage shift patterns and active recurring series"
      icon={Repeat}
      size="3xl"
      showFooter={false}
    >
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <p className="text-xs text-muted-foreground mb-4">
        {TABS.find(t => t.id === activeTab)?.description}
      </p>

      {/* Tab Content */}
      {activeTab === 'patterns' && (
        <RecurringPatternsPanel
          centreId={centreId}
          centre={centre}
          centres={centres}
          staff={staff}
          existingShifts={existingShifts}
          onGenerateShifts={onGenerateShifts}
        />
      )}

      {activeTab === 'series' && (
        <RecurringShiftManagementPanel
          open={true}
          onClose={() => {}} // Managed by parent
          shifts={shifts}
          staff={staff}
          centres={centres}
          onDeleteSeries={onDeleteSeries}
          onEditSeries={() => setActiveTab('patterns')}
          onExtendSeries={onExtendSeries}
          embedded // New prop to skip its own PrimaryOffCanvas wrapper
        />
      )}
    </PrimaryOffCanvas>
  );
}
