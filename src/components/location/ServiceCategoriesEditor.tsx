 import React, { useState } from 'react';
 import { Plus, Trash2, X, FolderTree } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Label } from '@/components/ui/label';
 import { IndustryType, INDUSTRY_TEMPLATES } from '@/types/industryConfig';
 
 interface ServiceCategoriesEditorProps {
   categories: string[];
   onUpdate: (categories: string[]) => void;
   isEditing: boolean;
   industryType?: IndustryType;
 }
 
 // Industry-specific default service categories
 const getDefaultServiceCategories = (industryType?: IndustryType): string[] => {
   switch (industryType) {
     case 'childcare':
       return ['Nursery', 'Toddlers', 'Pre-Kindy', 'Kindergarten', 'School Age', 'Mixed Age'];
     case 'healthcare':
       return ['General Ward', 'ICU', 'Emergency', 'Maternity', 'Paediatrics', 'Outpatient'];
     case 'hospitality':
       return ['Kitchen', 'Bar', 'Floor Service', 'Events', 'Takeaway'];
     case 'retail':
       return ['Checkout', 'Floor', 'Stockroom', 'Customer Service', 'Click & Collect'];
     case 'call_center':
       return ['Inbound', 'Outbound', 'Technical Support', 'Sales', 'Escalations'];
     case 'manufacturing':
       return ['Assembly Line', 'Quality Control', 'Packaging', 'Warehouse', 'Dispatch'];
     case 'events':
       return ['Front of House', 'Back of House', 'Security', 'VIP', 'Technical'];
     default:
       return ['Category A', 'Category B', 'Category C'];
   }
 };
 
 const ServiceCategoriesEditor: React.FC<ServiceCategoriesEditorProps> = ({
   categories,
   onUpdate,
   isEditing,
   industryType,
 }) => {
   const [newCategory, setNewCategory] = useState('');
 
   const handleAddCategory = () => {
     if (newCategory.trim() && !categories.includes(newCategory.trim())) {
       onUpdate([...categories, newCategory.trim()]);
       setNewCategory('');
     }
   };
 
   const handleRemoveCategory = (category: string) => {
     onUpdate(categories.filter(c => c !== category));
   };
 
   const handleApplyDefaults = () => {
     const defaults = getDefaultServiceCategories(industryType);
     // Merge with existing, avoiding duplicates
     const merged = [...new Set([...categories, ...defaults])];
     onUpdate(merged);
   };
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter') {
       e.preventDefault();
       handleAddCategory();
     }
   };
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
             <FolderTree className="h-4 w-4" />
              Area Settings
           </h3>
            <p className="text-xs text-muted-foreground">Define available settings for areas at this location</p>
         </div>
         {isEditing && industryType && industryType !== 'custom' && (
           <Button size="sm" variant="outline" onClick={handleApplyDefaults}>
             <Plus className="h-4 w-4 mr-2" />
             Apply {INDUSTRY_TEMPLATES.find(t => t.id === industryType)?.name || 'Industry'} Defaults
           </Button>
         )}
       </div>
 
       {isEditing && (
         <div className="flex gap-2">
           <Input
             value={newCategory}
             onChange={(e) => setNewCategory(e.target.value)}
             onKeyPress={handleKeyPress}
             placeholder="Add new category..."
             className="flex-1"
           />
           <Button size="sm" onClick={handleAddCategory} disabled={!newCategory.trim()}>
             <Plus className="h-4 w-4" />
           </Button>
         </div>
       )}
 
       {categories.length > 0 ? (
         <div className="flex flex-wrap gap-2">
           {categories.map((category) => (
             <Badge key={category} variant="secondary" className="text-sm py-1.5 px-3">
               {category}
               {isEditing && (
                 <button
                   onClick={() => handleRemoveCategory(category)}
                   className="ml-2 hover:text-destructive"
                 >
                   <X className="h-3 w-3" />
                 </button>
               )}
             </Badge>
           ))}
         </div>
       ) : (
         <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
           <FolderTree className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
           <p className="text-sm text-muted-foreground">No service categories defined</p>
           {isEditing && industryType && industryType !== 'custom' && (
             <Button size="sm" variant="outline" className="mt-3" onClick={handleApplyDefaults}>
               <Plus className="h-4 w-4 mr-2" />
               Load Industry Defaults
             </Button>
           )}
         </div>
       )}
     </div>
   );
 };
 
 export default ServiceCategoriesEditor;