import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { FormTemplate } from '@/types/forms';
import { formTemplateToSurveyJSON } from '@/lib/surveyjs/converter';
import { toast } from 'sonner';

interface SurveyJSRendererProps {
  template: FormTemplate;
  onComplete?: (results: Record<string, unknown>) => void;
  onClose?: () => void;
  readOnly?: boolean;
  initialData?: Record<string, unknown>;
  onValidate?: (results: Record<string, unknown>) => void;
}

export function SurveyJSRenderer({ 
  template, 
  onComplete, 
  onClose, 
  readOnly = false,
  initialData,
  onValidate
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

  useEffect(() => {
    const validate = (sender: Model, options: { allowComplete: boolean }) => {
      try { onValidate?.(sender.data); }
      catch (error) { options.allowComplete = false; toast.error(error instanceof Error ? error.message : 'Unable to submit.'); }
    };
    const complete = (sender: Model) => {
      onComplete?.(sender.data);
    };
    surveyModel.onCompleting.add(validate);
    surveyModel.onComplete.add(complete);
    return () => { surveyModel.onCompleting.remove(validate); surveyModel.onComplete.remove(complete); };
  }, [surveyModel, onValidate, onComplete]);

  return (
    <div className="h-full w-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {onClose && (
          <Button variant="ghost"
            onClick={onClose}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            ← Back to templates
          </Button>
        )}
        <Survey model={surveyModel} />
      </div>
    </div>
  );
}
