/**
 * Converts between the app's FormTemplate/FormField types and SurveyJS JSON format.
 */
import { FormTemplate, FormField, FormSection, FieldType, FieldOption } from '@/types/forms';

// Map our field types to SurveyJS question types
const FIELD_TYPE_TO_SURVEYJS: Record<FieldType, string> = {
  short_text: 'text',
  long_text: 'comment',
  number: 'text',  // with inputType: 'number'
  date: 'text',    // with inputType: 'date'
  time: 'text',    // with inputType: 'time'
  datetime: 'text', // with inputType: 'datetime-local'
  dropdown: 'dropdown',
  multi_select: 'tagbox',
  radio: 'radiogroup',
  checkbox: 'checkbox',
  signature: 'signaturepad',
  photo_upload: 'file',
  video_upload: 'file',
  file_upload: 'file',
  barcode_scan: 'text',
  qr_scan: 'text',
  location: 'text',
  staff_selector: 'dropdown',
  section_header: 'html',
  instructions: 'html',
};

// Reverse map SurveyJS types back to our field types
const SURVEYJS_TO_FIELD_TYPE: Record<string, FieldType> = {
  text: 'short_text',
  comment: 'long_text',
  dropdown: 'dropdown',
  tagbox: 'multi_select',
  radiogroup: 'radio',
  checkbox: 'checkbox',
  signaturepad: 'signature',
  file: 'file_upload',
  html: 'instructions',
  boolean: 'checkbox',
  rating: 'number',
  ranking: 'multi_select',
  image: 'photo_upload',
  imagepicker: 'radio',
  matrix: 'radio',
  matrixdropdown: 'dropdown',
  matrixdynamic: 'dropdown',
  multipletext: 'short_text',
  panel: 'section_header',
  paneldynamic: 'section_header',
  expression: 'instructions',
};

/**
 * Convert a FormTemplate to SurveyJS JSON format
 */
export function formTemplateToSurveyJSON(template: FormTemplate): object {
  const pages = template.sections.map((section) => {
    const sectionFields = template.fields
      .filter(f => f.sectionId === section.id)
      .sort((a, b) => a.order - b.order);

    return {
      name: section.id,
      title: section.title,
      description: section.description || undefined,
      elements: sectionFields.map(fieldToSurveyElement),
    };
  });

  // Fields without a section go to a default page
  const orphanFields = template.fields
    .filter(f => !f.sectionId)
    .sort((a, b) => a.order - b.order);

  if (orphanFields.length > 0) {
    pages.push({
      name: 'default',
      title: 'General',
      description: undefined,
      elements: orphanFields.map(fieldToSurveyElement),
    });
  }

  return {
    title: template.name,
    description: template.description || '',
    logoPosition: 'right',
    pages,
    showProgressBar: 'top',
    progressBarType: 'pages',
    showQuestionNumbers: 'on',
    questionErrorLocation: 'bottom',
    completeText: 'Submit',
    showPreviewBeforeComplete: 'showAnsweredQuestions',
  };
}

