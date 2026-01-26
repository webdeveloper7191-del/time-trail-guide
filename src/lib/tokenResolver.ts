// Token resolver for auto-populating form fields
// This module resolves {{token}} placeholders with actual values from context

import { AUTO_POPULATE_TOKENS, AutoPopulateToken } from '@/types/forms';
import { format } from 'date-fns';

// Context types for token resolution
export interface StaffContext {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  manager?: string;
}

export interface ShiftContext {
  date?: Date;
  startTime?: string;
  endTime?: string;
  duration?: string;
  type?: string;
  room?: string;
}

export interface LocationContext {
  name?: string;
  address?: string;
  code?: string;
}

export interface FormContext {
  name?: string;
  id?: string;
  assignedBy?: string;
  dueDate?: Date;
}

export interface CustomTokenValues {
  [tokenKey: string]: string;
}

export interface TokenContext {
  staff?: StaffContext;
  shift?: ShiftContext;
  location?: LocationContext;
  form?: FormContext;
  custom?: CustomTokenValues;
}

// Token regex pattern
const TOKEN_REGEX = /\{\{([^}]+)\}\}/g;

// Resolve a single token
function resolveToken(token: string, context: TokenContext): string | null {
  switch (token) {
    // Staff tokens
    case '{{staff_name}}':
      if (context.staff?.firstName && context.staff?.lastName) {
        return `${context.staff.firstName} ${context.staff.lastName}`;
      }
      return null;
    case '{{staff_first_name}}':
      return context.staff?.firstName || null;
    case '{{staff_last_name}}':
      return context.staff?.lastName || null;
    case '{{staff_id}}':
      return context.staff?.id || null;
    case '{{staff_email}}':
      return context.staff?.email || null;
    case '{{staff_phone}}':
      return context.staff?.phone || null;
    case '{{staff_role}}':
      return context.staff?.role || null;
    case '{{staff_department}}':
      return context.staff?.department || null;
    case '{{staff_manager}}':
      return context.staff?.manager || null;

    // Shift tokens
    case '{{shift_date}}':
      return context.shift?.date ? format(context.shift.date, 'dd/MM/yyyy') : null;
    case '{{shift_start_time}}':
      return context.shift?.startTime || null;
    case '{{shift_end_time}}':
      return context.shift?.endTime || null;
    case '{{shift_duration}}':
      return context.shift?.duration || null;
    case '{{shift_type}}':
      return context.shift?.type || null;
    case '{{shift_room}}':
      return context.shift?.room || null;

    // Location tokens
    case '{{location_name}}':
      return context.location?.name || null;
    case '{{location_address}}':
      return context.location?.address || null;
    case '{{location_code}}':
      return context.location?.code || null;

    // Date tokens (always resolve to current values)
    case '{{current_date}}':
      return format(new Date(), 'dd/MM/yyyy');
    case '{{current_time}}':
      return format(new Date(), 'HH:mm');
    case '{{current_datetime}}':
      return format(new Date(), 'dd/MM/yyyy HH:mm');
    case '{{current_day}}':
      return format(new Date(), 'EEEE');
    case '{{current_week}}':
      return `Week ${format(new Date(), 'w')}`;

    // Form tokens
    case '{{form_name}}':
      return context.form?.name || null;
    case '{{form_id}}':
      return context.form?.id || null;
    case '{{assigned_by}}':
      return context.form?.assignedBy || null;
    case '{{due_date}}':
      return context.form?.dueDate ? format(context.form.dueDate, 'dd/MM/yyyy') : null;

    default:
      // Check for custom tokens
      if (token.startsWith('{{custom_') && context.custom) {
        const customKey = token.slice(2, -2); // Remove {{ and }}
        return context.custom[customKey] || null;
      }
      return null;
  }
}

// Resolve all tokens in a string, with optional custom token definitions
export function resolveTokensInString(
  text: string, 
  context: TokenContext,
  customTokenDefs?: AutoPopulateToken[]
): string {
  return text.replace(TOKEN_REGEX, (match) => {
    const resolved = resolveToken(match, context);
    if (resolved !== null) return resolved;
    
    // Try custom token definitions for preview values
    if (customTokenDefs) {
      const customDef = customTokenDefs.find(t => t.token === match);
      if (customDef && context.custom) {
        const key = match.slice(2, -2);
        return context.custom[key] || match;
      }
    }
    
    return match;
  });
}

// Resolve tokens in form field default values
export function resolveFormFieldDefaults(
  fieldDefaults: Record<string, string | number | boolean | string[]>,
  context: TokenContext,
  customTokenDefs?: AutoPopulateToken[]
): Record<string, string | number | boolean | string[]> {
  const resolved: Record<string, string | number | boolean | string[]> = {};
  
  for (const [fieldId, value] of Object.entries(fieldDefaults)) {
    if (typeof value === 'string') {
      resolved[fieldId] = resolveTokensInString(value, context, customTokenDefs);
    } else {
      resolved[fieldId] = value;
    }
  }
  
  return resolved;
}

// Get all available tokens including custom ones
export function getAllTokens(customTokens?: AutoPopulateToken[]): AutoPopulateToken[] {
  if (!customTokens || customTokens.length === 0) {
    return AUTO_POPULATE_TOKENS;
  }
  return [...AUTO_POPULATE_TOKENS, ...customTokens];
}

// Create example context for preview with custom tokens
export function createPreviewContext(customTokens?: AutoPopulateToken[]): TokenContext {
  const context: TokenContext = {
    staff: {
      id: 'EMP001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+61 400 123 456',
      role: 'Care Worker',
      department: 'Nursing',
      manager: 'Jane Doe',
    },
    shift: {
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      duration: '8 hours',
      type: 'Morning',
      room: 'Room A',
    },
    location: {
      name: 'Main Campus',
      address: '123 Main St, Sydney NSW 2000',
      code: 'LOC001',
    },
    form: {
      name: 'Daily Safety Checklist',
      id: 'SUB-2025-001',
      assignedBy: 'Admin User',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    custom: {},
  };

  // Add custom token example values
  if (customTokens) {
    customTokens.forEach(token => {
      const key = token.token.slice(2, -2); // Remove {{ and }}
      if (context.custom) {
        context.custom[key] = token.example;
      }
    });
  }

  return context;
}

// Check if a string contains any tokens
export function containsTokens(text: string): boolean {
  return TOKEN_REGEX.test(text);
}

// Extract all tokens from a string
export function extractTokens(text: string): string[] {
  const tokens: string[] = [];
  let match;
  const regex = new RegExp(TOKEN_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

// Validate that all tokens in a string are valid
export function validateTokens(
  text: string, 
  customTokens?: AutoPopulateToken[]
): { valid: boolean; invalidTokens: string[] } {
  const usedTokens = extractTokens(text);
  const allTokens = getAllTokens(customTokens);
  const validTokens = allTokens.map(t => t.token);
  const invalidTokens = usedTokens.filter(t => !validTokens.includes(t));
  
  return {
    valid: invalidTokens.length === 0,
    invalidTokens,
  };
}

// Get a preview of what a string will look like with tokens resolved
export function getTokenPreview(
  text: string, 
  context?: TokenContext,
  customTokens?: AutoPopulateToken[]
): string {
  // Use example values if no context provided
  if (!context) {
    const previewContext = createPreviewContext(customTokens);
    return resolveTokensInString(text, previewContext, customTokens);
  }
  
  return resolveTokensInString(text, context, customTokens);
}
