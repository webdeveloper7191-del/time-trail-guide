import { useCallback, useEffect, useRef } from 'react';
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react';
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import { FormTemplate } from '@/types/forms';
import { formTemplateToSurveyJSON, surveyJSONToFormTemplate } from '@/lib/surveyjs/converter';

interface SurveyJSCreatorProps {
  template: FormTemplate;
  onTemplateChange: (template: FormTemplate) => void;
  onSave?: () => void;
}

export function SurveyJSCreator({ template, onTemplateChange, onSave }: SurveyJSCreatorProps) {
  const creatorRef = useRef<SurveyCreator | null>(null);
  const templateRef = useRef(template);
  templateRef.current = template;

  const initCreator = useCallback(() => {
    const creator = new SurveyCreator({
      showLogicTab: true,
      showTranslationTab: false,
      showThemeTab: true,
      showPreviewTab: true,
      showJSONEditorTab: true,
      isAutoSave: true,
      showSidebar: true,
      questionTypes: [
        'text', 'comment', 'dropdown', 'tagbox', 'radiogroup', 'checkbox',
        'boolean', 'signaturepad', 'file', 'rating', 'ranking',
        'imagepicker', 'image', 'html', 'expression',
        'matrix', 'matrixdropdown', 'matrixdynamic',
        'multipletext', 'panel', 'paneldynamic',
      ],
    });

    // Load the current template as SurveyJS JSON
    const surveyJSON = formTemplateToSurveyJSON(template);
    creator.JSON = surveyJSON;

    // Auto-save handler: convert back and notify parent
    creator.saveSurveyFunc = (saveNo: number, callback: (num: number, success: boolean) => void) => {
      try {
        const updatedTemplate = surveyJSONToFormTemplate(creator.JSON, templateRef.current);
        onTemplateChange(updatedTemplate);
        callback(saveNo, true);
      } catch (e) {
        console.error('Failed to save survey:', e);
        callback(saveNo, false);
      }
    };

    creatorRef.current = creator;
    return creator;
  }, []);  // Only init once

  // Update creator JSON when template changes externally (e.g. from a different source)
  useEffect(() => {
    if (creatorRef.current) {
      const currentJSON = JSON.stringify(creatorRef.current.JSON);
      const newJSON = JSON.stringify(formTemplateToSurveyJSON(template));
      if (currentJSON !== newJSON) {
        creatorRef.current.JSON = JSON.parse(newJSON);
      }
    }
  }, [template.id]); // Only on template ID change (switching templates)

  const creator = creatorRef.current || initCreator();

  return (
    <div className="h-full w-full surveyjs-creator-wrapper">
      <style>{`
        .surveyjs-creator-wrapper {
          --sjs-general-backcolor: hsl(var(--background));
          --sjs-general-forecolor: hsl(var(--foreground));
          --sjs-primary-backcolor: hsl(var(--primary));
          --sjs-primary-forecolor: hsl(var(--primary-foreground));
          --sjs-secondary-backcolor: hsl(var(--secondary));
        }
        .surveyjs-creator-wrapper .svc-creator {
          height: 100%;
        }
        .surveyjs-creator-wrapper .svc-creator__area {
          height: 100%;
        }
        .surveyjs-creator-wrapper .sv-root-modern {
          background: transparent;
        }
      `}</style>
      <SurveyCreatorComponent creator={creator} />
    </div>
  );
}
