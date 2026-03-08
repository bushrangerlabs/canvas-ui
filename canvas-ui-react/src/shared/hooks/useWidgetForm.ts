/**
 * Widget form hook using React Hook Form + Zod
 * 
 * Auto-generates forms from widget metadata with:
 * - Type-safe validation
 * - Auto-save on change
 * - Error handling
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { WidgetConfig } from '../types';
import type { FieldMetadata, WidgetMetadata } from '../types/metadata';

/**
 * Generate Zod schema from widget metadata
 */
export function generateSchemaFromMetadata(metadata: WidgetMetadata): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  metadata.fields.forEach((field: FieldMetadata) => {
    let fieldSchema: z.ZodTypeAny;
    
    switch (field.type) {
      case 'number':
      case 'slider':
        fieldSchema = z.number();
        if (field.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.min);
        if (field.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.max);
        break;
        
      case 'text':
      case 'textarea':
      case 'entity':
      case 'icon':
      case 'file':
        fieldSchema = z.string();
        break;
        
      case 'color':
        fieldSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format');
        break;
        
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
        
      case 'select':
        if (field.options && field.options.length > 0) {
          const values = field.options.map(opt => 
            typeof opt === 'string' ? opt : opt.value
          );
          fieldSchema = z.enum(values as [string, ...string[]]);
        } else {
          fieldSchema = z.string();
        }
        break;
        
      default:
        fieldSchema = z.any();
    }
    
    // Make optional if has default
    if (field.default !== undefined) {
      fieldSchema = fieldSchema.optional().default(field.default);
    }
    
    shape[field.name] = fieldSchema;
  });
  
  return z.object(shape);
}

/**
 * Hook for widget form with auto-save
 */
export function useWidgetForm(
  metadata: WidgetMetadata,
  currentConfig: WidgetConfig & Record<string, any>,
  onUpdate: (changes: Partial<WidgetConfig & Record<string, any>>) => void,
  debounceMs: number = 300
) {
  // Generate schema from metadata
  const schema = useMemo(() => generateSchemaFromMetadata(metadata), [metadata]);
  
  // Create form with validation
  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: currentConfig,
    mode: 'onChange',
  });
  
  // Watch for changes and auto-save
  const values = form.watch();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if values changed
      const changed = Object.keys(values).some(
        key => values[key] !== currentConfig[key]
      );
      
      if (changed) {
        onUpdate(values);
      }
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [values, currentConfig, onUpdate, debounceMs]);
  
  return form;
}

/**
 * Validate single field value
 */
export function validateField(
  field: FieldMetadata,
  value: any
): { valid: boolean; error?: string } {
  try {
    let schema: z.ZodTypeAny;
    
    switch (field.type) {
      case 'number':
      case 'slider':
        schema = z.number();
        if (field.min !== undefined) schema = (schema as z.ZodNumber).min(field.min);
        if (field.max !== undefined) schema = (schema as z.ZodNumber).max(field.max);
        break;
        
      case 'color':
        schema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
        break;
        
      default:
        return { valid: true };
    }
    
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: (error as any).errors?.[0]?.message || 'Validation failed' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}
