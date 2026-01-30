import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Chip,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/mui/Card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Save,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SentimentSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: SentimentSettings) => void;
  currentSettings?: SentimentSettings;
}

export interface SentimentSettings {
  positiveKeywords: string[];
  negativeKeywords: string[];
  intensifiers: string[];
  negators: string[];
  positiveThreshold: number; // 0-1, above this = positive
  negativeThreshold: number; // 0-1, below this = negative
  enableAutoAnalysis: boolean;
  confidenceThreshold: number; // Minimum confidence to show
  highlightKeywords: boolean;
}

const defaultSettings: SentimentSettings = {
  positiveKeywords: [
    'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'exceptional',
    'good', 'helpful', 'appreciate', 'thank', 'professional', 'dedicated', 'reliable',
    'supportive', 'creative', 'innovative', 'brilliant', 'superb', 'perfect', 'awesome'
  ],
  negativeKeywords: [
    'poor', 'bad', 'terrible', 'awful', 'disappointing', 'frustrating', 'difficult',
    'problem', 'issue', 'concern', 'improve', 'lacks', 'missing', 'failed',
    'late', 'slow', 'confused', 'unclear', 'mistake', 'error', 'wrong', 'weak'
  ],
  intensifiers: ['very', 'really', 'extremely', 'highly', 'absolutely', 'completely'],
  negators: ['not', "n't", 'never', 'no', 'without'],
  positiveThreshold: 0.2,
  negativeThreshold: -0.2,
  enableAutoAnalysis: true,
  confidenceThreshold: 0.5,
  highlightKeywords: true,
};

