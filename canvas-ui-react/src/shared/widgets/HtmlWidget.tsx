/**
 * HTML Widget - Display custom HTML content or load from an external HTML file
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

const HtmlWidget: React.FC<WidgetProps> = ({ config }) => {
  const {
    html: htmlContent = '<div>Enter HTML here</div>',
    htmlUrl = '',
    htmlEntity = '',
    useEntityHtml = false,
    htmlAttribute = '',
    backgroundColor = 'transparent',
    padding = 8,
    overflow = 'auto',
  } = config.config;

  const { entities } = useWebSocket();
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  const containerRef = useRef<HTMLDivElement>(null);

  const getHtml = (): string => {
    if (useEntityHtml && htmlEntity) {
      const entity = entities?.[htmlEntity];
      if (entity) {
        if (htmlAttribute && entity.attributes?.[htmlAttribute] != null) {
          return String(entity.attributes[htmlAttribute]);
        }
        return String(entity.state || '');
      }
    }

    return htmlContent;
  };

  useEffect(() => {
    if (!htmlUrl && containerRef.current) {
      containerRef.current.innerHTML = getHtml();
    }
  }, [htmlContent, htmlUrl, htmlEntity, useEntityHtml, htmlAttribute, entities]);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor,
    padding: `${padding}px`,
    overflow,
    boxSizing: 'border-box',
  };
  const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

  if (htmlUrl) {
    return (
      <div style={finalStyle}>
        <iframe
          src={htmlUrl}
          title="HTML Widget"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    );
  }

  return <div ref={containerRef} style={finalStyle} />;
};

export const htmlWidgetMetadata: WidgetMetadata = {
  name: 'HTML',
  description: 'Display custom HTML content or an external HTML file',
  icon: 'CodeOutlined',
  category: 'display',
  defaultSize: { w: 400, h: 300 },
  fields: [
    { name: 'width', type: 'number', label: 'Width', default: 400, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 300, min: 100, category: 'layout' },
    {
      name: 'htmlUrl',
      type: 'text',
      label: 'External HTML URL',
      default: '',
      category: 'behavior',
      description: 'URL to an external HTML file rendered in an iframe',
    },
    {
      name: 'useEntityHtml',
      type: 'checkbox',
      label: 'Use Entity HTML',
      default: false,
      category: 'behavior',
      description: 'Use entity state as HTML instead of static HTML',
      visibleWhen: { field: 'htmlUrl', value: '' },
    },
    {
      name: 'htmlEntity',
      type: 'entity',
      label: 'HTML Entity',
      default: '',
      category: 'behavior',
      description: 'Entity whose state or attribute contains the HTML',
      visibleWhen: { field: 'htmlUrl', value: '' },
    },
    {
      name: 'htmlAttribute',
      type: 'text',
      label: 'HTML Attribute',
      default: '',
      category: 'behavior',
      description: 'Entity attribute name containing HTML (bypasses 255-char state limit). Leave blank to use state.',
      visibleWhen: { field: 'htmlUrl', value: '' },
    },
    {
      name: 'html',
      type: 'textarea',
      label: 'HTML Content',
      default: '<div>Enter HTML here</div>',
      category: 'behavior',
      description: 'Custom HTML content',
      visibleWhen: { field: 'htmlUrl', value: '' },
    },
    {
      name: 'overflow',
      type: 'select',
      label: 'Overflow',
      default: 'auto',
      category: 'behavior',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'hidden', label: 'Hidden' },
        { value: 'scroll', label: 'Scroll' },
        { value: 'visible', label: 'Visible' },
      ],
    },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent', category: 'style' },
    { name: 'padding', type: 'number', label: 'Padding', default: 8, min: 0, max: 50, category: 'style' },
  ],
};

export default HtmlWidget;