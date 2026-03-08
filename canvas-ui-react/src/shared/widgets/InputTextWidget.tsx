/**
 * Input Text Widget - Text input for input_text entities
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React, { useState } from 'react';
import { useEntityBinding } from '../../hooks/useEntityBinding';
import { useVisibility } from '../../hooks/useVisibility';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useWidgetRuntimeStore } from '../stores/widgetRuntimeStore';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const InputTextWidgetMetadata: WidgetMetadata = {
  name: 'Input Text',
  icon: 'TextFieldsOutlined',
  category: 'input',
  description: 'Text input field',
  defaultSize: { w: 250, h: 50 },
  minSize: { w: 100, h: 40 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 250, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 50, min: 40, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', binding: true },
    { name: 'placeholder', type: 'text', label: 'Placeholder', default: 'Enter text...', category: 'behavior' },
    { name: 'label', type: 'text', label: 'Label', default: '', category: 'behavior' },
    { name: 'passwordMode', type: 'checkbox', label: 'Password Mode', default: false, category: 'behavior' },
    { name: 'showPasswordToggle', type: 'checkbox', label: 'Show Password Toggle', default: false, category: 'behavior', visibleWhen: { field: 'passwordMode', value: true } },
    
    // Style
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#424242', category: 'style' },
    { name: 'borderColor', type: 'color', label: 'Border Color', default: '#666666', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 14, min: 10, max: 32, category: 'style' },
  ],
};

const InputTextWidget: React.FC<WidgetProps> = ({ config }) => {
  // Phase 44: Config destructuring with defaults
  const {
    entity_id,
    placeholder = 'Enter text...',
    label = '',
    passwordMode = false,
    showPasswordToggle = false,
    textColor = '#ffffff',
    backgroundColor: bgColor = '#424242',
    borderColor = '#666666',
    fontSize = 14,
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = config.config.style || config.config as any;
  const entityId = useEntityBinding(entity_id, '');
  const { hass } = useWebSocket();
  const { setWidgetState } = useWidgetRuntimeStore();
  
  // Use entity value if available, otherwise empty string
  const initialValue = entityId && typeof entityId === 'string' ? entityId : '';
  const [value, setValue] = useState(initialValue);
  const [showPassword, setShowPassword] = useState(false);
  
  // Update local value when entity changes
  React.useEffect(() => {
    if (entityId && typeof entityId === 'string') {
      setValue(entityId);
    }
  }, [entityId]);
  
  // Publish runtime state for flow system access
  React.useEffect(() => {
    setWidgetState(config.id, {
      value: value,
      type: 'input_text',
      metadata: { passwordMode, hasLabel: !!label }
    });
  }, [value, config.id, setWidgetState, passwordMode, label]);
  
  if (!isVisible) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = () => {
    // Send value to entity when input loses focus
    if (entity_id && hass) {
      hass.callService('input_text', 'set_value', {
        entity_id: entity_id,
        value: value,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Send on Enter key
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const style = applyUniversalStyles(universalStyle, baseStyle);

  const labelStyle: React.CSSProperties = {
    fontSize: `${fontSize - 2}px`,
    color: textColor,
    opacity: 0.8,
    paddingLeft: '8px',
    boxSizing: 'border-box',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: bgColor,
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: '4px',
    padding: '8px 12px',
    boxSizing: 'border-box',
    fontSize: `${fontSize}px`,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const inputContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  };

  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    background: 'transparent',
    border: 'none',
    color: textColor,
    cursor: 'pointer',
    padding: '4px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  };

  return (
    <div style={style}>
      {label && <div style={labelStyle}>{label}</div>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleBlur();
        }}
        style={{ margin: 0, padding: 0 }}
      >
        <div style={inputContainerStyle}>
          <input
            type={passwordMode && !showPassword ? 'password' : 'text'}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              ...inputStyle,
              paddingRight: passwordMode && showPasswordToggle ? '40px' : '12px',
            }}
          />
          {passwordMode && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={toggleButtonStyle}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            )}
          </button>
        )}
        </div>
      </form>
    </div>
  );
};

export default InputTextWidget;
