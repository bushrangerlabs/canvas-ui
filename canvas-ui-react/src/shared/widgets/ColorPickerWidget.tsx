/**
 * Color Picker Widget - Touch-friendly RGB color selection for lights
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import CloseIcon from '@mui/icons-material/Close';
import { Dialog, IconButton } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useWidgetRuntimeStore } from '../stores/widgetRuntimeStore';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const ColorPickerWidgetMetadata: WidgetMetadata = {
  name: 'Color Picker',
  icon: 'Palette',
  category: 'controls',
  description: 'Touch-friendly color picker - sends RGB to lights, hex to input_text',
  defaultSize: { w: 80, h: 80 },
  minSize: { w: 40, h: 40 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 80, min: 40, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 80, min: 40, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity', default: '', category: 'behavior', description: 'Light, input_text, or any entity' },
    { name: 'outputFormat', type: 'select', label: 'Output Format', default: 'auto', category: 'behavior', 
      options: [
        { value: 'auto', label: 'Auto (RGB for lights, hex for others)' },
        { value: 'rgb', label: 'RGB Array [255, 128, 0]' },
        { value: 'hex', label: 'Hex String #ff8000' },
        { value: 'hex_no_hash', label: 'Hex without # (ff8000)' },
      ]
    },
    { name: 'customService', type: 'text', label: 'Custom Service (optional)', default: '', category: 'behavior', 
      description: 'Override service call (e.g., "automation.trigger")' 
    },
    { name: 'customField', type: 'text', label: 'Custom Field Name', default: '', category: 'behavior', 
      description: 'Field name for color data (default: rgb_color for lights, value for input_text)' 
    },
    
    // Style - Color Swatch
    { name: 'swatchWidth', type: 'number', label: 'Swatch Width', default: 60, min: 20, max: 500, category: 'style', description: 'Width of the color swatch in pixels' },
    { name: 'swatchHeight', type: 'number', label: 'Swatch Height', default: 60, min: 20, max: 500, category: 'style', description: 'Height of the color swatch in pixels' },
    { name: 'swatchBorderRadius', type: 'number', label: 'Swatch Border Radius', default: 4, min: 0, max: 50, category: 'style' },
  ],
};

const ColorPickerWidget: React.FC<WidgetProps> = ({ config, entityState }) => {
  // Phase 44: Config destructuring with defaults
  const { 
    entity_id = '', 
    outputFormat = 'auto',
    customService = '',
    customField = '',
    swatchWidth = 60, 
    swatchHeight = 60, 
    swatchBorderRadius = 4,
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  const { hass } = useWebSocket();
  const { setWidgetState } = useWidgetRuntimeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);

  // Preset colors
  const presetColors = [
    '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80',
    '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
    '#FFFFFF', '#C0C0C0', '#808080', '#404040', '#000000', '#FFC0CB',
  ];

  // Get current color from entity attributes or state
  const getCurrentColor = (): string => {
    if (!entityState) return '#ff0000';
    
    const { rgb_color } = entityState.attributes || {};
    if (rgb_color && Array.isArray(rgb_color) && rgb_color.length >= 3) {
      const [r, g, b] = rgb_color;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    if (entityState.state && typeof entityState.state === 'string') {
      const state = entityState.state.trim();
      if (/^#?[0-9A-Fa-f]{6}$/.test(state)) {
        return state.startsWith('#') ? state : `#${state}`;
      }
    }
    
    return '#ff0000';
  };

  const [localColor, setLocalColor] = useState(getCurrentColor());

  useEffect(() => {
    const color = getCurrentColor();
    setLocalColor(color);
    const { h, s, v } = rgbToHsv(...hexToRgb(color));
    setHue(h);
    setSaturation(s);
    setBrightness(v);
  }, [entityState?.attributes?.rgb_color]);

  // Publish runtime state so flows can read the current color via runtime.value
  useEffect(() => {
    const [r, g, b] = hexToRgb(localColor);
    setWidgetState(config.id, {
      value: localColor,   // hex string: '#ff8000' — readable as runtime.value
      type: 'colorpicker',
      metadata: {
        hex: localColor,   // same as value, for explicitness
        rgb: [r, g, b],    // [255, 128, 0]
      },
    });
  }, [localColor, config.id, setWidgetState]);

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
  };

  const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    let h = 0;
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;

    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / diff + 2) * 60;
      else h = ((r - g) / diff + 4) * 60;
    }

    return { h, s, v };
  };

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const formatColorOutput = (hexColor: string, format: string, domain: string): any => {
    if (format === 'auto') {
      return domain === 'light' ? { type: 'rgb', value: hexToRgb(hexColor) } : { type: 'hex', value: hexColor };
    }
    
    switch (format) {
      case 'rgb': return { type: 'rgb', value: hexToRgb(hexColor) };
      case 'hex': return { type: 'hex', value: hexColor };
      case 'hex_no_hash': return { type: 'hex', value: hexColor.replace('#', '') };
      default: return { type: 'hex', value: hexColor };
    }
  };

  const sendColorUpdate = async (newColor: string) => {
    if (!entity_id || !hass) return;

    const domain = entity_id.split('.')[0];
    const formatted = formatColorOutput(newColor, outputFormat, domain);

    let service: string;
    let serviceDomain: string;
    let fieldName: string;

    if (customService) {
      const parts = customService.split('.');
      if (parts.length !== 2) return;
      [serviceDomain, service] = parts;
      fieldName = customField || 'color';
    } else {
      serviceDomain = domain;
      if (domain === 'light') {
        service = 'turn_on';
        fieldName = customField || 'rgb_color';
      } else if (domain === 'input_text') {
        service = 'set_value';
        fieldName = customField || 'value';
      } else {
        return;
      }
    }

    const serviceData: any = { entity_id, [fieldName]: formatted.value };

    try {
      await hass.callService(serviceDomain, service, serviceData);
    } catch (error) {
      console.error('[ColorPicker] Failed:', error);
    }
  };

  const updateColorFromHSV = async () => {
    const [r, g, b] = hsvToRgb(hue, saturation, brightness);
    const newColor = rgbToHex(r, g, b);
    setLocalColor(newColor);
    await sendColorUpdate(newColor);
  };

  const handlePresetClick = async (color: string) => {
    setLocalColor(color);
    const { h, s, v } = rgbToHsv(...hexToRgb(color));
    setHue(h);
    setSaturation(s);
    setBrightness(v);
    await sendColorUpdate(color);
  };

  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= radius) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      setHue((angle + 360) % 360);
      setSaturation(Math.min(100, (distance / radius) * 100));
    }
  };

  useEffect(() => {
    updateColorFromHSV();
  }, [hue, saturation, brightness]);

  // Draw color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 0.5) * Math.PI / 180;
      const endAngle = (angle + 0.5) * Math.PI / 180;

      for (let r = 0; r <= radius; r += 1) {
        const sat = (r / radius) * 100;
        const [red, green, blue] = hsvToRgb(angle, sat, brightness);
        ctx.strokeStyle = rgbToHex(red, green, blue);
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, startAngle, endAngle);
        ctx.stroke();
      }
    }

    // Draw indicator
    const currentRadius = (saturation / 100) * radius;
    const currentAngle = hue * Math.PI / 180;
    const indicatorX = centerX + currentRadius * Math.cos(currentAngle);
    const indicatorY = centerY + currentRadius * Math.sin(currentAngle);

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = localColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, 2 * Math.PI);
    ctx.stroke();
  }, [hue, saturation, brightness, localColor]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: isVisible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxSizing: 'border-box',
  };

  const finalContainerStyle = applyUniversalStyles(universalStyle, containerStyle);

  const swatchStyle: React.CSSProperties = {
    width: `${swatchWidth}px`,
    height: `${swatchHeight}px`,
    backgroundColor: localColor,
    borderRadius: `${swatchBorderRadius}px`,
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  return (
    <>
      <div style={finalContainerStyle} onClick={() => setDialogOpen(true)}>
        <div style={swatchStyle} />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#1e1e1e', color: '#ffffff', borderRadius: '16px', padding: '20px', boxSizing: 'border-box' } }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🎨 Pick a Color</h2>
          <IconButton onClick={() => setDialogOpen(false)} style={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <canvas ref={canvasRef} width={300} height={300}
            onClick={(e) => handleCanvasInteraction(e.clientX, e.clientY)}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              handleCanvasInteraction(touch.clientX, touch.clientY);
            }}
            style={{ cursor: 'pointer', touchAction: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>
            Brightness: {Math.round(brightness)}%
          </label>
          <input type="range" min="0" max="100" value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={{
              width: '100%', height: '40px', cursor: 'pointer', appearance: 'none',
              background: `linear-gradient(to right, #000000, ${rgbToHex(...hsvToRgb(hue, saturation, 100))})`,
              borderRadius: '8px', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', boxSizing: 'border-box',
          backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: localColor, borderRadius: '8px',
            border: '2px solid rgba(255, 255, 255, 0.3)' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace' }}>{localColor.toUpperCase()}</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>RGB: {hsvToRgb(hue, saturation, brightness).join(', ')}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', opacity: 0.8 }}>Quick Colors</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '8px' }}>
            {presetColors.map((color, index) => (
              <div key={index} onClick={() => handlePresetClick(color)}
                style={{
                  width: '100%', paddingBottom: '100%', boxSizing: 'border-box', backgroundColor: color, borderRadius: '8px',
                  cursor: 'pointer', position: 'relative',
                  border: localColor.toUpperCase() === color.toUpperCase() ? '3px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.2)',
                  transition: 'transform 0.1s, border 0.1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ColorPickerWidget;
