 import { z } from 'zod';
 
 // ============= Location Validation =============
 
 export const locationSchema = z.object({
   name: z.string()
     .trim()
     .min(2, 'Location name must be at least 2 characters')
     .max(100, 'Location name must be less than 100 characters'),
   code: z.string()
     .trim()
     .min(2, 'Code must be at least 2 characters')
     .max(20, 'Code must be less than 20 characters')
     .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
   status: z.enum(['active', 'inactive', 'pending_setup', 'temporarily_closed']),
   phone: z.string()
     .trim()
     .optional()
     .refine(val => !val || val.length >= 8, 'Phone number must be at least 8 characters'),
   email: z.string()
     .trim()
     .optional()
     .refine(val => !val || z.string().email().safeParse(val).success, 'Invalid email address'),
   timezone: z.string().min(1, 'Timezone is required'),
   industryType: z.string().min(1, 'Industry type is required'),
   totalCapacity: z.number()
     .int('Capacity must be a whole number')
     .min(1, 'Capacity must be at least 1')
     .max(10000, 'Capacity cannot exceed 10,000'),
   maxStaff: z.number()
     .int('Max staff must be a whole number')
     .min(1, 'Max staff must be at least 1')
     .max(1000, 'Max staff cannot exceed 1,000'),
   address: z.object({
     line1: z.string()
       .trim()
       .min(5, 'Street address must be at least 5 characters')
       .max(200, 'Street address must be less than 200 characters'),
     line2: z.string().trim().optional(),
     suburb: z.string()
       .trim()
       .min(2, 'Suburb must be at least 2 characters')
       .max(100, 'Suburb must be less than 100 characters'),
     state: z.string().min(1, 'State is required'),
     postcode: z.string()
       .trim()
       .min(4, 'Postcode must be at least 4 characters')
       .max(10, 'Postcode must be less than 10 characters')
       .regex(/^\d{4,}$/, 'Postcode must be a valid format'),
     country: z.string().default('Australia'),
   }),
 });
 
 export type LocationFormData = z.infer<typeof locationSchema>;
 
 // ============= Area Validation =============
 
 export const areaSchema = z.object({
   name: z.string()
     .trim()
     .min(2, 'Area name must be at least 2 characters')
     .max(100, 'Area name must be less than 100 characters'),
   code: z.string()
     .trim()
     .min(2, 'Code must be at least 2 characters')
     .max(10, 'Code must be less than 10 characters')
     .regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
   status: z.enum(['active', 'inactive', 'maintenance']),
   color: z.string().optional(),
   locationId: z.string().min(1, 'Location is required'),
   capacity: z.number()
     .int('Capacity must be a whole number')
     .min(1, 'Capacity must be at least 1')
     .max(500, 'Capacity cannot exceed 500'),
   ageGroup: z.string().trim().optional(),
   serviceType: z.string().trim().optional(),
   minimumStaff: z.number()
     .int('Minimum staff must be a whole number')
     .min(1, 'Minimum staff must be at least 1')
     .max(50, 'Minimum staff cannot exceed 50'),
   maximumStaff: z.number()
     .int('Maximum staff must be a whole number')
     .min(1, 'Maximum staff must be at least 1')
     .max(100, 'Maximum staff cannot exceed 100')
     .optional(),
 }).refine(
   data => !data.maximumStaff || data.maximumStaff >= data.minimumStaff,
   { message: 'Maximum staff must be greater than or equal to minimum staff', path: ['maximumStaff'] }
 );
 
 export type AreaFormData = z.infer<typeof areaSchema>;
 
 // ============= Department Validation =============
 
 export const departmentSchema = z.object({
   name: z.string()
     .trim()
     .min(2, 'Department name must be at least 2 characters')
     .max(100, 'Department name must be less than 100 characters'),
   code: z.string()
     .trim()
     .min(2, 'Code must be at least 2 characters')
     .max(10, 'Code must be less than 10 characters')
     .regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
   type: z.enum(['operational', 'support', 'management', 'administrative']),
   locationId: z.string().min(1, 'Location is required'),
   description: z.string()
     .trim()
     .max(500, 'Description must be less than 500 characters')
     .optional(),
   managerName: z.string()
     .trim()
     .max(100, 'Manager name must be less than 100 characters')
     .optional(),
   budgetAllocation: z.number()
     .min(0, 'Budget cannot be negative')
     .max(100000000, 'Budget cannot exceed $100M')
     .optional(),
   costCentreCode: z.string()
     .trim()
     .max(20, 'Cost centre code must be less than 20 characters')
     .optional(),
   headcount: z.number()
     .int('Headcount must be a whole number')
     .min(0, 'Headcount cannot be negative')
     .max(1000, 'Headcount cannot exceed 1,000')
     .optional(),
   isActive: z.boolean().default(true),
 });
 
 export type DepartmentFormData = z.infer<typeof departmentSchema>;
 
 // ============= Helper Functions =============
 
 export interface ValidationError {
   field: string;
   message: string;
 }
 
 export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: ValidationError[] } {
   const result = schema.safeParse(data);
   
   if (result.success) {
     return { success: true, data: result.data };
   }
   
   const errors: ValidationError[] = result.error.errors.map(err => ({
     field: err.path.join('.'),
     message: err.message,
   }));
   
   return { success: false, errors };
 }
 
 export function getFieldError(errors: ValidationError[], field: string): string | undefined {
   return errors.find(e => e.field === field)?.message;
 }