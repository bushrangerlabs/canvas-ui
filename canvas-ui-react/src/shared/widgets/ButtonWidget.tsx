/**
 * Button Widget - Simple clickable button that calls HA services
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React, { useState } from 'react';
import { useEntityBinding } from '../../hooks/useEntityBinding';
import { useVisibility } from '../../hooks/useVisibility';
import { UniversalIcon } from '../components/UniversalIcon';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

// Static metadata for inspector
export const ButtonWidgetMetadata: WidgetMetadata = {
  name: 'Button',
  icon: 'TouchApp',
  category: 'basic',
  description: 'Clickable button that triggers Home Assistant services',
  defaultSize: { w: 200, h: 80 },
  minSize: { w: 60, h: 40 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 60, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 80, min: 40, category: 'layout' },
    
    // Behavior
    { name: 'label', type: 'text', label: 'Button Text', default: 'Button', category: 'behavior' },
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Target entity (optional for custom actions)' },
    
    // Action Type
    { name: 'actionType', type: 'select', label: 'Action Type', default: 'auto', category: 'behavior', options: [
      { value: 'auto', label: 'Auto-detect from Entity' },
      { value: 'toggle', label: 'Toggle' },
      { value: 'turn_on', label: 'Turn On' },
      { value: 'turn_off', label: 'Turn Off' },
      { value: 'custom', label: 'Custom Service Call' },
      { value: 'navigation', label: 'Navigate to View' },
      { value: 'url', label: 'Open URL' },
      { value: 'mqtt', label: 'MQTT Publish' },
    ]},
    
    // Auto/Toggle/On/Off Actions
    { name: 'value', type: 'text', label: 'Value', default: '', category: 'behavior', description: 'Value to set (for input_text, input_number, etc.)' },
    
    // Custom Service Call
    { name: 'customDomain', type: 'text', label: 'Service Domain', default: '', category: 'behavior', description: 'e.g. light, switch, script', visibleWhen: { field: 'actionType', value: 'custom' } },
    { name: 'customService', type: 'text', label: 'Service Name', default: '', category: 'behavior', description: 'e.g. turn_on, toggle, trigger', visibleWhen: { field: 'actionType', value: 'custom' } },
    { name: 'serviceData', type: 'text', label: 'Service Data (JSON)', default: '{}', category: 'behavior', description: 'Additional service parameters as JSON', visibleWhen: { field: 'actionType', value: 'custom' } },
    
    // Navigation
    { name: 'targetView', type: 'text', label: 'Target View ID', default: '', category: 'behavior', description: 'View to navigate to', visibleWhen: { field: 'actionType', value: 'navigation' } },
    
    // URL
    { name: 'url', type: 'text', label: 'URL', default: '', category: 'behavior', description: 'URL to open (e.g. https://example.com)', visibleWhen: { field: 'actionType', value: 'url' } },
    { name: 'urlTarget', type: 'select', label: 'URL Target', default: '_blank', category: 'behavior', options: [
      { value: '_blank', label: 'New Tab' },
      { value: '_self', label: 'Same Tab' },
    ], visibleWhen: { field: 'actionType', value: 'url' } },
    
    // MQTT
    { name: 'mqttTopic', type: 'text', label: 'MQTT Topic', default: '', category: 'behavior', description: 'e.g. home/devices/switch1', visibleWhen: { field: 'actionType', value: 'mqtt' } },
    { name: 'mqttPayload', type: 'text', label: 'MQTT Payload', default: '', category: 'behavior', description: 'Message to publish (plain text or JSON)', visibleWhen: { field: 'actionType', value: 'mqtt' } },
    { name: 'mqttQos', type: 'select', label: 'MQTT QoS', default: '0', category: 'behavior', options: [
      { value: '0', label: '0 - At most once' },
      { value: '1', label: '1 - At least once' },
      { value: '2', label: '2 - Exactly once' },
    ], visibleWhen: { field: 'actionType', value: 'mqtt' } },
    { name: 'mqttRetain', type: 'checkbox', label: 'MQTT Retain', default: false, category: 'behavior', description: 'Retain message on broker', visibleWhen: { field: 'actionType', value: 'mqtt' } },
    
    // Confirmation
    { name: 'confirmAction', type: 'checkbox', label: 'Require Confirmation', default: false, category: 'behavior' },
    { name: 'confirmMessage', type: 'text', label: 'Confirmation Message', default: 'Are you sure?', category: 'behavior' },
    
    // Haptic Feedback
    { name: 'hapticFeedback', type: 'checkbox', label: 'Haptic Feedback', default: false, category: 'behavior', description: 'Vibrate on tap (mobile only)' },
    
    // Click Feedback
    { name: 'clickFeedback', type: 'select', label: 'Click Feedback', default: 'scale', category: 'behavior', options: [
      { value: 'none', label: 'None' },
      { value: 'scale', label: 'Scale (zoom)' },
      { value: 'highlight', label: 'Highlight (brighten)' },
      { value: 'ripple', label: 'Ripple Effect' },
      { value: 'shadow', label: 'Shadow Pulse' },
      { value: 'color', label: 'Color Change' },
    ]},
    { name: 'feedbackDuration', type: 'number', label: 'Feedback Duration (ms)', default: 200, min: 50, max: 1000, category: 'behavior', description: 'How long the feedback effect lasts' },
    { name: 'feedbackIntensity', type: 'slider', label: 'Feedback Intensity', default: 1.0, min: 0.5, max: 2.0, step: 0.1, category: 'behavior', description: 'Intensity for scale/highlight/shadow effects' },
    { name: 'clickBackgroundColor', type: 'color', label: 'Click Background Color', default: '#1976d2', category: 'behavior', description: 'Temporary background color when clicked', visibleWhen: { field: 'clickFeedback', value: 'color' } },
    { name: 'clickBorderColor', type: 'color', label: 'Click Border Color', default: '#ffffff', category: 'behavior', description: 'Temporary border color when clicked', visibleWhen: { field: 'clickFeedback', value: 'color' } },
    { name: 'clickBorderWidth', type: 'number', label: 'Click Border Width', default: 2, min: 0, max: 10, category: 'behavior', description: 'Border width during click feedback', visibleWhen: { field: 'clickFeedback', value: 'color' } },
    
    // Icon
    { name: 'showIcon', type: 'checkbox', label: 'Show Icon', default: false, category: 'style' },
    { name: 'icon', type: 'icon', label: 'Icon', default: 'mdi:lightbulb', category: 'style' },
    { name: 'iconPosition', type: 'select', label: 'Icon Position', default: 'left', category: 'style', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
      { value: 'only', label: 'Icon Only (no text)' },
    ]},
    { name: 'iconSize', type: 'number', label: 'Icon Size', default: 24, min: 12, max: 96, category: 'style' },
    { name: 'iconSpacing', type: 'number', label: 'Icon Spacing', default: 8, min: 0, max: 32, category: 'style', description: 'Space between icon and text' },
    { name: 'iconColor', type: 'color', label: 'Icon Color', default: '', category: 'style', description: 'Icon color (defaults to text color if not set)' },
    
    // Visual Feedback
    
    // Style
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#2196f3', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 16, min: 8, max: 72, category: 'style' },
    { name: 'borderRadius', type: 'number', label: 'Border Radius', default: 4, min: 0, max: 50, category: 'style' },
    { name: 'borderWidth', type: 'number', label: 'Border Width', default: 0, min: 0, max: 10, category: 'style' },
    { name: 'borderColor', type: 'color', label: 'Border Color', default: '#ffffff', category: 'style' },
    { name: 'borderStyle', type: 'select', label: 'Border Style', default: 'solid', category: 'style', options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'double', label: 'Double' },
    ]},
    { name: 'fontWeight', type: 'select', label: 'Font Weight', default: 'normal', category: 'style', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'bold', label: 'Bold' },
      { value: '300', label: 'Light' },
      { value: '500', label: 'Medium' },
    ]},
  ],
};

const ButtonWidget: React.FC<WidgetProps> = ({ config, isEditMode }) => {
  const { hass } = useWebSocket();
  const [isActive, setIsActive] = useState(false);

  // Phase 44: Config destructuring with defaults
  const {
    actionType = 'auto',
    label: labelConfig = 'Button',
    entity_id = '',
    value = '',
    customDomain = '',
    customService = '',
    serviceData = '{}',
    targetView = '',
    url = '',
    urlTarget = '_blank',
    mqttTopic = '',
    mqttPayload = '',
    mqttQos = '0',
    mqttRetain = false,
    confirmAction = false,
    confirmMessage = 'Are you sure?',
    hapticFeedback = false,
    clickFeedback = 'scale',
    feedbackDuration = 200,
    feedbackIntensity = 1.0,
    clickBackgroundColor = '#1976d2',
    clickBorderColor = '#ffffff',
    clickBorderWidth = 2,
    showIcon = false,
    icon = 'mdi:lightbulb',
    iconPosition = 'left',
    iconSize = 24,
    iconSpacing = 8,
    iconColor: iconColorConfig = '',
    backgroundColor: bgColorConfig = '#2196f3',
    textColor: textColorConfig = '#ffffff',
    fontFamily = 'Arial, sans-serif',
    fontSize = 16,
    borderRadius = 4,
    borderWidth = 0,
    borderColor = '#ffffff',
    borderStyle = 'solid',
    cornerRadius, // AI sometimes uses 'cornerRadius' (Lovelace card terminology)
    fontWeight = 'normal',
    visibilityCondition,
  } = config.config;

  // Support both borderRadius and cornerRadius (AI uses cornerRadius for Lovelace cards)
  // Can be either a number (all corners) or object (individual corners)
  const universalStyle = config.config.style || config.config as any;
  const radiusValue = cornerRadius !== undefined ? cornerRadius : borderRadius;
  
  // Convert to CSS border-radius string
  const borderRadiusCSS = typeof radiusValue === 'object' && radiusValue !== null
    ? `${radiusValue.topLeft || 0}px ${radiusValue.topRight || 0}px ${radiusValue.bottomRight || 0}px ${radiusValue.bottomLeft || 0}px`
    : `${radiusValue}px`;

  // Check visibility condition
  const isVisible = useVisibility(visibilityCondition);

  // Use entity bindings for dynamic properties
  const label = useEntityBinding(labelConfig, 'Button');
  const backgroundColor = useEntityBinding(bgColorConfig, '#2196f3');
  const textColor = useEntityBinding(textColorConfig, '#ffffff');
  const iconColor = useEntityBinding(iconColorConfig, iconColorConfig || textColor);

  const handleClick = async () => {
    if (isEditMode) return;

    // Visual feedback
    if (clickFeedback !== 'none') {
      setIsActive(true);
      setTimeout(() => setIsActive(false), feedbackDuration);
    }

    // Haptic feedback
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Confirmation dialog
    if (confirmAction) {
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Handle different action types
    switch (actionType) {
      case 'navigation':
        handleNavigation();
        break;
      
      case 'url':
        handleUrl();
        break;
      
      case 'custom':
        await handleCustomService();
        break;
      
      case 'mqtt':
        await handleMqttPublish();
        break;
      
      default:
        await handleEntityAction();
        break;
    }
  };

  const handleNavigation = () => {
    if (targetView) {
      window.location.hash = `#${targetView}`;
    }
  };

  const handleUrl = () => {
    if (url) {
      window.open(url, urlTarget);
    }
  };

  const handleMqttPublish = async () => {
    if (!hass) return;
    
    if (!mqttTopic) {
      console.error('[ButtonWidget] MQTT publish requires a topic');
      return;
    }

    try {
      await hass.callService('mqtt', 'publish', {
        topic: mqttTopic,
        payload: mqttPayload,
        qos: parseInt(mqttQos),
        retain: mqttRetain,
      });
      console.log(`[ButtonWidget] MQTT published to ${mqttTopic}: ${mqttPayload}`);
    } catch (error) {
      console.error('[ButtonWidget] MQTT publish failed:', error);
    }
  };

  const handleCustomService = async () => {
    if (!hass) return;
    
    if (!customDomain || !customService) {
      console.error('[ButtonWidget] Custom service requires domain and service name');
      return;
    }

    let serviceDataObj: any = {};
    
    // Parse service data JSON
    try {
      serviceDataObj = JSON.parse(serviceData);
    } catch (error) {
      console.error('[ButtonWidget] Invalid service data JSON:', error);
      return;
    }

    try {
      await hass.callService(customDomain, customService, serviceDataObj);
    } catch (error) {
      console.error('[ButtonWidget] Custom service call failed:', error);
    }
  };

  const handleEntityAction = async () => {
    if (!hass) return;

    if (!entity_id) {
      console.warn('[ButtonWidget] No entity_id specified');
      return;
    }

    const domain = entity_id.split('.')[0];
    let serviceDomain = domain;
    let serviceName = '';
    let serviceDataObj: any = { entity_id };

    // Handle explicit action types (toggle, turn_on, turn_off)
    if (actionType === 'toggle') {
      serviceName = 'toggle';
    } else if (actionType === 'turn_on') {
      serviceName = 'turn_on';
    } else if (actionType === 'turn_off') {
      serviceName = 'turn_off';
    } else {
      // Auto-detect service based on entity domain and value
      const normalizedValue = String(value).toLowerCase().trim();

      switch (domain) {
        case 'light':
        case 'switch':
        case 'fan':
          // Binary entities: on/off
          if (normalizedValue === 'on' || normalizedValue === 'true' || normalizedValue === '1') {
            serviceName = 'turn_on';
          } else if (normalizedValue === 'off' || normalizedValue === 'false' || normalizedValue === '0') {
            serviceName = 'turn_off';
          } else {
            serviceName = 'toggle';
          }
          break;

        case 'input_text':
          serviceName = 'set_value';
          serviceDataObj.value = String(value);
          break;

        case 'input_number':
          serviceName = 'set_value';
          serviceDataObj.value = parseFloat(value) || 0;
          break;

        case 'input_boolean':
          if (normalizedValue === 'on' || normalizedValue === 'true' || normalizedValue === '1') {
            serviceName = 'turn_on';
          } else if (normalizedValue === 'off' || normalizedValue === 'false' || normalizedValue === '0') {
            serviceName = 'turn_off';
          } else {
            serviceName = 'toggle';
          }
          break;

        case 'input_select':
          serviceName = 'select_option';
          serviceDataObj.option = String(value);
          break;

        case 'script':
        case 'automation':
          serviceName = 'turn_on';
          // Scripts and automations just run, ignore the value
          break;

        case 'scene':
          serviceName = 'turn_on';
          break;

        case 'cover':
          if (normalizedValue === 'open') {
            serviceName = 'open_cover';
          } else if (normalizedValue === 'close') {
            serviceName = 'close_cover';
          } else if (normalizedValue === 'stop') {
            serviceName = 'stop_cover';
          } else {
            serviceName = 'toggle';
          }
          break;

        case 'lock':
          if (normalizedValue === 'lock') {
            serviceName = 'lock';
          } else if (normalizedValue === 'unlock') {
            serviceName = 'unlock';
          } else {
            serviceName = 'lock';
          }
          break;

        default:
          // Generic toggle for unknown domains
          serviceName = 'toggle';
      }
    }

    if (serviceName) {
      try {
        await hass.callService(serviceDomain, serviceName, serviceDataObj);
      } catch (error) {
        console.error('[ButtonWidget] Service call failed:', error);
      }
    }
  };

  // Calculate feedback transform/filter
  let feedbackTransform = '';
  let feedbackFilter = '';
  let feedbackBoxShadow = '';
  let feedbackBackgroundColor = backgroundColor;
  let feedbackBorderOverride: string | undefined = undefined; // Only override border during color feedback

  if (isActive && !isEditMode) {
    switch (clickFeedback) {
      case 'scale':
        const scaleAmount = 0.95 + (0.05 * (2 - feedbackIntensity));
        feedbackTransform = `scale(${scaleAmount})`;
        break;
      case 'highlight':
        const brightness = 1 + (0.2 * feedbackIntensity);
        feedbackFilter = `brightness(${brightness})`;
        break;
      case 'shadow':
        const shadowSize = 10 * feedbackIntensity;
        feedbackBoxShadow = `0 0 ${shadowSize}px rgba(255, 255, 255, 0.5)`;
        break;
      case 'ripple':
        // Ripple handled via CSS animation
        feedbackTransform = 'scale(0.98)';
        break;
      case 'color':
        feedbackBackgroundColor = clickBackgroundColor;
        feedbackBorderOverride = `${clickBorderWidth}px solid ${clickBorderColor}`;
        break;
    }
  }

  // Determine flex direction based on icon position
  let flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row';
  if (iconPosition === 'right') flexDirection = 'row-reverse';
  if (iconPosition === 'top') flexDirection = 'column';
  if (iconPosition === 'bottom') flexDirection = 'column-reverse';

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: feedbackBackgroundColor,
    color: textColor,
    // Don't set border here - let universal styles handle it unless we're overriding during click feedback
    ...(feedbackBorderOverride ? { border: feedbackBorderOverride } : {}),
    borderRadius: borderRadiusCSS,
    fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight,
    cursor: isEditMode ? 'default' : 'pointer',
    display: 'flex',
    flexDirection: iconPosition === 'only' ? 'row' : flexDirection,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    boxSizing: 'border-box',
    opacity: isEditMode ? 0.7 : 1,
    pointerEvents: isEditMode ? 'none' : 'auto',
    transition: `all ${feedbackDuration}ms ease-out`,
    transform: feedbackTransform,
    filter: feedbackFilter,
    boxShadow: feedbackBoxShadow,
    gap: showIcon && iconPosition !== 'only' ? `${iconSpacing}px` : '0',
  };

  // Apply universal styles (z-index, rotation, background, border, shadow)
  // Merge config border properties with universal style
  const mergedUniversalStyle = {
    ...universalStyle,
    // Add border properties from config if not already in universal style
    borderWidth: universalStyle?.borderWidth ?? borderWidth,
    borderColor: universalStyle?.borderColor ?? borderColor,
    borderStyle: universalStyle?.borderStyle ?? borderStyle,
  };
  
  const finalStyle = applyUniversalStyles(mergedUniversalStyle, buttonStyle);

  // Don't render if visibility condition is false
  if (!isVisible) return null;

  return (
    <button style={finalStyle} onClick={handleClick} disabled={isEditMode}>
      {showIcon && (
        <UniversalIcon
          icon={icon}
          size={iconSize}
          color={iconColor}
        />
      )}
      {iconPosition !== 'only' && label}
    </button>
  );
};

export default ButtonWidget;
