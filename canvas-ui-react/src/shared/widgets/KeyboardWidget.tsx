/**
 * Keyboard Widget - Onscreen keyboard for input
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React, { useRef, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const KeyboardWidgetMetadata: WidgetMetadata = {
  name: 'Keyboard',
  icon: 'KeyboardOutlined',
  category: 'control',
  description: 'Onscreen keyboard for input',
  defaultSize: { w: 800, h: 300 },
  minSize: { w: 400, h: 200 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 800, min: 400, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 300, min: 200, category: 'layout' },
    
    // Behavior
    { name: 'layout', type: 'select', label: 'Layout', default: 'default', category: 'behavior', options: [
      { value: 'default', label: 'QWERTY' },
      { value: 'numeric', label: 'Numeric' },
      { value: 'compact', label: 'Compact' },
    ]},
    { name: 'target_entity', type: 'entity', label: 'Target Entity', default: '', category: 'behavior', description: 'Entity to send input to (e.g., input_text)' },
    { name: 'showDisplay', type: 'checkbox', label: 'Show Display', default: true, category: 'behavior', description: 'Show input display above keyboard' },
    { name: 'draggable', type: 'checkbox', label: 'Draggable in View Mode', default: true, category: 'behavior', description: 'Allow dragging keyboard in view/kiosk mode' },
    { name: 'autoShow', type: 'checkbox', label: 'Auto Show on Input Focus', default: false, category: 'behavior', description: 'Automatically show keyboard when any input is focused' },
    { name: 'floatingMode', type: 'checkbox', label: 'Floating Mode', default: false, category: 'behavior', description: 'Float above content instead of inline positioning' },
    
    // Style
    { name: 'theme', type: 'select', label: 'Theme', default: 'hg-theme-default', category: 'style', options: [
      { value: 'hg-theme-default', label: 'Default' },
      { value: 'hg-theme-default hg-layout-default', label: 'Default Layout' },
      { value: 'hg-theme-default hg-layout-numeric', label: 'Numeric Layout' },
    ]},
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#1e1e1e', category: 'style' },
    { name: 'buttonColor', type: 'color', label: 'Button Color', default: '#3b3b3b', category: 'style' },
    { name: 'buttonTextColor', type: 'color', label: 'Button Text Color', default: '#ffffff', category: 'style' },
    { name: 'buttonHoverColor', type: 'color', label: 'Button Hover Color', default: '#5a5a5a', category: 'style' },
    { name: 'displayBackgroundColor', type: 'color', label: 'Display Background', default: '#2a2a2a', category: 'style' },
    { name: 'displayTextColor', type: 'color', label: 'Display Text Color', default: '#ffffff', category: 'style' },
  ],
};

const KeyboardWidget: React.FC<WidgetProps> = ({ config, isEditMode }) => {
  const [input, setInput] = useState('');
  const [layoutName, setLayoutName] = useState('default');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const keyboardRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Phase 44: Config destructuring with defaults
  const {
    layout = 'default',
    showDisplay = true,
    draggable = true,
    autoShow = false,
    floatingMode = false,
    theme = 'hg-theme-default',
    backgroundColor = '#1e1e1e',
    buttonColor = '#3b3b3b',
    buttonTextColor = '#ffffff',
    buttonHoverColor = '#5a5a5a',
    displayBackgroundColor = '#2a2a2a',
    displayTextColor = '#ffffff',
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = config.config.style || config.config as any;

  // Auto-show keyboard when input is focused
  React.useEffect(() => {
    if (!autoShow || isEditMode) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
        setActiveInput(inputElement);
        setInput(inputElement.value || '');
        keyboardRef.current?.setInput(inputElement.value || '');
      }
    };

    const handleBlur = () => {
      // Don't clear on blur to allow keyboard interaction
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
    };
  }, [config.config.autoShow, isEditMode]);

  const onChange = (input: string) => {
    setInput(input);
    // Sync with active input element
    if (activeInput && config.config.autoShow) {
      activeInput.value = input;
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const onKeyPress = (button: string) => {
    if (button === '{shift}' || button === '{lock}') handleShift();
    if (button === '{clear}') setInput('');
  };

  const handleShift = () => {
    const newLayoutName = layoutName === 'default' ? 'shift' : 'default';
    setLayoutName(newLayoutName);
  };

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setInput(input);
    keyboardRef.current?.setInput(input);
  };

  // Drag handlers for floating mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!config.config.draggable || isEditMode) return;
    if ((e.target as HTMLElement).closest('.keyboard-drag-handle')) {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;
  
  // Define different keyboard layouts
  const layouts: any = {
    default: {
      default: [
        '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
        '{tab} q w e r t y u i o p [ ] \\',
        "{lock} a s d f g h j k l ; ' {enter}",
        '{shift} z x c v b n m , . / {shift}',
        '.com @ {space}',
      ],
      shift: [
        '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
        '{tab} Q W E R T Y U I O P { } |',
        '{lock} A S D F G H J K L : " {enter}',
        '{shift} Z X C V B N M < > ? {shift}',
        '.com @ {space}',
      ],
    },
    numeric: {
      default: ['1 2 3', '4 5 6', '7 8 9', '{clear} 0 {bksp}'],
    },
    compact: {
      default: [
        '1 2 3 4 5 6 7 8 9 0 {bksp}',
        'q w e r t y u i o p',
        'a s d f g h j k l',
        '{shift} z x c v b n m {shift}',
        '.com @ {space}',
      ],
      shift: [
        '1 2 3 4 5 6 7 8 9 0 {bksp}',
        'Q W E R T Y U I O P',
        'A S D F G H J K L',
        '{shift} Z X C V B N M {shift}',
        '.com @ {space}',
      ],
    },
  };

  const isFloating = floatingMode && !isEditMode;
  const isDraggableMode = draggable && !isEditMode;

  const baseContainerStyle = {
    width: isFloating ? 'auto' : '100%',
    height: isFloating ? 'auto' : '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor,
    padding: '10px',
    boxSizing: 'border-box' as const,
    pointerEvents: isEditMode ? ('none' as const) : ('auto' as const),
    cursor: isDragging ? 'grabbing' : 'default',
  };

  const floatingStyles = isFloating ? {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 9999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    borderRadius: '8px',
  } : {};

  const containerStyle = { ...baseContainerStyle, ...floatingStyles };

  const displayStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
    fontSize: '18px',
    marginBottom: '10px',
    border: '1px solid #555',
    borderRadius: '4px',
    backgroundColor: displayBackgroundColor,
    color: displayTextColor,
  };

  const keyboardContainerStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
  };

  const finalStyle = isFloating ? containerStyle : applyUniversalStyles(universalStyle, baseContainerStyle);

  const dragHandleStyle: React.CSSProperties = {
    width: '100%',
    height: '24px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    cursor: isDraggableMode ? 'grab' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#999',
  };

  return (
    <div ref={containerRef} style={finalStyle} onMouseDown={handleMouseDown}>
      {isDraggableMode && (
        <div className="keyboard-drag-handle" style={dragHandleStyle}>
          ⋮⋮⋮ {isFloating ? 'Drag to move' : 'Draggable in floating mode'}
        </div>
      )}
      {showDisplay && (
        <input
          value={input}
          placeholder="Type here..."
          onChange={onChangeInput}
          style={displayStyle}
        />
      )}
      <div style={keyboardContainerStyle}>
        <style>{`
          .hg-theme-default .hg-button {
            background: ${buttonColor};
            color: ${buttonTextColor};
          }
          .hg-theme-default .hg-button:active,
          .hg-theme-default .hg-button:hover {
            background: ${buttonHoverColor};
          }
        `}</style>
        <Keyboard
          keyboardRef={(r: any) => (keyboardRef.current = r)}
          layoutName={layoutName}
          layout={layouts[layout]}
          onChange={onChange}
          onKeyPress={onKeyPress}
          theme={theme}
          display={{
            '{bksp}': 'backspace',
            '{enter}': 'enter',
            '{shift}': 'shift',
            '{tab}': 'tab',
            '{lock}': 'caps',
            '{clear}': 'clear',
            '{space}': ' ',
          }}
        />
      </div>
    </div>
  );
};

export default KeyboardWidget;
