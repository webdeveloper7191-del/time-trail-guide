// Token resolver for auto-populating form fields
// This module resolves {{token}} placeholders with actual values from context

import { AUTO_POPULATE_TOKENS } from '@/types/forms';
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

export interface TokenContext {
  staff?: StaffContext;
  shift?: ShiftContext;
  location?: LocationContext;
  form?: FormContext;
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
      return null;
  }
}

// Resolve all tokens in a string
export function resolveTokensInString(text: string, context: TokenContext): string {
  return text.replace(TOKEN_REGEX, (match) => {
    const resolved = resolveToken(match, context);
    return resolved !== null ? resolved : match;
  });
}

// Resolve tokens in form field default values
export function resolveFormFieldDefaults(
  fieldDefaults: Record<string, string | number | boolean | string[]>,
  context: TokenContext
): Record<string, string | number | boolean | string[]> {
  const resolved: Record<string, string | number | boolean | string[]> = {};
  
  for (const [fieldId, value] of Object.entries(fieldDefaults)) {
    if (typeof value === 'string') {
      resolved[fieldId] = resolveTokensInString(value, context);
    } else {
      resolved[fieldId] = value;
    }
  }
  
  return resolved;
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
export function validateTokens(text: string): { valid: boolean; invalidTokens: string[] } {
  const usedTokens = extractTokens(text);
  const validTokens = AUTO_POPULATE_TOKENS.map(t => t.token);
  const invalidTokens = usedTokens.filter(t => !validTokens.includes(t));
  
  return {
    valid: invalidTokens.length === 0,
    invalidTokens,
  };
}

// Get a preview of what a string will look like with tokens resolved
export function getTokenPreview(text: string, context?: TokenContext): string {
  // Use example values if no context provided
  if (!context) {
    return text.replace(TOKEN_REGEX, (match) => {
      const tokenDef = AUTO_POPULATE_TOKENS.find(t => t.token === match);
      return tokenDef ? tokenDef.example : match;
    });
  }
  
  return resolveTokensInString(text, context);
}
