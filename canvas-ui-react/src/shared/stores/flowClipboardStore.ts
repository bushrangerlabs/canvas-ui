/**
 * flowClipboardStore — in-memory clipboard for copy/paste of flow node entries.
 * NOT persisted to localStorage — resets on page reload.
 */

import { create } from 'zustand';

interface ClipboardEntry {
  widget_id: string;
  property: string;
  value: string;
}

interface FlowClipboardStore {
  /** The node type that was copied from, e.g. 'set-widget-group' */
  nodeType: string | null;
  /** The copied entries */
  entries: ClipboardEntry[];
  /** Copy entries from a node */
  copyEntries: (nodeType: string, entries: ClipboardEntry[]) => void;
  /** Clear the clipboard */
  clearClipboard: () => void;
}

export const useFlowClipboardStore = create<FlowClipboardStore>((set) => ({
  nodeType: null,
  entries: [],
  copyEntries: (nodeType, entries) => set({ nodeType, entries: [...entries] }),
  clearClipboard: () => set({ nodeType: null, entries: [] }),
}));
