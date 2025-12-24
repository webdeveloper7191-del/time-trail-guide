import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShiftTemplate, defaultShiftTemplates } from '@/types/roster';
import { Clock, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShiftTemplateManagerProps {
  open: boolean;
  onClose: () => void;
  customTemplates: ShiftTemplate[];
  onSave: (templates: ShiftTemplate[]) => void;
}

const colorOptions = [
  'hsl(200, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(340, 65%, 50%)',
  'hsl(220, 70%, 55%)',
  'hsl(45, 80%, 45%)',
  'hsl(180, 55%, 45%)',
];

export function ShiftTemplateManager({
  open,
  onClose,
  customTemplates,
  onSave
}: ShiftTemplateManagerProps) {
  const [templates, setTemplates] = useState<ShiftTemplate[]>(customTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<ShiftTemplate>>({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
    color: colorOptions[0],
  });
  const [isAdding, setIsAdding] = useState(false);

  const allTemplates = [...defaultShiftTemplates, ...templates];

  const handleAdd = () => {
    if (!newTemplate.name?.trim()) return;

    const template: ShiftTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name.trim(),
      startTime: newTemplate.startTime || '09:00',
      endTime: newTemplate.endTime || '17:00',
      breakMinutes: newTemplate.breakMinutes || 30,
      color: newTemplate.color || colorOptions[0],
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      color: colorOptions[0],
    });
    setIsAdding(false);
  };

  const handleUpdate = (id: string, updates: Partial<ShiftTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = () => {
    onSave(templates);
    onClose();
  };

  const calculateDuration = (start: string, end: string, breakMins: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const totalMins = (endH * 60 + endM) - (startH * 60 + startM) - breakMins;
    return (totalMins / 60).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Manage Shift Templates
          </DialogTitle>
          <DialogDescription>
            Create and manage reusable shift templates for quick scheduling
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {/* Default Templates */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Default Templates</h4>
              <div className="space-y-2">
                {defaultShiftTemplates.map(template => (
                  <div
                    key={template.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: template.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.startTime} - {template.endTime} • {template.breakMinutes}min break
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {calculateDuration(template.startTime, template.endTime, template.breakMinutes)}h
                    </Badge>
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Templates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Custom Templates</h4>
                {!isAdding && (
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Template
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      editingId === template.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    {editingId === template.id ? (
                      <>
                        <div className="flex-1 grid grid-cols-5 gap-2">
                          <Input
                            value={template.name}
                            onChange={(e) => handleUpdate(template.id, { name: e.target.value })}
                            placeholder="Name"
                            className="col-span-2"
                          />
                          <Input
                            type="time"
                            value={template.startTime}
                            onChange={(e) => handleUpdate(template.id, { startTime: e.target.value })}
                          />
                          <Input
                            type="time"
                            value={template.endTime}
                            onChange={(e) => handleUpdate(template.id, { endTime: e.target.value })}
                          />
                          <Input
                            type="number"
                            value={template.breakMinutes}
                            onChange={(e) => handleUpdate(template.id, { breakMinutes: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={120}
                          />
                        </div>
                        <div className="flex gap-1">
                          {colorOptions.map(color => (
                            <button
                              key={color}
                              className={cn(
                                "h-5 w-5 rounded-full border-2",
                                template.color === color ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => handleUpdate(template.id, { color })}
                            />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(null)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: template.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.startTime} - {template.endTime} • {template.breakMinutes}min break
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {calculateDuration(template.startTime, template.endTime, template.breakMinutes)}h
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(template.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add new template form */}
                {isAdding && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5">
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      <Input
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Template name"
                        className="col-span-2"
                      />
                      <Input
                        type="time"
                        value={newTemplate.startTime}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                      <Input
                        type="time"
                        value={newTemplate.endTime}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                      <Input
                        type="number"
                        value={newTemplate.breakMinutes}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                        placeholder="Break"
                        min={0}
                        max={120}
                      />
                    </div>
                    <div className="flex gap-1">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "h-5 w-5 rounded-full border-2",
                            newTemplate.color === color ? "border-foreground" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTemplate(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAdd}
                      disabled={!newTemplate.name?.trim()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAdding(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {templates.length === 0 && !isAdding && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No custom templates yet. Click "Add Template" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