function fieldToSurveyElement(field: FormField): object {
  const surveyType = FIELD_TYPE_TO_SURVEYJS[field.type] || 'text';
  
  const element: Record<string, unknown> = {
    type: surveyType,
    name: field.id,
    title: field.label,
    description: field.description || undefined,
    isRequired: field.required,
  };

  // Placeholder
  if (field.placeholder) {
    element.placeholder = field.placeholder;
  }

  // Default value
  if (field.defaultValue !== undefined) {
    element.defaultValue = field.defaultValue;
  }

  // Input type overrides for 'text' type
  if (field.type === 'number') {
    element.inputType = 'number';
    if (field.settings?.min !== undefined) element.min = field.settings.min;
    if (field.settings?.max !== undefined) element.max = field.settings.max;
    if (field.settings?.step !== undefined) element.step = field.settings.step;
  } else if (field.type === 'date') {
    element.inputType = 'date';
    if (field.settings?.minDate) element.min = field.settings.minDate;
    if (field.settings?.maxDate) element.max = field.settings.maxDate;
  } else if (field.type === 'time') {
    element.inputType = 'time';
  } else if (field.type === 'datetime') {
    element.inputType = 'datetime-local';
  }

  // Options for choice-based fields
  if (field.options && field.options.length > 0) {
    element.choices = field.options.map(opt => ({
      value: opt.value,
      text: opt.label,
    }));
  }

  // Text validation
  if (field.settings?.minLength !== undefined || field.settings?.maxLength !== undefined) {
    const validators: object[] = [];
    if (field.settings.minLength !== undefined) {
      validators.push({
        type: 'text',
        minLength: field.settings.minLength,
        text: `Minimum ${field.settings.minLength} characters required`,
      });
    }
    if (field.settings.maxLength !== undefined) {
      element.maxLength = field.settings.maxLength;
    }
    if (validators.length > 0) {
      element.validators = validators;
    }
  }

  // File upload settings
  if (['photo_upload', 'video_upload', 'file_upload'].includes(field.type)) {
    element.storeDataAsText = false;
    element.waitForUpload = true;
    if (field.settings?.maxFiles) element.maxSize = field.settings.maxFileSize;
    if (field.settings?.acceptedTypes) {
      element.acceptedTypes = field.settings.acceptedTypes.join(',');
    }
    if (field.type === 'photo_upload') {
      element.acceptedTypes = 'image/*';
    } else if (field.type === 'video_upload') {
      element.acceptedTypes = 'video/*';
    }
  }

  // Section header / instructions rendered as HTML
  if (field.type === 'section_header') {
    element.html = `<h3 style="margin:0;font-weight:600">${field.label}</h3>${field.description ? `<p style="margin:4px 0 0;color:#666">${field.description}</p>` : ''}`;
  } else if (field.type === 'instructions') {
    element.html = `<div style="padding:8px 12px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:4px"><p style="margin:0;color:#1e40af">${field.description || field.label}</p></div>`;
  }

  // Width mapping
  if (field.width) {
    const widthMap: Record<string, number> = {
      'full': 100, '3/4': 75, '2/3': 67, '1/2': 50, '1/3': 33, '1/4': 25,
    };
    element.startWithNewLine = field.width === 'full';
    if (widthMap[field.width]) {
      element.width = `${widthMap[field.width]}%`;
    }
  }

  // Conditional logic → SurveyJS visibleIf
  if (field.conditionalLogic && field.conditionalLogic.length > 0) {
    const logic = field.conditionalLogic[0];
    const conditions = logic.conditions.map(c => {
      const op = c.operator === 'equals' ? '=' :
                 c.operator === 'not_equals' ? '<>' :
                 c.operator === 'greater_than' ? '>' :
                 c.operator === 'less_than' ? '<' :
                 c.operator === 'contains' ? 'contains' :
                 c.operator === 'is_empty' ? 'empty' :
                 c.operator === 'is_not_empty' ? 'notempty' : '=';
      
      if (op === 'empty') return `{${c.fieldId}} empty`;
      if (op === 'notempty') return `{${c.fieldId}} notempty`;
      return `{${c.fieldId}} ${op} '${c.value}'`;
    });

    const joiner = logic.logicOperator === 'or' ? ' or ' : ' and ';
    const expression = conditions.join(joiner);

    if (logic.action === 'show') {
      element.visibleIf = expression;
    } else if (logic.action === 'hide') {
      element.visibleIf = `not (${expression})`;
    } else if (logic.action === 'require') {
      element.requiredIf = expression;
    }
  }

  return element;
}

/**
 * Convert SurveyJS JSON back to a FormTemplate
 */
