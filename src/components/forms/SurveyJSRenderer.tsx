import { useCallback, useMemo } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/defaultV2.min.css';
import { FormTemplate } from '@/types/forms';
import { formTemplateToSurveyJSON } from '@/lib/surveyjs/converter';
import { toast } from 'sonner';

interface SurveyJSRendererProps {
  template: FormTemplate;
  onComplete?: (results: Record<string, unknown>) => void;
  onClose?: () => void;
  readOnly?: boolean;
  initialData?: Record<string, unknown>;
}

export function SurveyJSRenderer({ 
  template, 
  onComplete, 
  onClose, 
  readOnly = false,
  initialData 
}: SurveyJSRendererProps) {
  const surveyModel = useMemo(() => {
    const json = formTemplateToSurveyJSON(template);
    const model = new Model(json);
    
    // Theme
    model.applyTheme({
      cssVariables: {
        '--sjs-general-backcolor': 'hsl(var(--background))',
        '--sjs-general-forecolor': 'hsl(var(--foreground))',
        '--sjs-primary-backcolor': 'hsl(var(--primary))',
        '--sjs-primary-forecolor': 'hsl(var(--primary-foreground))',
        '--sjs-corner-radius': '8px',
        '--sjs-base-unit': '8px',
      }
    });

    if (readOnly) {
      model.mode = 'display';
    }

    if (initialData) {
      model.data = initialData;
    }

    return model;
  }, [template, readOnly, initialData]);

  const handleComplete = useCallback((sender: Model) => {
    const results = sender.data;
    onComplete?.(results);
    toast.success('Form submitted successfully');
  }, [onComplete]);

  surveyModel.onComplete.add(handleComplete);

  return (
    <div className="h-full w-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {onClose && (
          <button 
            onClick={onClose}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            ← Back to templates
          </button>
        )}
        <Survey model={surveyModel} />
      </div>
    </div>
  );
}
