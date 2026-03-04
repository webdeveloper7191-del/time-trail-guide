import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, GripVertical, Pencil, Trash2, ToggleLeft, Eye,
  Shirt, UtensilsCrossed, Phone, Car, Languages, Heart,
  FileText, ShieldCheck, HelpCircle, Type, List, CheckSquare, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type QuestionType = 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'file_upload';
type QuestionCategory = 'personal' | 'compliance' | 'preferences' | 'custom';

interface OnboardingQuestion {
  id: string;
  question: string;
  description?: string;
  type: QuestionType;
  category: QuestionCategory;
  required: boolean;
  enabled: boolean;
  options?: string[];
  isBuiltIn: boolean;
  order: number;
}

const questionTypeConfig: Record<QuestionType, { label: string; icon: React.ElementType }> = {
  text: { label: 'Short Text', icon: Type },
  textarea: { label: 'Long Text', icon: FileText },
  dropdown: { label: 'Dropdown', icon: List },
  checkbox: { label: 'Checkbox', icon: CheckSquare },
  file_upload: { label: 'File Upload', icon: Upload },
};

const categoryConfig: Record<QuestionCategory, { label: string; color: string }> = {
  personal: { label: 'Personal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  compliance: { label: 'Compliance', color: 'bg-red-100 text-red-700 border-red-200' },
  preferences: { label: 'Preferences', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  custom: { label: 'Custom', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const defaultQuestions: OnboardingQuestion[] = [
  { id: 'q1', question: 'Uniform / Shirt Size', description: 'Select your preferred uniform size for ordering', type: 'dropdown', category: 'preferences', required: true, enabled: true, options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'], isBuiltIn: true, order: 1 },
  { id: 'q2', question: 'Dietary Requirements', description: 'Any allergies or dietary needs we should know about', type: 'checkbox', category: 'preferences', required: false, enabled: true, options: ['Vegetarian', 'Vegan', 'Gluten Free', 'Halal', 'Kosher', 'Nut Allergy', 'Lactose Intolerant', 'None'], isBuiltIn: true, order: 2 },
  { id: 'q3', question: 'Emergency Contact Name', description: 'Full name of your primary emergency contact', type: 'text', category: 'personal', required: true, enabled: true, isBuiltIn: true, order: 3 },
  { id: 'q4', question: 'Emergency Contact Phone', description: 'Phone number for your emergency contact', type: 'text', category: 'personal', required: true, enabled: true, isBuiltIn: true, order: 4 },
  { id: 'q5', question: 'Emergency Contact Relationship', description: 'Relationship to you (e.g. spouse, parent)', type: 'dropdown', category: 'personal', required: true, enabled: true, options: ['Spouse/Partner', 'Parent', 'Sibling', 'Friend', 'Other'], isBuiltIn: true, order: 5 },
  { id: 'q6', question: 'Do you have a valid driver\'s licence?', description: 'Required for roles involving driving', type: 'dropdown', category: 'compliance', required: false, enabled: true, options: ['Yes – Full Licence', 'Yes – Provisional', 'No'], isBuiltIn: true, order: 6 },
  { id: 'q7', question: 'Languages Spoken', description: 'Languages you are comfortable communicating in', type: 'checkbox', category: 'personal', required: false, enabled: true, options: ['English', 'Mandarin', 'Cantonese', 'Vietnamese', 'Arabic', 'Hindi', 'Spanish', 'Italian', 'Greek', 'Other'], isBuiltIn: true, order: 7 },
  { id: 'q8', question: 'Pre-existing Medical Conditions', description: 'Any conditions that may affect your work capacity (confidential)', type: 'textarea', category: 'compliance', required: false, enabled: false, isBuiltIn: true, order: 8 },
  { id: 'q9', question: 'Working With Children Check', description: 'Upload your valid WWCC if applicable', type: 'file_upload', category: 'compliance', required: false, enabled: false, isBuiltIn: true, order: 9 },
  { id: 'q10', question: 'RSA Certificate', description: 'Upload your Responsible Service of Alcohol certificate', type: 'file_upload', category: 'compliance', required: false, enabled: true, isBuiltIn: true, order: 10 },
];

const categoryIcons: Record<string, React.ElementType> = {
  q1: Shirt, q2: UtensilsCrossed, q3: Phone, q4: Phone, q5: Heart,
  q6: Car, q7: Languages, q8: ShieldCheck, q9: ShieldCheck, q10: FileText,
};

export default function OnboardingQuestions() {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>(defaultQuestions);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<OnboardingQuestion | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question: '', description: '', type: 'text' as QuestionType, category: 'custom' as QuestionCategory,
    required: false, options: '',
  });

  const toggleEnabled = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, enabled: !q.enabled } : q));
    const q = questions.find(q => q.id === id);
    toast.success(`"${q?.question}" ${q?.enabled ? 'disabled' : 'enabled'}`);
  };

  const toggleRequired = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, required: !q.required } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success('Question removed');
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) { toast.error('Question text is required'); return; }
    const id = `custom_${Date.now()}`;
    const newQ: OnboardingQuestion = {
      id, question: newQuestion.question, description: newQuestion.description,
      type: newQuestion.type, category: newQuestion.category, required: newQuestion.required,
      enabled: true, isBuiltIn: false, order: questions.length + 1,
      options: newQuestion.options ? newQuestion.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    };
    setQuestions(prev => [...prev, newQ]);
    setNewQuestion({ question: '', description: '', type: 'text', category: 'custom', required: false, options: '' });
    setShowAddDialog(false);
    toast.success('Custom question added');
  };

  const handleEditSave = () => {
    if (!editingQuestion) return;
    setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q));
    setEditingQuestion(null);
    toast.success('Question updated');
  };

  const enabledCount = questions.filter(q => q.enabled).length;
  const requiredCount = questions.filter(q => q.enabled && q.required).length;

  if (previewMode) {
    const enabledQs = questions.filter(q => q.enabled).sort((a, b) => a.order - b.order);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Onboarding Form Preview</h2>
            <p className="text-sm text-muted-foreground">This is what new employees will see</p>
          </div>
          <Button variant="outline" onClick={() => setPreviewMode(false)}>← Back to Editor</Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Welcome! Please complete the following</CardTitle>
            <CardDescription>Fill in the information below to complete your onboarding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {enabledQs.map(q => (
              <div key={q.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {q.question} {q.required && <span className="text-destructive">*</span>}
                </Label>
                {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}
                {q.type === 'text' && <Input placeholder="Enter your answer..." disabled />}
                {q.type === 'textarea' && <Textarea placeholder="Enter your answer..." disabled />}
                {q.type === 'dropdown' && (
                  <Select disabled><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></Select>
                )}
                {q.type === 'checkbox' && q.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" disabled className="rounded" /> {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'file_upload' && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    Click or drag to upload
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {enabledCount} questions active · {requiredCount} required
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" /> Preview Form
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Custom Question
          </Button>
        </div>
      </div>

      {/* Built-in Question Bank */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Question Bank</CardTitle>
          <CardDescription>Pre-built questions. Toggle to include in the onboarding form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {questions.filter(q => q.isBuiltIn).sort((a, b) => a.order - b.order).map(q => {
            const Icon = categoryIcons[q.id] || HelpCircle;
            const TypeIcon = questionTypeConfig[q.type].icon;
            const catCfg = categoryConfig[q.category];
            return (
              <div key={q.id} className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
                q.enabled ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60',
              )}>
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                    {q.required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Required</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', catCfg.color)}>{catCfg.label}</Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TypeIcon className="h-3 w-3" /> {questionTypeConfig[q.type].label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingQuestion({ ...q })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Switch checked={q.enabled} onCheckedChange={() => toggleEnabled(q.id)} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Custom Questions */}
      {questions.filter(q => !q.isBuiltIn).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Custom Questions</CardTitle>
            <CardDescription>Questions you've added for your onboarding flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {questions.filter(q => !q.isBuiltIn).map(q => {
              const TypeIcon = questionTypeConfig[q.type].icon;
              const catCfg = categoryConfig[q.category];
              return (
                <div key={q.id} className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
                  q.enabled ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60',
                )}>
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                  <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                      {q.required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Required</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', catCfg.color)}>{catCfg.label}</Badge>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <TypeIcon className="h-3 w-3" /> {questionTypeConfig[q.type].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingQuestion({ ...q })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Switch checked={q.enabled} onCheckedChange={() => toggleEnabled(q.id)} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add Custom Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Custom Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text <span className="text-destructive">*</span></Label>
              <Input value={newQuestion.question} onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))} placeholder="e.g. What is your preferred start time?" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newQuestion.description} onChange={e => setNewQuestion(p => ({ ...p, description: e.target.value }))} placeholder="Optional helper text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newQuestion.type} onValueChange={v => setNewQuestion(p => ({ ...p, type: v as QuestionType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(questionTypeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}><span className="flex items-center gap-2"><v.icon className="h-3.5 w-3.5" />{v.label}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newQuestion.category} onValueChange={v => setNewQuestion(p => ({ ...p, category: v as QuestionCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(newQuestion.type === 'dropdown' || newQuestion.type === 'checkbox') && (
              <div className="space-y-2">
                <Label>Options (comma-separated)</Label>
                <Input value={newQuestion.options} onChange={e => setNewQuestion(p => ({ ...p, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={newQuestion.required} onCheckedChange={v => setNewQuestion(p => ({ ...p, required: v }))} />
              <Label>Required question</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddQuestion}>Add Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Input value={editingQuestion.question} onChange={e => setEditingQuestion(p => p ? { ...p, question: e.target.value } : p)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={editingQuestion.description || ''} onChange={e => setEditingQuestion(p => p ? { ...p, description: e.target.value } : p)} />
              </div>
              {editingQuestion.options && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input value={editingQuestion.options.join(', ')} onChange={e => setEditingQuestion(p => p ? { ...p, options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) } : p)} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={editingQuestion.required} onCheckedChange={v => setEditingQuestion(p => p ? { ...p, required: v } : p)} />
                <Label>Required</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
