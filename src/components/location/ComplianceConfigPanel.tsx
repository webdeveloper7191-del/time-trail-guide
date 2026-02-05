import React, { useState } from 'react';
import { Settings, Shield, Users, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { INDUSTRY_TEMPLATES, IndustryType } from '@/types/industryConfig';
import { industryComplianceConfigs } from '@/data/mockLocationData';

const ComplianceConfigPanel: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('childcare');
  
  const template = INDUSTRY_TEMPLATES.find(t => t.id === selectedIndustry);
  const complianceConfig = industryComplianceConfigs.find(c => c.industryType === selectedIndustry);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Compliance Configuration</h2>
          <p className="text-sm text-muted-foreground">Industry-specific compliance rules, ratios, and qualification requirements</p>
        </div>
        <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as IndustryType)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_TEMPLATES.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Industry Overview */}
      {template && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Demand Unit</p>
                  <p className="font-medium">{template.demandConfig.demandUnitPlural}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Primary Metric</p>
                  <p className="font-medium">{template.demandConfig.primaryMetric}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Staff Role</p>
                  <p className="font-medium">{template.staffingConfig.roleLabelPlural}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regulatory Info */}
      {complianceConfig && complianceConfig.regulatoryBody && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">{complianceConfig.regulatoryBody}</h4>
                <p className="text-xs text-muted-foreground">{complianceConfig.regulatoryReference}</p>
              </div>
            </div>
            {complianceConfig.regulatoryUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={complianceConfig.regulatoryUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Guidelines
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Default Ratios */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Default Staffing Ratios</h3>
          </div>
          
          {complianceConfig?.defaultRatios && complianceConfig.defaultRatios.length > 0 ? (
            <div className="space-y-3">
              {complianceConfig.defaultRatios.map(ratio => (
                <div key={ratio.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{ratio.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ratio.minAttendance}-{ratio.maxAttendance} {ratio.demandUnit.toLowerCase()} → {ratio.staffRequired} staff
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm font-medium">
                    {ratio.minAttendance}-{ratio.maxAttendance} → {ratio.staffRequired}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No default ratios configured</p>
          )}
        </div>

        {/* Default Qualifications */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Default Qualification Requirements</h3>
          </div>
          
          {complianceConfig?.defaultQualifications && complianceConfig.defaultQualifications.length > 0 ? (
            <div className="space-y-3">
              {complianceConfig.defaultQualifications.map(qual => (
                <div key={qual.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{qual.qualificationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {qual.requirementType === 'mandatory' ? 'Required for all staff' :
                       qual.requirementType === 'percentage' ? `${qual.percentageRequired}% of staff` :
                       'Preferred'}
                    </p>
                  </div>
                  <Badge 
                    variant={qual.requirementType === 'mandatory' ? 'default' : 'outline'}
                    className={cn(
                      'text-xs',
                      qual.requirementType === 'mandatory' && 'bg-destructive text-destructive-foreground',
                      qual.requirementType === 'percentage' && 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
                    )}
                  >
                    {qual.qualificationShortName}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No default qualifications configured</p>
          )}
        </div>
      </div>

      {/* Area Presets */}
      {complianceConfig?.areaPresets && complianceConfig.areaPresets.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Area Presets</h3>
          <p className="text-xs text-muted-foreground mb-4">Pre-configured area templates for quick setup</p>
          
          <div className="grid grid-cols-4 gap-3">
            {complianceConfig.areaPresets.map((preset, index) => (
              <div 
                key={index}
                className="bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <h4 className="font-medium text-sm">{preset.name}</h4>
                <p className="text-xs text-muted-foreground">{preset.serviceCategory || preset.serviceType}</p>
                <p className="text-xs text-muted-foreground">Capacity: {preset.capacity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations */}
      {template?.integrations && template.integrations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Available Integrations</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {template.integrations.map(integration => (
              <div 
                key={integration.id}
                className="flex items-center justify-between bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-sm">{integration.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceConfigPanel;
