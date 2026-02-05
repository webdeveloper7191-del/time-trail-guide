 import React, { useState } from 'react';
 import { Plus, Trash2, Edit2, Save, X, Shield, AlertTriangle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { cn } from '@/lib/utils';
 import { ComplianceRule } from '@/types/location';
 
 interface ComplianceRuleEditorProps {
   rules: ComplianceRule[];
   onUpdate: (rules: ComplianceRule[]) => void;
   isEditing: boolean;
 }
 
 const RULE_TYPES = [
   { value: 'ratio', label: 'Staffing Ratio' },
   { value: 'qualification', label: 'Qualification' },
   { value: 'time', label: 'Time-based' },
   { value: 'capacity', label: 'Capacity' },
   { value: 'custom', label: 'Custom' },
 ];
 
 const SEVERITY_OPTIONS = [
   { value: 'info', label: 'Info', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
   { value: 'warning', label: 'Warning', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' },
   { value: 'critical', label: 'Critical', color: 'bg-destructive/20 text-destructive' },
 ];
 
 const ACTION_OPTIONS = [
   { value: 'warn', label: 'Warn Only' },
   { value: 'block', label: 'Block Action' },
   { value: 'escalate', label: 'Escalate' },
 ];
 
 const ComplianceRuleEditor: React.FC<ComplianceRuleEditorProps> = ({
   rules,
   onUpdate,
   isEditing,
 }) => {
   const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
   const [showAddForm, setShowAddForm] = useState(false);
   const [formData, setFormData] = useState<Partial<ComplianceRule>>({
     name: '',
     description: '',
     ruleType: 'ratio',
     severity: 'warning',
     isActive: true,
     action: 'warn',
     conditions: [],
   });
 
   const handleAddRule = () => {
     if (!formData.name?.trim()) return;
     
     const newRule: ComplianceRule = {
       id: `rule-${Date.now()}`,
       name: formData.name,
       description: formData.description || '',
       ruleType: formData.ruleType as ComplianceRule['ruleType'],
       severity: formData.severity as ComplianceRule['severity'],
       isActive: formData.isActive ?? true,
       conditions: formData.conditions || [],
       action: formData.action as ComplianceRule['action'],
     };
     
     onUpdate([...rules, newRule]);
     resetForm();
   };
 
   const handleUpdateRule = () => {
     if (!editingRuleId || !formData.name?.trim()) return;
     
     const updatedRules = rules.map(rule => {
       if (rule.id === editingRuleId) {
         return {
           ...rule,
           name: formData.name!,
           description: formData.description || '',
           ruleType: formData.ruleType as ComplianceRule['ruleType'],
           severity: formData.severity as ComplianceRule['severity'],
           isActive: formData.isActive ?? true,
           action: formData.action as ComplianceRule['action'],
         };
       }
       return rule;
     });
     
     onUpdate(updatedRules);
     resetForm();
   };
 
   const handleDeleteRule = (ruleId: string) => {
     onUpdate(rules.filter(r => r.id !== ruleId));
   };
 
   const handleEditRule = (rule: ComplianceRule) => {
     setEditingRuleId(rule.id);
     setFormData({
       name: rule.name,
       description: rule.description,
       ruleType: rule.ruleType,
       severity: rule.severity,
       isActive: rule.isActive,
       action: rule.action,
       conditions: rule.conditions,
     });
     setShowAddForm(false);
   };
 
   const handleToggleActive = (ruleId: string) => {
     const updatedRules = rules.map(rule => {
       if (rule.id === ruleId) {
         return { ...rule, isActive: !rule.isActive };
       }
       return rule;
     });
     onUpdate(updatedRules);
   };
 
   const resetForm = () => {
     setFormData({
       name: '',
       description: '',
       ruleType: 'ratio',
       severity: 'warning',
       isActive: true,
       action: 'warn',
       conditions: [],
     });
     setEditingRuleId(null);
     setShowAddForm(false);
   };
 
   const getSeverityStyle = (severity: string) => {
     return SEVERITY_OPTIONS.find(s => s.value === severity)?.color || '';
   };
 
   const renderForm = () => (
     <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
       <div className="flex items-center justify-between">
         <h4 className="font-medium text-sm">
           {editingRuleId ? 'Edit Rule' : 'Add New Rule'}
         </h4>
         <Button variant="ghost" size="sm" onClick={resetForm}>
           <X className="h-4 w-4" />
         </Button>
       </div>
 
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label>Rule Name</Label>
           <Input
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             placeholder="e.g., Minimum Staff Check"
           />
         </div>
         <div className="space-y-2">
           <Label>Rule Type</Label>
           <Select
             value={formData.ruleType}
             onValueChange={(v) => setFormData({ ...formData, ruleType: v as ComplianceRule['ruleType'] })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {RULE_TYPES.map(type => (
                 <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       <div className="space-y-2">
         <Label>Description</Label>
         <Textarea
           value={formData.description}
           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
           placeholder="Describe what this rule checks..."
           rows={2}
         />
       </div>
 
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label>Severity</Label>
           <Select
             value={formData.severity}
             onValueChange={(v) => setFormData({ ...formData, severity: v as ComplianceRule['severity'] })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {SEVERITY_OPTIONS.map(opt => (
                 <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
         <div className="space-y-2">
           <Label>Action When Violated</Label>
           <Select
             value={formData.action}
             onValueChange={(v) => setFormData({ ...formData, action: v as ComplianceRule['action'] })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {ACTION_OPTIONS.map(opt => (
                 <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       <div className="flex items-center gap-2">
         <Switch
           checked={formData.isActive}
           onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
         />
         <Label className="text-sm">Rule is Active</Label>
       </div>
 
       <div className="flex justify-end gap-2 pt-2">
         <Button variant="outline" size="sm" onClick={resetForm}>
           Cancel
         </Button>
         <Button 
           size="sm" 
           onClick={editingRuleId ? handleUpdateRule : handleAddRule}
           disabled={!formData.name?.trim()}
         >
           <Save className="h-4 w-4 mr-2" />
           {editingRuleId ? 'Update' : 'Add'} Rule
         </Button>
       </div>
     </div>
   );
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <div>
           <h3 className="text-sm font-semibold text-foreground">Compliance Rules</h3>
           <p className="text-xs text-muted-foreground">Automated compliance checking rules</p>
         </div>
         {isEditing && !showAddForm && !editingRuleId && (
           <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Add Rule
           </Button>
         )}
       </div>
 
       {(showAddForm || editingRuleId) && isEditing && renderForm()}
 
       {rules.length > 0 ? (
         <div className="space-y-3">
           {rules.map(rule => (
             <div 
               key={rule.id} 
               className={cn(
                 "bg-card border border-border rounded-lg p-4",
                 !rule.isActive && "opacity-60"
               )}
             >
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <h4 className="font-medium">{rule.name}</h4>
                   {!rule.isActive && (
                     <Badge variant="secondary" className="text-xs">Inactive</Badge>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <Badge 
                     variant="outline"
                     className={cn('text-xs', getSeverityStyle(rule.severity))}
                   >
                     {rule.severity}
                   </Badge>
                   {isEditing && (
                     <>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => handleToggleActive(rule.id)}
                         title={rule.isActive ? 'Deactivate' : 'Activate'}
                       >
                         <AlertTriangle className={cn("h-4 w-4", rule.isActive ? "text-muted-foreground" : "text-amber-500")} />
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => handleDeleteRule(rule.id)}
                         className="text-destructive hover:text-destructive"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </>
                   )}
                 </div>
               </div>
               <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
               <div className="flex items-center gap-3 text-xs text-muted-foreground">
                 <span className="capitalize">Type: {rule.ruleType}</span>
                 <span>•</span>
                 <span className="capitalize">Action: {rule.action}</span>
               </div>
             </div>
           ))}
         </div>
       ) : !showAddForm && !editingRuleId && (
         <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
           <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
           <p className="text-sm text-muted-foreground">No compliance rules configured</p>
           {isEditing && (
             <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddForm(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Add First Rule
             </Button>
           )}
         </div>
       )}
     </div>
   );
 };
 
 export default ComplianceRuleEditor;