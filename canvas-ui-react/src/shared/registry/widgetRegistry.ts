/**
 * Central Widget Registry
 * Single source of truth for all widget metadata
 */

import type { WidgetMetadata } from '../types/metadata';
import { BorderWidgetMetadata } from '../widgets/BorderWidget';
import { ButtonWidgetMetadata } from '../widgets/ButtonWidget';
import { CalendarWidgetMetadata } from '../widgets/CalendarWidget';
import { cameraWidgetMetadata } from '../widgets/CameraWidget';
import { ColorPickerWidgetMetadata } from '../widgets/ColorPickerWidget';
import { DigitalClockWidgetMetadata } from '../widgets/DigitalClockWidget';
import { FlipClockWidgetMetadata } from '../widgets/FlipClockWidget';
import { GaugeWidgetMetadata } from '../widgets/GaugeWidget';
import { GraphWidgetMetadata } from '../widgets/GraphWidget';
import { htmlWidgetMetadata } from '../widgets/HtmlWidget';
import { iconWidgetMetadata } from '../widgets/IconWidget';
import { IFrameWidgetMetadata } from '../widgets/IFrameWidget';
import { ImageWidgetMetadata } from '../widgets/ImageWidget';
import { InputTextWidgetMetadata } from '../widgets/InputTextWidget';
import { KeyboardWidgetMetadata } from '../widgets/KeyboardWidget';
import { KnobWidgetMetadata } from '../widgets/KnobWidget';
import { lovelaceCardWidgetMetadata } from '../widgets/LovelaceCardWidget';
import { ProgressBarWidgetMetadata } from '../widgets/ProgressBarWidget';
import { ProgressCircleWidgetMetadata } from '../widgets/ProgressCircleWidget';
import { RadioButtonWidgetMetadata } from '../widgets/RadioButtonWidget';
import { resolutionWidgetMetadata } from '../widgets/ResolutionWidget';
import { screensaverWidgetMetadata } from '../widgets/ScreensaverWidget';
import { ScrollingTextWidgetMetadata } from '../widgets/ScrollingTextWidget';
import { SliderWidgetMetadata } from '../widgets/SliderWidget';
import { SwitchWidgetMetadata } from '../widgets/SwitchWidget';
import { TextWidgetMetadata } from '../widgets/TextWidget';
import { ValueWidgetMetadata } from '../widgets/ValueWidget';
import { weatherWidgetMetadata } from '../widgets/WeatherWidget';

export interface WidgetRegistryEntry {
  type: string;
  metadata: WidgetMetadata;
}

// Central widget metadata registry - add new widgets here
export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
  button: ButtonWidgetMetadata,
  text: TextWidgetMetadata,
  gauge: GaugeWidgetMetadata,
  camera: cameraWidgetMetadata,
  slider: SliderWidgetMetadata,
  switch: SwitchWidgetMetadata,
  image: ImageWidgetMetadata,
  icon: iconWidgetMetadata,
  progressbar: ProgressBarWidgetMetadata,
  progresscircle: ProgressCircleWidgetMetadata,
  inputtext: InputTextWidgetMetadata,
  keyboard: KeyboardWidgetMetadata,
  flipclock: FlipClockWidgetMetadata,
  digitalclock: DigitalClockWidgetMetadata,
  knob: KnobWidgetMetadata,
  iframe: IFrameWidgetMetadata,
  border: BorderWidgetMetadata,
  lovelacecard: lovelaceCardWidgetMetadata,
  value: ValueWidgetMetadata,
  radiobutton: RadioButtonWidgetMetadata,
  colorpicker: ColorPickerWidgetMetadata,
  weather: weatherWidgetMetadata,
  resolution: resolutionWidgetMetadata,
  html: htmlWidgetMetadata,
  graph: GraphWidgetMetadata,
  calendar: CalendarWidgetMetadata,
  scrollingtext: ScrollingTextWidgetMetadata,
  screensaver: screensaverWidgetMetadata,
};

/**
 * Get all widget types
 */
export function getWidgetTypes(): string[] {
  return Object.keys(WIDGET_REGISTRY);
}

/**
 * Get metadata for a specific widget type
 */
export function getWidgetMetadata(type: string): WidgetMetadata | undefined {
  return WIDGET_REGISTRY[type];
}

/**
 * Get all widget entries as array (type + metadata pairs)
 */
export function getAllWidgets(): WidgetRegistryEntry[] {
  return Object.entries(WIDGET_REGISTRY).map(([type, metadata]) => ({
    type,
    metadata,
  }));
}
