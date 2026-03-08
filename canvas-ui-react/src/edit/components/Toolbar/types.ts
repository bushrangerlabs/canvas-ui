/**
 * Toolbar Types - MUI-based toolbar system
 * Inspired by ioBroker vis toolbar architecture
 */

export interface BaseToolbarItem {
  name?: string;
  hide?: boolean;
}

export interface IconButtonToolbarItem extends BaseToolbarItem {
  type: 'icon-button';
  icon: React.ReactElement;
  onAction: () => void;
  disabled?: boolean;
  selected?: boolean;
  tooltip?: string;
}

export interface ButtonToolbarItem extends BaseToolbarItem {
  type: 'button';
  text: string;
  onAction: () => void;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
}

export interface TextToolbarItem extends BaseToolbarItem {
  type: 'text';
  text: string;
}

export interface CustomToolbarItem extends BaseToolbarItem {
  type: 'custom';
  render: () => React.ReactElement;
}

export interface DividerToolbarItem extends BaseToolbarItem {
  type: 'divider';
}

export type ToolbarItem =
  | IconButtonToolbarItem
  | ButtonToolbarItem
  | TextToolbarItem
  | CustomToolbarItem
  | DividerToolbarItem;

export interface ToolbarGroup {
  name: string;
  items: (ToolbarItem[][] | ToolbarItem[] | ToolbarItem)[];
}