export function SentimentSettingsDrawer({
  open,
  onOpenChange,
  onSave,
  currentSettings,
}: SentimentSettingsDrawerProps) {
  const [settings, setSettings] = useState<SentimentSettings>(currentSettings || defaultSettings);
  const [newPositiveWord, setNewPositiveWord] = useState('');
  const [newNegativeWord, setNewNegativeWord] = useState('');
  const [newIntensifier, setNewIntensifier] = useState('');
  const [newNegator, setNewNegator] = useState('');

  const handleAddKeyword = (
    type: 'positiveKeywords' | 'negativeKeywords' | 'intensifiers' | 'negators',
    value: string,
    setValue: (v: string) => void
  ) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;

    if (settings[type].includes(trimmed)) {
      toast.error('Keyword already exists');
      return;
    }

    setSettings({
      ...settings,
      [type]: [...settings[type], trimmed],
    });
    setValue('');
  };

  const handleRemoveKeyword = (
    type: 'positiveKeywords' | 'negativeKeywords' | 'intensifiers' | 'negators',
    keyword: string
  ) => {
    setSettings({
      ...settings,
      [type]: settings[type].filter((k) => k !== keyword),
    });
  };

  const handleResetToDefaults = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to defaults');
  };

  const handleSave = () => {
    onSave(settings);
    toast.success('Sentiment analysis settings saved');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Sentiment Analysis Settings
          </SheetTitle>
          <SheetDescription>
            Configure keywords, thresholds, and analysis behavior
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Analysis Settings */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                Analysis Behavior
              </Typography>
              
              <Card className="p-4 space-y-4">
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableAutoAnalysis}
                      onChange={(e) => setSettings({ ...settings, enableAutoAnalysis: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Auto-analyze new feedback</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically analyze sentiment when feedback is submitted
                      </Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.highlightKeywords}
                      onChange={(e) => setSettings({ ...settings, highlightKeywords: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Highlight detected keywords</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show keyword badges on analyzed feedback
                      </Typography>
                    </Box>
                  }
                />
              </Card>
            </div>

            <Divider />

            {/* Thresholds */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                Sentiment Thresholds
              </Typography>
              
              <Card className="p-4 space-y-4">
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500} className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-emerald-500" />
                      Positive Threshold
                    </Typography>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      {(settings.positiveThreshold * 100).toFixed(0)}%+
                    </Badge>
                  </Stack>
                  <Slider
                    value={settings.positiveThreshold}
                    onChange={(_, v) => setSettings({ ...settings, positiveThreshold: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                    sx={{ color: '#10b981' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Score above this threshold is classified as positive
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500} className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      Negative Threshold
                    </Typography>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {(settings.negativeThreshold * 100).toFixed(0)}%-
                    </Badge>
                  </Stack>
                  <Slider
                    value={settings.negativeThreshold}
                    onChange={(_, v) => setSettings({ ...settings, negativeThreshold: v as number })}
                    min={-1}
                    max={0}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                    sx={{ color: '#ef4444' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Score below this threshold is classified as negative
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500} className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Confidence Threshold
                    </Typography>
                    <Badge variant="outline">
                      {(settings.confidenceThreshold * 100).toFixed(0)}%
                    </Badge>
                  </Stack>
                  <Slider
                    value={settings.confidenceThreshold}
                    onChange={(_, v) => setSettings({ ...settings, confidenceThreshold: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Minimum confidence level to display sentiment results
                  </Typography>
                </Box>
              </Card>
            </div>

            <Divider />

            {/* Positive Keywords */}
            <div className="space-y-3">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3 text-emerald-500" />
                  Positive Keywords ({settings.positiveKeywords.length})
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add positive keyword..."
                  value={newPositiveWord}
                  onChange={(e) => setNewPositiveWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword('positiveKeywords', newPositiveWord, setNewPositiveWord);
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddKeyword('positiveKeywords', newPositiveWord, setNewPositiveWord)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Stack>
              
              <div className="flex flex-wrap gap-1">
                {settings.positiveKeywords.map((word) => (
                  <Chip
                    key={word}
                    label={word}
                    size="small"
                    onDelete={() => handleRemoveKeyword('positiveKeywords', word)}
                    className="bg-emerald-50 text-emerald-700"
                  />
                ))}
              </div>
            </div>

            <Divider />

            {/* Negative Keywords */}
            <div className="space-y-3">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3 text-red-500" />
                  Negative Keywords ({settings.negativeKeywords.length})
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add negative keyword..."
                  value={newNegativeWord}
                  onChange={(e) => setNewNegativeWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword('negativeKeywords', newNegativeWord, setNewNegativeWord);
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddKeyword('negativeKeywords', newNegativeWord, setNewNegativeWord)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Stack>
              
              <div className="flex flex-wrap gap-1">
                {settings.negativeKeywords.map((word) => (
                  <Chip
                    key={word}
                    label={word}
                    size="small"
                    onDelete={() => handleRemoveKeyword('negativeKeywords', word)}
                    className="bg-red-50 text-red-700"
                  />
                ))}
              </div>
            </div>

            <Divider />

            {/* Modifiers */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                Sentiment Modifiers
              </Typography>
              
              {/* Intensifiers */}
              <Card className="p-4 space-y-3">
                <Typography variant="body2" fontWeight={500}>
                  Intensifiers (amplify sentiment)
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add intensifier..."
                    value={newIntensifier}
                    onChange={(e) => setNewIntensifier(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKeyword('intensifiers', newIntensifier, setNewIntensifier);
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddKeyword('intensifiers', newIntensifier, setNewIntensifier)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </Stack>
                <div className="flex flex-wrap gap-1">
                  {settings.intensifiers.map((word) => (
                    <Chip
                      key={word}
                      label={word}
                      size="small"
                      onDelete={() => handleRemoveKeyword('intensifiers', word)}
                      variant="outlined"
                    />
                  ))}
                </div>
              </Card>

              {/* Negators */}
              <Card className="p-4 space-y-3">
                <Typography variant="body2" fontWeight={500}>
                  Negators (reverse sentiment)
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add negator..."
                    value={newNegator}
                    onChange={(e) => setNewNegator(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKeyword('negators', newNegator, setNewNegator);
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddKeyword('negators', newNegator, setNewNegator)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </Stack>
                <div className="flex flex-wrap gap-1">
                  {settings.negators.map((word) => (
                    <Chip
                      key={word}
                      label={word}
                      size="small"
                      onDelete={() => handleRemoveKeyword('negators', word)}
                      variant="outlined"
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
            <Button variant="text" onClick={handleResetToDefaults} color="secondary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </Stack>
          </Stack>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
