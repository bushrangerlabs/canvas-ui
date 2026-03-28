/**
 * ContainerSelectionContext
 * Shared context for tracking which child widget is selected inside a
 * ScrollableContainerWidget. Used by the container widget (to highlight the
 * selected cell) and the Inspector (to show the child's own settings panel).
 */

import { createContext, useContext } from 'react';

export interface ContainerChildSelection {
  containerId: string;
  childId: string;
}

export interface ContainerSelectionContextType {
  selectedChild: ContainerChildSelection | null;
  setSelectedChild: (s: ContainerChildSelection | null) => void;
}

export const ContainerSelectionContext = createContext<ContainerSelectionContextType>({
  selectedChild: null,
  setSelectedChild: () => {},
});

export const useContainerSelection = () => useContext(ContainerSelectionContext);
