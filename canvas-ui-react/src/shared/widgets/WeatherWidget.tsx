/**
 * Weather Widget - Display current weather and forecast
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

const WeatherWidget: React.FC<WidgetProps> = ({ config }) => {
  const { entities } = useWebSocket();

  // Phase 44: Config destructuring with defaults
  const {
    entity_id = '',
    showForecast = true,
    forecastDays = 5,
    showHumidity = true,
    showWind = true,
    showPressure = false,
    compactMode = false,
    temperatureColor = '#ffffff',
    conditionColor = '#cccccc',
  } = config.config;
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);

  // Get weather entity state
  const weatherEntity = entity_id && entities?.[entity_id];
  const currentCondition = weatherEntity?.state || 'unknown';
  const temperature = weatherEntity?.attributes?.temperature ?? '--';
  const temperatureUnit = weatherEntity?.attributes?.temperature_unit || '°F';
  const humidity = weatherEntity?.attributes?.humidity ?? '--';
  const windSpeed = weatherEntity?.attributes?.wind_speed ?? '--';
  const windSpeedUnit = weatherEntity?.attributes?.wind_speed_unit || 'mph';
  const pressure = weatherEntity?.attributes?.pressure ?? '--';
  const forecast = weatherEntity?.attributes?.forecast || [];

  // Weather icon mapping (emoji only)
  const getWeatherIcon = (condition: string): string => {
    const emojiMap: Record<string, string> = {
      'clear-night': '🌙',
      'cloudy': '☁️',
      'fog': '🌫️',
      'hail': '🌨️',
      'lightning': '⛈️',
      'lightning-rainy': '⛈️',
      'partlycloudy': '⛅',
      'pouring': '🌧️',
      'rainy': '🌧️',
      'snowy': '❄️',
      'snowy-rainy': '🌨️',
      'sunny': '☀️',
      'windy': '💨',
      'windy-variant': '💨',
      'exceptional': '⚠️',
    };
    return emojiMap[condition] || '❓';
  };

  // Format condition text
  const formatCondition = (condition: string): string => {
    return condition
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (compactMode) {
    // Compact mode: Icon + Temperature only
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      boxSizing: 'border-box',
      userSelect: 'none',
    };
    const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

    return (
      <div style={finalStyle}>
        <div style={{ fontSize: '40px', marginBottom: '4px' }}>
          {getWeatherIcon(currentCondition)}
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: temperatureColor,
          }}
        >
          {temperature}{temperatureUnit}
        </div>
      </div>
    );
  }

  if (!showForecast) {
    // Normal mode: Current conditions only
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      boxSizing: 'border-box',
      userSelect: 'none',
    };
    const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

    return (
      <div style={finalStyle}>
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>
          {getWeatherIcon(currentCondition)}
        </div>
        <div
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: temperatureColor,
            marginBottom: '4px',
          }}
        >
          {temperature}{temperatureUnit}
        </div>
        <div
          style={{
            fontSize: '16px',
            color: conditionColor,
            marginBottom: '12px',
          }}
        >
          {formatCondition(currentCondition)}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: conditionColor,
          }}
        >
          {showHumidity && <div>💧 {humidity}%</div>}
          {showWind && <div>💨 {windSpeed} {windSpeedUnit}</div>}
          {showPressure && <div>🌡️ {pressure} hPa</div>}
        </div>
      </div>
    );
  }

  // Expanded mode: Current + Forecast
  const forecastItems = forecast.slice(0, forecastDays);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    padding: '12px',
    boxSizing: 'border-box',
    gap: '12px',
    userSelect: 'none',
    overflow: 'hidden',
  };
  const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

  return (
    <div style={finalStyle}>
      {/* Current conditions - Left side */}
      <div
        style={{
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          {getWeatherIcon(currentCondition)}
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: temperatureColor,
            marginBottom: '4px',
          }}
        >
          {temperature}{temperatureUnit}
        </div>
        <div
          style={{
            fontSize: '14px',
            color: conditionColor,
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {formatCondition(currentCondition)}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '11px',
            color: conditionColor,
          }}
        >
          {showHumidity && <div>💧 Humidity: {humidity}%</div>}
          {showWind && <div>💨 Wind: {windSpeed} {windSpeedUnit}</div>}
          {showPressure && <div>🌡️ Pressure: {pressure} hPa</div>}
        </div>
      </div>

      {/* Forecast - Right side */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
        }}
      >
        {forecastItems.map((item: any, index: number) => {
          const date = new Date(item.datetime);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <div style={{ flex: '0 0 40px', color: conditionColor }}>{dayName}</div>
              <div style={{ flex: '0 0 30px', fontSize: '20px' }}>
                {getWeatherIcon(item.condition)}
              </div>
              <div style={{ flex: '0 0 60px', textAlign: 'right', color: temperatureColor }}>
                {item.temperature}{temperatureUnit}
              </div>
              {item.templow !== undefined && (
                <div style={{ flex: '0 0 50px', textAlign: 'right', color: conditionColor, opacity: 0.7 }}>
                  {item.templow}{temperatureUnit}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const weatherWidgetMetadata: WidgetMetadata = {
  name: 'Weather',
  description: 'Display current weather and forecast',
  icon: 'WbSunny',
  category: 'display',
  defaultSize: { w: 300, h: 200 },
  fields: [
    // Layout
    { name: 'width', type: 'number', label: 'Width', default: 300, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 200, min: 100, category: 'layout' },

    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Weather Entity', default: '', category: 'behavior', description: 'Select weather.* entity' },
    { name: 'compactMode', type: 'checkbox', label: 'Compact Mode', default: false, category: 'behavior', description: 'Icon + temperature only' },
    { name: 'showForecast', type: 'checkbox', label: 'Show Forecast', default: true, category: 'behavior', description: 'Display forecast cards' },
    { name: 'forecastDays', type: 'number', label: 'Forecast Days', default: 5, min: 3, max: 7, category: 'behavior' },
    { name: 'showHumidity', type: 'checkbox', label: 'Show Humidity', default: true, category: 'behavior' },
    { name: 'showWind', type: 'checkbox', label: 'Show Wind', default: true, category: 'behavior' },
    { name: 'showPressure', type: 'checkbox', label: 'Show Pressure', default: false, category: 'behavior' },

    // Style
    { name: 'temperatureColor', type: 'color', label: 'Temperature Color', default: '#ffffff', category: 'style' },
    { name: 'conditionColor', type: 'color', label: 'Text Color', default: '#cccccc', category: 'style' },
  ],
};

export default WeatherWidget;
