import { Box, Typography } from '@mui/material';
import React from 'react';
import { CheckboxFieldComponent } from './fields/CheckboxFieldComponent';
import { ColorFieldComponent } from './fields/ColorFieldComponent';
import { DimensionFieldComponent } from './fields/DimensionFieldComponent';
import { EntityPickerComponent } from './fields/EntityPickerComponent';
import { IconPickerComponent } from './fields/IconPickerComponent';
import { NumberFieldComponent } from './fields/NumberFieldComponent';
import { SelectFieldComponent } from './fields/SelectFieldComponent';
import { SliderFieldComponent } from './fields/SliderFieldComponent';
import { TextFieldComponent } from './fields/TextFieldComponent';

/**
 * Field definition from widget manifest configSchema
 */
export interface FieldDefinition {
  type: string;
  label: string;
  default?: any;
  category?: string;
  description?: string;
  
  // Number/Slider specific
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  
  // Select/Radio specific
  options?: Array<{ value: string | number; label: string }> | string[];
  
  // Text specific
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  
  // Dimension specific
  units?: string[];
  allowAuto?: boolean;
  
  // Slider specific
  marks?: boolean;
  showInput?: boolean;
  
  // Conditional visibility
  showIf?: Record<string, any>;
}

interface DynamicFieldRendererProps {
  fieldName: string;
  fieldDef: FieldDefinition;
  widgetConfig?: Record<string, any>;
}

/**
 * Dynamically renders the appropriate field component based on field type
 */
export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  fieldName,
  fieldDef,
  widgetConfig = {},
}) => {
  // Check conditional visibility
  if (fieldDef.showIf) {
    const shouldShow = Object.entries(fieldDef.showIf).every(
      ([key, value]) => widgetConfig[key] === value
    );
    if (!shouldShow) {
      return null;
    }
  }

  const { type, label, description } = fieldDef;

  // Render appropriate component based on type
  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'url':
      return (
        <TextFieldComponent
          label={label}
          propertyPath={fieldName}
          placeholder={fieldDef.placeholder}
          type={type as any}
          description={description}
        />
      );

    case 'textarea':
      return (
        <TextFieldComponent
          label={label}
          propertyPath={fieldName}
          multiline={true}
          rows={fieldDef.rows || 3}
          placeholder={fieldDef.placeholder}
          description={description}
        />
      );

    case 'number':
      return (
        <NumberFieldComponent
          label={label}
          propertyPath={fieldName}
          min={fieldDef.min}
          max={fieldDef.max}
          step={fieldDef.step}
          unit={fieldDef.unit}
          description={description}
        />
      );

    case 'slider':
    case 'range':
      return (
        <SliderFieldComponent
          label={label}
          propertyPath={fieldName}
          min={fieldDef.min || 0}
          max={fieldDef.max || 100}
          step={fieldDef.step || 1}
          unit={fieldDef.unit}
          marks={fieldDef.marks}
          showInput={fieldDef.showInput !== false}
          description={description}
        />
      );

    case 'checkbox':
    case 'toggle':
      return (
        <CheckboxFieldComponent
          label={label}
          propertyPath={fieldName}
          description={description}
        />
      );

    case 'select':
    case 'radio':
      // Normalize options format
      const options = Array.isArray(fieldDef.options)
        ? fieldDef.options.map((opt) =>
            typeof opt === 'string' ? { value: opt, label: opt } : opt
          )
        : [];
      return (
        <SelectFieldComponent
          label={label}
          propertyPath={fieldName}
          options={options}
          description={description}
        />
      );

    case 'color':
      return (
        <ColorFieldComponent
          label={label}
          propertyPath={fieldName}
          description={description}
        />
      );

    case 'entity':
      return (
        <EntityPickerComponent
          label={label}
          propertyPath={fieldName}
          description={description}
        />
      );

    case 'icon':
      return (
        <IconPickerComponent
          label={label}
          propertyPath={fieldName}
          description={description}
        />
      );

    case 'dimension':
      return (
        <DimensionFieldComponent
          label={label}
          propertyPath={fieldName}
          units={fieldDef.units}
          allowAuto={fieldDef.allowAuto}
          description={description}
        />
      );

    // Unsupported field types (TODO: implement later)
    case 'date':
    case 'time':
    case 'datetime':
    case 'json':
    case 'code':
    case 'image':
    case 'view':
    case 'multiselect':
      return (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {label} (type: {type}) - Not yet implemented
          </Typography>
        </Box>
      );

    default:
      // Fallback to text input for unknown types
      return (
        <TextFieldComponent
          label={label}
          propertyPath={fieldName}
          description={description || `Unknown type: ${type}`}
        />
      );
  }
};
