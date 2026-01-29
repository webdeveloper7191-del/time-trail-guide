import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  IconButton,
  Chip,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import type { PulseSurvey, PulseQuestion, PulseSurveyFrequency } from '@/types/advancedPerformance';

interface CreateSurveyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (survey: Partial<PulseSurvey>) => void;
}

type QuestionType = 'rating' | 'text' | 'yes_no' | 'enps';

interface QuestionInput {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
  required: boolean;
}

export function CreateSurveyDrawer({ open, onClose, onSave }: CreateSurveyDrawerProps) {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<PulseSurveyFrequency>('weekly');
  const [targetAudience, setTargetAudience] = useState<'all' | 'team' | 'department'>('all');
  const [anonymous, setAnonymous] = useState(true);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { id: '1', text: '', type: 'rating', category: 'engagement', required: true }
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { 
        id: String(questions.length + 1), 
        text: '', 
        type: 'rating', 
        category: 'engagement', 
        required: true 
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof QuestionInput, value: string | boolean) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSave = () => {
    const survey: Partial<PulseSurvey> = {
      id: `survey-new-${Date.now()}`,
      title,
      frequency,
      targetAudience,
      anonymousResponses: anonymous,
      status: 'draft',
      questions: questions.map((q, idx) => ({
        id: `q-${idx}`,
        text: q.text,
        type: q.type as PulseQuestion['type'],
        category: q.category as PulseQuestion['category'],
        required: q.required,
      })),
      createdAt: new Date().toISOString(),
    };
    onSave(survey);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setFrequency('weekly');
    setTargetAudience('all');
    setAnonymous(true);
    setQuestions([{ id: '1', text: '', type: 'rating', category: 'engagement', required: true }]);
  };

  const isValid = title.trim() && questions.some(q => q.text.trim());

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Create Pulse Survey
          </SheetTitle>
        </SheetHeader>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Title */}
            <Box>
              <Label htmlFor="title" className="mb-2 block">Survey Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly Engagement Check-in"
              />
            </Box>

            {/* Frequency & Audience */}
            <div className="grid grid-cols-2 gap-4">
              <Box>
                <Label className="mb-2 block">Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as PulseSurveyFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi_weekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </Box>
              <Box>
                <Label className="mb-2 block">Target Audience</Label>
                <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as typeof targetAudience)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="team">My Team</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </Box>
            </div>

            {/* Anonymous Toggle */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" fontWeight={500}>Anonymous Responses</Typography>
                <Typography variant="caption" color="text.secondary">
                  Respondent names will be hidden
                </Typography>
              </Box>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </Stack>

            {/* Questions */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Label>Questions *</Label>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Plus size={14} />}
                  onClick={addQuestion}
                >
                  Add Question
                </Button>
              </Stack>

              <Stack spacing={2}>
                {questions.map((q, index) => (
                  <Box 
                    key={q.id}
                    sx={{ 
                      p: 2, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        Question {index + 1}
                      </Typography>
                      {questions.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeQuestion(q.id)}
                          sx={{ mt: -0.5 }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </Stack>
                    <Textarea
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                      placeholder="Enter your question..."
                      className="mt-2"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Select 
                        value={q.type} 
                        onValueChange={(v) => updateQuestion(q.id, 'type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating (1-5)</SelectItem>
                          <SelectItem value="text">Open Text</SelectItem>
                          <SelectItem value="yes_no">Yes/No</SelectItem>
                          <SelectItem value="enps">eNPS (0-10)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select 
                        value={q.category} 
                        onValueChange={(v) => updateQuestion(q.id, 'category', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="satisfaction">Satisfaction</SelectItem>
                          <SelectItem value="wellbeing">Wellbeing</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!isValid}
          >
            Create Survey
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
