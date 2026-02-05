import { useState } from 'react';
import { format } from 'date-fns';
import { Shift } from '@/types/roster';
import { 
  History, 
  Undo2, 
  Plus, 
  Trash2, 
  Edit, 
  MoveHorizontal,
  Clock,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface HistoryEntry {
  id: string;
  timestamp: Date;
  actionType: 'add' | 'delete' | 'update' | 'move' | 'resize' | 'bulk' | 'copy' | 'undo' | 'redo' | 'initial';
  description: string;
  shiftsSnapshot: Shift[];
  changedShiftIds?: string[];
}

interface RosterHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  historyEntries: HistoryEntry[];
  currentIndex: number;
  onRevertToIndex: (index: number) => void;
}

export function RosterHistoryPanel({
  open,
  onClose,
  historyEntries,
  currentIndex,
  onRevertToIndex,
}: RosterHistoryPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getActionIcon = (type: HistoryEntry['actionType']) => {
    switch (type) {
      case 'add':
        return <Plus size={14} className="text-green-600" />;
      case 'delete':
        return <Trash2 size={14} className="text-red-600" />;
      case 'update':
        return <Edit size={14} className="text-blue-600" />;
      case 'move':
        return <MoveHorizontal size={14} className="text-purple-600" />;
      case 'resize':
        return <Clock size={14} className="text-orange-600" />;
      case 'bulk':
        return <Plus size={14} className="text-indigo-600" />;
      case 'copy':
        return <Undo2 size={14} className="text-cyan-600" />;
      case 'undo':
        return <Undo2 size={14} className="text-gray-600" />;
      case 'redo':
        return <Undo2 size={14} className="text-gray-600" style={{ transform: 'scaleX(-1)' }} />;
      case 'initial':
        return <History size={14} className="text-gray-400" />;
      default:
        return <Edit size={14} />;
    }
  };

  const getActionColor = (type: HistoryEntry['actionType']) => {
    switch (type) {
      case 'add':
        return 'success';
      case 'delete':
        return 'error';
      case 'update':
        return 'primary';
      case 'move':
        return 'secondary';
      case 'resize':
        return 'warning';
      case 'bulk':
        return 'info';
      case 'copy':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Change History"
      description="Click any entry to revert to that state"
      icon={History}
      size="sm"
      showFooter={false}
    >
      <FormSection title="History Entries">
        <ScrollArea className="h-[400px]">
        {historyEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-background rounded-lg border">
            <History size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No changes recorded yet</p>
            <p className="text-xs text-muted-foreground">Changes will appear here as you modify shifts</p>
          </div>
        ) : (
          <div className="space-y-1">
            {historyEntries.map((entry, index) => {
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              
              return (
                <div
                  key={entry.id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => !isCurrent && onRevertToIndex(index)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    "hover:bg-muted/50",
                    isCurrent ? "border-primary bg-primary/5" : "border-border bg-background",
                    isFuture && "opacity-60",
                    !isCurrent && "hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-center w-6">
                    {getActionIcon(entry.actionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm truncate", isCurrent && "font-semibold")}>
                        {entry.description}
                      </span>
                      {isCurrent && (
                        <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-primary text-primary-foreground">
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(entry.timestamp, 'h:mm:ss a')}
                    </span>
                  </div>
                    {hoveredIndex === index && !isCurrent && (
                    <RotateCcw size={14} className="text-primary shrink-0" />
                    )}
                </div>
              );
            })}
          </div>
        )}
        </ScrollArea>
      </FormSection>

      <div className="mt-4 p-3 bg-background border rounded-lg text-center">
        <span className="text-xs text-muted-foreground">
          {historyEntries.length} entries • Auto-saved
        </span>
      </div>
    </PrimaryOffCanvas>
  );
}

export type { HistoryEntry };
