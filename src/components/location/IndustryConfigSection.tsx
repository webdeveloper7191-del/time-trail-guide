 import React from 'react';
 import { Settings, Shield, ExternalLink, Users, FileText } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { cn } from '@/lib/utils';
 import { INDUSTRY_TEMPLATES, IndustryType } from '@/types/industryConfig';
 import { industryComplianceConfigs } from '@/data/mockLocationData';
 
 interface IndustryConfigSectionProps {
   industryType: IndustryType;
   onIndustryChange?: (industryType: IndustryType) => void;
   isEditing: boolean;
   showRatios?: boolean;
   showQualifications?: boolean;
 }
 
 const IndustryConfigSection: React.FC<IndustryConfigSectionProps> = ({
   industryType,
   onIndustryChange,
   isEditing,
   showRatios = true,
   showQualifications = true,
 }) => {
   const template = INDUSTRY_TEMPLATES.find(t => t.id === industryType);
   const complianceConfig = industryComplianceConfigs.find(c => c.industryType === industryType);
 
   return (
     <div className="space-y-4">
       {/* Industry Selector */}
       <div className="bg-card border border-border rounded-lg p-4 space-y-4">
         <div className="flex items-center gap-2">
           <Settings className="h-4 w-4 text-primary" />
           <h3 className="text-sm font-semibold text-foreground">Industry Configuration</h3>
         </div>
         
         {isEditing ? (
           <div className="space-y-2">
             <Label>Industry Type</Label>
             <Select value={industryType} onValueChange={(v) => onIndustryChange?.(v as IndustryType)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {INDUSTRY_TEMPLATES.map(t => (
                   <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         ) : (
           <div className="flex items-center gap-2">
             <Badge variant="outline" className="capitalize">{industryType}</Badge>
             {template && <span className="text-sm text-muted-foreground">{template.name}</span>}
           </div>
         )}
         
         {template && (
           <div className="grid grid-cols-3 gap-3 pt-2">
             <div className="bg-muted/30 rounded-lg p-3">
               <p className="text-xs text-muted-foreground">Demand Unit</p>
               <p className="font-medium text-sm">{template.demandConfig.demandUnitPlural}</p>
             </div>
             <div className="bg-muted/30 rounded-lg p-3">
               <p className="text-xs text-muted-foreground">Primary Metric</p>
               <p className="font-medium text-sm">{template.demandConfig.primaryMetric}</p>
             </div>
             <div className="bg-muted/30 rounded-lg p-3">
               <p className="text-xs text-muted-foreground">Staff Role</p>
               <p className="font-medium text-sm">{template.staffingConfig.roleLabelPlural}</p>
             </div>
           </div>
         )}
       </div>
 
       {/* Regulatory Info */}
       {complianceConfig && complianceConfig.regulatoryBody && (
         <div className="bg-card border border-border rounded-lg p-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Shield className="h-5 w-5 text-primary" />
               <div>
                 <h4 className="font-medium text-sm">{complianceConfig.regulatoryBody}</h4>
                 <p className="text-xs text-muted-foreground">{complianceConfig.regulatoryReference}</p>
               </div>
             </div>
             {complianceConfig.regulatoryUrl && (
               <Button variant="outline" size="sm" asChild>
                 <a href={complianceConfig.regulatoryUrl} target="_blank" rel="noopener noreferrer">
                   <ExternalLink className="h-4 w-4 mr-2" />
                   Guidelines
                 </a>
               </Button>
             )}
           </div>
         </div>
       )}
 
       {/* Default Ratios Preview */}
       {showRatios && complianceConfig?.defaultRatios && complianceConfig.defaultRatios.length > 0 && (
         <div className="bg-card border border-border rounded-lg p-4">
           <div className="flex items-center gap-2 mb-3">
             <Users className="h-4 w-4 text-primary" />
             <h4 className="font-medium text-sm">Industry Default Ratios</h4>
           </div>
           <div className="space-y-2">
             {complianceConfig.defaultRatios.slice(0, 4).map(ratio => (
               <div key={ratio.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                 <span className="text-sm">{ratio.name}</span>
                 <Badge variant="outline" className="font-mono">
                   {ratio.ratioNumerator}:{ratio.ratioDenominator}
                 </Badge>
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* Default Qualifications Preview */}
       {showQualifications && complianceConfig?.defaultQualifications && complianceConfig.defaultQualifications.length > 0 && (
         <div className="bg-card border border-border rounded-lg p-4">
           <div className="flex items-center gap-2 mb-3">
             <FileText className="h-4 w-4 text-primary" />
             <h4 className="font-medium text-sm">Industry Default Qualifications</h4>
           </div>
           <div className="flex flex-wrap gap-2">
             {complianceConfig.defaultQualifications.map(qual => (
               <Badge 
                 key={qual.id}
                 variant={qual.requirementType === 'mandatory' ? 'default' : 'outline'}
                 className={cn(
                   'text-xs',
                   qual.requirementType === 'mandatory' && 'bg-red-500 text-white',
                   qual.requirementType === 'percentage' && 'bg-amber-100 text-amber-700 border-amber-200',
                 )}
               >
                 {qual.qualificationShortName}
                 {qual.requirementType === 'percentage' && ` (${qual.percentageRequired}%)`}
               </Badge>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default IndustryConfigSection;