export function surveyJSONToFormTemplate(
  surveyJSON: Record<string, unknown>,
  existingTemplate?: Partial<FormTemplate>
): FormTemplate {
  const pages = (surveyJSON.pages as Array<Record<string, unknown>>) || [];
  
  const sections: FormSection[] = [];
  const fields: FormField[] = [];

  pages.forEach((page, pageIndex) => {
    const sectionId = (page.name as string) || `section-${pageIndex}`;
    
    sections.push({
      id: sectionId,
      title: (page.title as string) || `Section ${pageIndex + 1}`,
      description: (page.description as string) || undefined,
      order: pageIndex,
    });

    const elements = (page.elements as Array<Record<string, unknown>>) || [];
    elements.forEach((el, elIndex) => {
      fields.push(surveyElementToField(el, sectionId, fields.length));
    });
  });

  return {
    id: existingTemplate?.id || `template-${Date.now()}`,
    name: (surveyJSON.title as string) || existingTemplate?.name || 'Untitled Form',
    description: (surveyJSON.description as string) || existingTemplate?.description || '',
    category: existingTemplate?.category || 'custom',
    version: existingTemplate?.version || 1,
    status: existingTemplate?.status || 'draft',
    scope: existingTemplate?.scope || 'tenant',
    tenantId: existingTemplate?.tenantId,
    locationId: existingTemplate?.locationId,
    locationName: existingTemplate?.locationName,
    sections,
    fields,
    scoring: existingTemplate?.scoring,
    branding: existingTemplate?.branding,
    settings: existingTemplate?.settings,
    createdAt: existingTemplate?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: existingTemplate?.createdBy,
    createdByName: existingTemplate?.createdByName,
  };
}

function surveyElementToField(
  el: Record<string, unknown>,
  sectionId: string,
  order: number
): FormField {
  const surveyType = el.type as string;
  const inputType = el.inputType as string | undefined;
  
  // Determine our field type
  let fieldType: FieldType = SURVEYJS_TO_FIELD_TYPE[surveyType] || 'short_text';
  
  // Refine based on inputType
  if (surveyType === 'text') {
    if (inputType === 'number') fieldType = 'number';
    else if (inputType === 'date') fieldType = 'date';
    else if (inputType === 'time') fieldType = 'time';
    else if (inputType === 'datetime-local') fieldType = 'datetime';
    else fieldType = 'short_text';
  }

  // Check file accepted types
  if (surveyType === 'file') {
    const accepted = el.acceptedTypes as string;
    if (accepted?.includes('image')) fieldType = 'photo_upload';
    else if (accepted?.includes('video')) fieldType = 'video_upload';
    else fieldType = 'file_upload';
  }

  // Build options
  let options: FieldOption[] | undefined;
  if (el.choices && Array.isArray(el.choices)) {
    options = (el.choices as Array<Record<string, unknown>>).map((ch, i) => {
      const isObject = typeof ch === 'object';
      return {
        id: `opt-${i + 1}`,
        label: isObject ? String(ch.text || ch.value) : String(ch),
        value: isObject ? String(ch.value) : String(ch),
      };
    });
  }

  const field: FormField = {
    id: (el.name as string) || `field-${Date.now()}-${order}`,
    type: fieldType,
    label: (el.title as string) || 'Untitled',
    description: (el.description as string) || undefined,
    placeholder: (el.placeholder as string) || undefined,
    required: (el.isRequired as boolean) || false,
    options,
    defaultValue: el.defaultValue as string | number | boolean | string[] | undefined,
    sectionId,
    order,
    settings: {},
  };

  // Number settings
  if (fieldType === 'number') {
    if (el.min !== undefined) field.settings!.min = el.min as number;
    if (el.max !== undefined) field.settings!.max = el.max as number;
    if (el.step !== undefined) field.settings!.step = el.step as number;
  }

  // Text settings
  if (el.maxLength !== undefined) {
    field.settings!.maxLength = el.maxLength as number;
  }

  return field;
}
