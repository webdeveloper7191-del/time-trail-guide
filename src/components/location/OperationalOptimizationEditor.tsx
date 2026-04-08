import React, { useState } from 'react';
import { 
  Settings2, Zap, Clock, DollarSign, Bell, ChevronDown, ChevronUp, 
  Lightbulb, Plus, RotateCcw, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AreaCombiningThreshold, OperationalOptimization } from '@/types/location';
import { IndustryType, INDUSTRY_TEMPLATES } from '@/types/industryConfig';
import { getIndustryOptimizationDefaults } from '@/lib/areaCombiningEngine';
import AreaCombiningEditor from './AreaCombiningEditor';

interface OperationalOptimizationEditorProps {
  optimization?: OperationalOptimization;
  thresholds: AreaCombiningThreshold[];
  onUpdateThresholds: (thresholds: AreaCombiningThreshold[]) => void;
  onUpdateOptimization?: (optimization: OperationalOptimization) => void;
  isEditing: boolean;
  industryType?: IndustryType;
  availableServiceCategories?: string[];
}

const OPTIMIZATION_LABELS: Record<string, { icon: string; label: string }> = {
  childcare: { icon: '🏫', label: 'Room Combining' },
  healthcare: { icon: '🏥', label: 'Ward Consolidation' },
  retail: { icon: '🏪', label: 'Zone Merging' },
  hospitality: { icon: '🍽️', label: 'Section Combining' },
  call_center: { icon: '📞', label: 'Queue Merging' },
  manufacturing: { icon: '🏭', label: 'Line Consolidation' },
  events: { icon: '🎪', label: 'Area Combining' },
};

const OperationalOptimizationEditor: React.FC<OperationalOptimizationEditorProps> = ({
  optimization,
  thresholds,
  onUpdateThresholds,
  onUpdateOptimization,
  isEditing,
  industryType,
  availableServiceCategories,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showContext, setShowContext] = useState(false);
  
  const industryDefaults = industryType ? getIndustryOptimizationDefaults(industryType) : null;
  const optLabel = OPTIMIZATION_LABELS[industryType || ''] || { icon: '⚙️', label: 'Area Optimization' };
  const industryName = INDUSTRY_TEMPLATES.find(t => t.id === industryType)?.name || 'Industry';

  const handleApplyIndustryDefaults = () => {
    if (!industryDefaults) return;
    onUpdateThresholds(industryDefaults.thresholds);
    
    if (onUpdateOptimization && optimization) {
      onUpdateOptimization({
        ...optimization,
        peakOptimizationWindows: industryDefaults.optimizationWindows,
        industryContext: industryDefaults.context,
        isEnabled: true,
      });
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    if (onUpdateOptimization && optimization) {
      onUpdateOptimization({ ...optimization, isEnabled: enabled });
    }
  };

  const handleToggleWindow = (index: number, isActive: boolean) => {
    if (!onUpdateOptimization || !optimization?.peakOptimizationWindows) return;
    const updated = [...optimization.peakOptimizationWindows];
    updated[index] = { ...updated[index], isActive };
    onUpdateOptimization({ ...optimization, peakOptimizationWindows: updated });
  };

  const handleUpdateSavings = (value: number) => {
    if (onUpdateOptimization && optimization) {
      onUpdateOptimization({ ...optimization, estimatedSavingsPerCombine: value });
    }
  };

  const windows = optimization?.peakOptimizationWindows || industryDefaults?.optimizationWindows || [];
  const context = optimization?.industryContext || industryDefaults?.context || '';

  return (
    <div className="space-y-6">
      {/* Header with industry context */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {optLabel.icon} {optLabel.label} Optimization
          </h3>
          <p className="text-xs text-muted-foreground">
            Automatically detect and suggest when areas should be combined during low-demand periods
          </p>
        </div>
        <div className="flex items-center gap-2">
          {optimization && isEditing && (
            <div className="flex items-center gap-2">
              <Switch
                checked={optimization.isEnabled}
                onCheckedChange={handleToggleEnabled}
              />
              <Label className="text-xs">
                {optimization.isEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Industry Context Banner */}
      {context && (
        <div 
          className="bg-primary/5 border border-primary/20 rounded-lg p-3 cursor-pointer"
          onClick={() => setShowContext(!showContext)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {industryName} Optimization Insight
              </span>
            </div>
            {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </div>
          {showContext && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{context}</p>
          )}
        </div>
      )}

      {/* Apply Defaults Button */}
      {isEditing && industryType && industryType !== 'custom' && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleApplyIndustryDefaults}>
            <Sparkles className="h-4 w-4 mr-2" />
            Apply {industryName} Best Practices
          </Button>
          {thresholds.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => onUpdateThresholds([])}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      )}

      {/* Peak Optimization Windows */}
      {windows.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">Peak Optimization Windows</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Time windows when combining is most beneficial based on typical {industryName.toLowerCase()} demand patterns
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {windows.map((window, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  window.isActive 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div>
                  <span className="text-xs font-medium">{window.label}</span>
                  <div className="text-xs text-muted-foreground">
                    {window.startTime} – {window.endTime}
                  </div>
                </div>
                {isEditing ? (
                  <Switch
                    checked={window.isActive}
                    onCheckedChange={(checked) => handleToggleWindow(idx, checked)}
                  />
                ) : (
                  <Badge variant={window.isActive ? 'default' : 'secondary'} className="text-xs">
                    {window.isActive ? 'Active' : 'Off'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thresholds (existing AreaCombiningEditor) */}
      <AreaCombiningEditor
        thresholds={thresholds}
        onUpdate={onUpdateThresholds}
        isEditing={isEditing}
        industryType={industryType}
        availableServiceCategories={availableServiceCategories}
      />

      {/* Advanced Settings */}
      <div className="border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="flex items-center gap-2">
            <Settings2 className="h-3 w-3" />
            Advanced Settings
          </span>
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 bg-muted/20 rounded-lg p-4">
            {/* Cost Tracking */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Estimated Savings per Combine Event</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={optimization?.estimatedSavingsPerCombine ?? 50}
                  onChange={(e) => handleUpdateSavings(parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                  className="w-32"
                />
                <span className="text-xs text-muted-foreground">per event (used in budget reports)</span>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Notifications</Label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Notify Managers</Label>
                  <p className="text-xs text-muted-foreground">Send alerts when combining is recommended</p>
                </div>
                <Switch
                  checked={optimization?.notifyManagers ?? true}
                  disabled={!isEditing}
                  onCheckedChange={(checked) => {
                    if (onUpdateOptimization && optimization) {
                      onUpdateOptimization({ ...optimization, notifyManagers: checked });
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Notify Affected Staff</Label>
                  <p className="text-xs text-muted-foreground">Alert staff when they are reassigned</p>
                </div>
                <Switch
                  checked={optimization?.notifyStaff ?? false}
                  disabled={!isEditing}
                  onCheckedChange={(checked) => {
                    if (onUpdateOptimization && optimization) {
                      onUpdateOptimization({ ...optimization, notifyStaff: checked });
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-Apply Combining</Label>
                  <p className="text-xs text-muted-foreground">Automatically combine without manager approval</p>
                </div>
                <Switch
                  checked={optimization?.autoApply ?? false}
                  disabled={!isEditing}
                  onCheckedChange={(checked) => {
                    if (onUpdateOptimization && optimization) {
                      onUpdateOptimization({ ...optimization, autoApply: checked });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationalOptimizationEditor;
