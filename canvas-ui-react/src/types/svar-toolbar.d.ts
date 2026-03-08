// Type definitions for @svar-ui/react-toolbar
// Minimal types to avoid compilation errors

declare module '@svar-ui/react-toolbar' {
  import type { FC } from 'react';

  export interface IToolbarItem {
    id?: string | number;
    comp?: string | FC<any>;
    icon?: string;
    css?: string;
    text?: string;
    menuText?: string;
    key?: string;
    spacer?: boolean;
    collapsed?: boolean;
    handler?: (item: IToolbarItem, value?: any) => void;
    layout?: 'column';
    items?: IToolbarItem[];
    type?: 'primary' | 'danger' | 'success' | 'secondary';
    [key: string]: any;
  }

  export const Toolbar: FC<{
    items?: IToolbarItem[];
    menuCss?: string;
    css?: string;
    values?: { [key: string]: any };
    overflow?: 'collapse' | 'wrap' | 'menu';
    onClick?: (ev: { item: IToolbarItem }) => void;
    onChange?: (ev: { value: any; item: IToolbarItem }) => void;
  }>;

  export function registerToolbarItem(
    type: string,
    handler: FC<any>,
  ): void;
}

declare module '@svar-ui/react-toolbar/style.css' {
  const content: string;
  export default content;
}
