/**
 * Editor Component - Edit mode with Inspector and Toolbar
 * Full-featured editor with MUI components
 * 
 * Uses SVAR React Toolbar for advanced toolbar features
 */

import { Box, Drawer, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import type { AIProvider } from '../../services/ai/ConversationService';
import { Canvas } from '../../shared/components/Canvas';
import { useFlowExecution } from '../../shared/hooks/useFlowExecution';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';
import { WIDGET_REGISTRY } from '../../shared/registry/widgetRegistry';
import { getViewFromURL, useConfigStore } from '../../shared/stores/useConfigStore';
import type { WidgetConfig } from '../../shared/types';
import { AISettingsDialog } from './AISettingsDialog';
import { CanvasToolbar } from './CanvasToolbar';
import { CloneViewDialog } from './CloneViewDialog';
import { DeleteViewDialog } from './DeleteViewDialog';
import { FileManager } from './FileManager';
import { FlowBuilder } from './FlowBuilder/FlowBuilder';
import { Inspector } from './Inspector';
import { VariablesManager } from './VariablesManager';
import { ViewManager } from './ViewManager';
import { WidgetLibrary } from './WidgetLibrary';
import { WidgetNameDialog } from './WidgetNameDialog';

const DRAWER_WIDTH = 300;

// Widget name validation
const WIDGET_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const RESERVED_WIDGET_NAMES = ['flow', 'node', 'edge', 'var', 'entity', 'widget', 'if', 'then', 'else'];

const validateWidgetName = (name: string, currentWidgetId: string, allWidgets: WidgetConfig[]): string | null => {
  if (!name || name.trim() === '') {
    return null; // Empty is allowed (optional field)
  }

  const trimmed = name.trim();

  // Check format (alphanumeric + underscores, must start with letter or underscore)
  if (!WIDGET_NAME_REGEX.test(trimmed)) {
    return 'Name must start with letter/underscore and contain only letters, numbers, and underscores';
  }

  // Check reserved words
  if (RESERVED_WIDGET_NAMES.includes(trimmed.toLowerCase())) {
    return `"${trimmed}" is a reserved word and cannot be used`;
  }

  // Check uniqueness across ALL views
  const duplicate = allWidgets.find(w => w.id !== currentWidgetId && w.name === trimmed);
  if (duplicate) {
    return `Name "${trimmed}" is already used by another widget`;
  }

  return null; // Valid
};

const Editor: React.FC = () => {
  const { connected, authenticated, hass } = useWebSocket();
  const { config, currentViewId, mode, setCurrentView, setMode, addView, deleteView, duplicateView, cloneView, updateView, loadConfig, saveConfig, updateWidget, undo, redo, canUndo, canRedo, exportView, importView } = useConfigStore();
  
  // Initialize flow execution engine
  useFlowExecution();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [copiedWidgets, setCopiedWidgets] = useState<WidgetConfig[]>([]);
  const isDraggingRef = useRef(false); // Track drag state to defer saves (ref to avoid closure)
  const [widgetLibraryOpen, setWidgetLibraryOpen] = useState(false);
  const [viewManagerOpen, setViewManagerOpen] = useState(false);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [cloneViewDialogOpen, setCloneViewDialogOpen] = useState(false);
  const [deleteViewDialogOpen, setDeleteViewDialogOpen] = useState(false);
  const [variablesManagerOpen, setVariablesManagerOpen] = useState(false); // Phase 2
  const [flowBuilderOpen, setFlowBuilderOpen] = useState(false); // Phase 3
  const [aiSettingsOpen, setAISettingsOpen] = useState(false); // AI Settings (Provider + Prompts)
  const [widgetNameDialogOpen, setWidgetNameDialogOpen] = useState(false); // Widget naming dialog
  const [pendingWidgetType, setPendingWidgetType] = useState<string | null>(null); // Type of widget being added
  
  // AI Provider Settings (read from localStorage)
  const [aiProvider, setAIProvider] = useState<AIProvider>(() => {
    const saved = localStorage.getItem('canvasui_ai_provider');
    return (saved as AIProvider) || 'ollama';
  });
  const [aiApiKey, setAIApiKey] = useState<string>(() => {
    return localStorage.getItem('canvasui_openai_apikey') || '';
  });
  const [aiGitHubToken, setAIGitHubToken] = useState<string>(() => {
    return localStorage.getItem('canvasui_github_token') || '';
  });
  const [aiGroqApiKey, setAIGroqApiKey] = useState<string>(() => {
    return localStorage.getItem('canvasui_groq_apikey') || '';
  });
  const [aiOpenWebUIUrl, setAIOpenWebUIUrl] = useState<string>(() => {
    return localStorage.getItem('canvasui_openwebui_url') || 'http://localhost:3000';
  });
  const [aiOpenWebUIApiKey, setAIOpenWebUIApiKey] = useState<string>(() => {
    return localStorage.getItem('canvasui_openwebui_apikey') || '';
  });
  const [aiCopilotProxyToken, setAICopilotProxyToken] = useState<string>(() => {
    return localStorage.getItem('canvasui_copilotproxy_token') || '';
  });
  const [aiCopilotProxyUrl, setAICopilotProxyUrl] = useState<string>(() => {
    return localStorage.getItem('canvasui_copilotproxy_url') || 'http://localhost:3100/v1';
  });
  
  // Advanced editor features
  const [gridSnap, setGridSnap] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [gridColor, setGridColor] = useState('#ffffff');
  const [gridLineWidth, setGridLineWidth] = useState(1);
  const [gridBrightness, setGridBrightness] = useState(0.2);
  const [zoom, setZoom] = useState(100);

  // Hide sidebar in kiosk mode
  useEffect(() => {
    if (mode === 'kiosk') {
      console.log('[Kiosk] Activating kiosk mode - hiding sidebar');
      
      // Add aggressive global CSS
      const globalStyle = document.createElement('style');
      globalStyle.id = 'canvas-kiosk-global-style';
      globalStyle.textContent = `
        /* Hide HA menu button globally */
        ha-menu-button,
        [slot="toolbar"] ha-menu-button,
        app-toolbar ha-menu-button {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Force full width layout */
        body, html, home-assistant {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(globalStyle);
      console.log('[Kiosk] ✅ Global CSS injected');
      
      const hideDrawer = () => {
        try {
          const ha = document.querySelector('home-assistant');
          if (!ha?.shadowRoot) {
            console.log('[Kiosk] Waiting for home-assistant shadow root...');
            return false;
          }

          const main = ha.shadowRoot.querySelector('home-assistant-main');
          if (!main?.shadowRoot) {
            console.log('[Kiosk] Waiting for home-assistant-main shadow root...');
            return false;
          }

          const drawerLayout = main.shadowRoot.querySelector('app-drawer-layout');
          if (!drawerLayout) {
            console.log('[Kiosk] Waiting for app-drawer-layout...');
            return false;
          }

          // Find ALL possible drawer elements
          const selectors = [
            'app-drawer',
            'ha-drawer', 
            'mwc-drawer',
            '#drawer',
            '[slot="drawer"]',
            '[drawer]',
            '.drawer'
          ];
          
          let hiddenCount = 0;
          selectors.forEach(selector => {
            const drawers = drawerLayout.querySelectorAll(selector);
            drawers.forEach(drawer => {
              (drawer as HTMLElement).style.cssText = 'display: none !important; width: 0 !important; visibility: hidden !important;';
              hiddenCount++;
            });
          });

          // Set CSS variables
          (drawerLayout as HTMLElement).style.cssText = '--app-drawer-width: 0px !important; --mdc-drawer-width: 0px !important;';
          
          if (hiddenCount > 0) {
            console.log(`[Kiosk] ✅ Hidden ${hiddenCount} drawer elements`);
            return true;
          }
          
          return false;
        } catch (e) {
          console.warn('[Kiosk] Error hiding sidebar:', e);
          return false;
        }
      };

      // Retry until successful (max 50 attempts over 10 seconds)
      let attempts = 0;
      const interval = setInterval(() => {
        if (hideDrawer() || ++attempts >= 50) {
          clearInterval(interval);
          if (attempts >= 50) {
            console.error('[Kiosk] ❌ Failed to hide sidebar after 50 attempts');
            console.error('[Kiosk] Sidebar may require kiosk-mode.js addon or Fully Kiosk Browser');
          }
        }
      }, 200);

      return () => {
        clearInterval(interval);
        document.getElementById('canvas-kiosk-global-style')?.remove();
      };
    }
  }, [mode]);

  // Load config on mount
  useEffect(() => {
    if (hass && authenticated) {
      loadConfig(hass).finally(() => setLoading(false));
    }
  }, [hass, authenticated, loadConfig]);

  // Sync view from URL on mount and hash changes
  useEffect(() => {
    const syncViewFromURL = () => {
      const viewName = getViewFromURL();
      if (import.meta.env.DEV) console.log('[Canvas UI] URL view:', viewName, 'Current:', currentViewId);
      
      if (viewName && config) {
        // Try matching by ID first
        let view = config.views.find(v => v.id === viewName);
        
        // If no ID match, try by name (case-insensitive, normalize dashes/spaces/parentheses)
        if (!view) {
          const normalizedName = viewName.toLowerCase()
            .replace(/[-_]/g, ' ')
            .replace(/[()]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          view = config.views.find(v => {
            const normalized = v.name.toLowerCase()
              .replace(/[-_]/g, ' ')
              .replace(/[()]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            return normalized === normalizedName;
          });
        }
        
        if (view && view.id !== currentViewId) {
          if (import.meta.env.DEV) console.log('[Canvas UI] Switching to view:', view.name, view.id);
          setCurrentView(view.id);
        } else if (!view) {
          console.warn('[Canvas UI] View not found:', viewName, 'Available:', config.views.map(v => `${v.name} (${v.id})`));
        }
      }
    };
    
    // Sync on mount and hash changes
    syncViewFromURL();
    window.addEventListener('hashchange', syncViewFromURL);
    return () => window.removeEventListener('hashchange', syncViewFromURL);
  }, [config, currentViewId, setCurrentView]);

  // Set default view if none selected and no URL view
  useEffect(() => {
    const urlView = getViewFromURL();
    if (config && !currentViewId && !urlView && config.views.length > 0) {
      setCurrentView(config.views[0].id);
    }
  }, [config, currentViewId, setCurrentView]);

  // Get current view
  const currentView = config?.views.find(v => v.id === currentViewId);

  // Helper to save to HA file (async, non-blocking)
  const saveToHA = () => {
    const latestConfig = useConfigStore.getState().config;
    if (hass && latestConfig) {
      setSaving(true);
      
      // Keep saving indicator visible for minimum 1000ms
      const startTime = Date.now();
      saveConfig(hass, latestConfig)
        .catch(err => console.error('[Canvas UI] Save failed:', err))
        .finally(() => {
          const elapsed = Date.now() - startTime;
          const delay = Math.max(0, 1000 - elapsed);
          setTimeout(() => setSaving(false), delay);
        });
    }
  };

  const handleSave = async () => {
    if (hass && config) {
      setSaving(true);
      const startTime = Date.now();
      await saveConfig(hass, config);
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 1000 - elapsed);
      setTimeout(() => setSaving(false), delay);
    }
  };

  const handleWidgetUpdate = (widgetId: string, updates: Partial<WidgetConfig>) => {
    if (!currentViewId || !config) return;

    // Validate widget name if it's being updated
    if ('name' in updates) {
      // Get all widgets from all views for uniqueness check
      const allWidgets = config.views.flatMap(v => v.widgets);
      const error = validateWidgetName(updates.name || '', widgetId, allWidgets);
      
      if (error) {
        console.warn('[Canvas UI] Widget name validation failed:', error);
        // TODO: Show error toast/snackbar to user
        alert(`Invalid widget name: ${error}`);
        return; // Don't apply update
      }
    }

    updateWidget(currentViewId, widgetId, updates);
    setSelectedWidgets([widgetId]);
    
    // Skip expensive HA file save during drag - only save once at drag end
    if (!isDraggingRef.current) {
      saveToHA();
    }
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    
    // Save to HA file now that drag is complete
    saveToHA();
    
    // Snapshot to history after drag/resize completes
    // Get the LATEST config from store (not stale component state)
    const latestConfig = useConfigStore.getState().config;
    if (latestConfig && currentViewId) {
      (useConfigStore.getState() as any)._addToHistory(latestConfig);
      saveToHA();
    }
  };

  const handleWidgetSelect = (widgetId: string, ctrlKey: boolean, shiftKey: boolean) => {
    // Empty widgetId means deselect all (canvas background click)
    if (!widgetId) {
      setSelectedWidgets([]);
      return;
    }

    if (ctrlKey) {
      // Ctrl: Toggle selection
      setSelectedWidgets(prev => 
        prev.includes(widgetId) 
          ? prev.filter(id => id !== widgetId)
          : [...prev, widgetId]
      );
    } else if (shiftKey) {
      // Shift: Add to selection
      setSelectedWidgets(prev => 
        prev.includes(widgetId) ? prev : [...prev, widgetId]
      );
    } else {
      // Normal: Replace selection
      setSelectedWidgets([widgetId]);
    }
  };

  // Handle box selection (drag to select multiple widgets)
  const handleBoxSelect = (widgetIds: string[]) => {
    console.log('[Editor] handleBoxSelect called with:', widgetIds);
    setSelectedWidgets(widgetIds);
    console.log('[Editor] selectedWidgets state updated to:', widgetIds);
  };

  const addWidget = (type: string) => {
    if (!currentViewId || !currentView) return;

    // Validate view has dimensions set (except for resolution widget)
    if (type !== 'resolution' && (!currentView.sizex || !currentView.sizey)) {
      alert(
        'Please set view dimensions first!\n\n' +
        'Use the Resolution widget to detect your screen size and apply dimensions to this view.\n\n' +
        'This ensures widgets display correctly in kiosk mode.'
      );
      return;
    }

    // Show dialog to get widget name
    setPendingWidgetType(type);
    setWidgetNameDialogOpen(true);
  };

  const createWidgetWithName = (name: string) => {
    if (!currentViewId || !currentView || !pendingWidgetType) return;

    // Get metadata for default size
    const metadata = WIDGET_REGISTRY[pendingWidgetType];
    const defaultSize = metadata?.defaultSize || { w: 150, h: 50 };

    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: pendingWidgetType,
      name: name, // Add the widget name
      position: { 
        x: 100, 
        y: 100, 
        width: defaultSize.w, 
        height: defaultSize.h 
      },
      config: {
        style: {}, // Initialize empty style object for universal styles
      },
    };

    const updatedWidgets = [...currentView.widgets, newWidget];
    useConfigStore.getState().updateView(currentViewId, { widgets: updatedWidgets });
    setSelectedWidgets([newWidget.id]);
    saveToHA();
  };

  const deleteWidget = () => {
    if (selectedWidgets.length === 0 || !currentViewId || !currentView) return;

    // Confirmation dialog
    const widgetCount = selectedWidgets.length;
    const confirmMessage = widgetCount === 1 
      ? 'Delete this widget?' 
      : `Delete ${widgetCount} widgets?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const updatedWidgets = currentView.widgets.filter(w => !selectedWidgets.includes(w.id));
    useConfigStore.getState().updateView(currentViewId, { widgets: updatedWidgets });
    setSelectedWidgets([]);
    saveToHA();
  };

  const deleteAllWidgets = () => {
    if (!currentViewId || !currentView || currentView.widgets.length === 0) return;

    // Confirmation dialog
    const widgetCount = currentView.widgets.length;
    const confirmMessage = `Delete all ${widgetCount} widget${widgetCount === 1 ? '' : 's'} from this view? This cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    useConfigStore.getState().updateView(currentViewId, { widgets: [] });
    setSelectedWidgets([]);
    saveToHA();
  };

  // Alignment functions
  const alignLeft = () => {
    if (selectedWidgets.length < 2 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
    const minX = Math.min(...widgets.map(w => w.position.x));
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, x: minX } });
    });
    saveToHA();
  };

  const alignRight = () => {
    if (selectedWidgets.length < 2 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
    const maxRight = Math.max(...widgets.map(w => w.position.x + w.position.width));
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, x: maxRight - widget.position.width } });
    });
    saveToHA();
  };

  const alignTop = () => {
    if (selectedWidgets.length < 2 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
    const minY = Math.min(...widgets.map(w => w.position.y));
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, y: minY } });
    });
    saveToHA();
  };

  const alignBottom = () => {
    if (selectedWidgets.length < 2 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
    const maxBottom = Math.max(...widgets.map(w => w.position.y + w.position.height));
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, y: maxBottom - widget.position.height } });
    });
    saveToHA();
  };

  const alignCenterHorizontal = () => {
    if (selectedWidgets.length < 2 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
    const avgCenterX = widgets.reduce((sum, w) => sum + (w.position.x + w.position.width / 2), 0) / widgets.length;
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, x: avgCenterX - widget.position.width / 2 } });
    });
    saveToHA();
  };

  const alignCenterVertical = () => {
    if (selectedWidgets.length < 2 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
    const avgCenterY = widgets.reduce((sum, w) => sum + (w.position.y + w.position.height / 2), 0) / widgets.length;
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, y: avgCenterY - widget.position.height / 2 } });
    });
    saveToHA();
  };

  // Align to view center functions
  const alignToViewCenterH = () => {
    if (selectedWidgets.length !== 1 || !currentView || !currentViewId) return;
    const widget = currentView.widgets.find(w => w.id === selectedWidgets[0]);
    if (!widget) return;
    const viewCenterX = (currentView.sizex || 0) / 2;
    const newX = viewCenterX - widget.position.width / 2;
    updateWidget(currentViewId, widget.id, { position: { ...widget.position, x: newX } });
    saveToHA();
  };

  const alignToViewCenterV = () => {
    if (selectedWidgets.length !== 1 || !currentView || !currentViewId) return;
    const widget = currentView.widgets.find(w => w.id === selectedWidgets[0]);
    if (!widget) return;
    const viewCenterY = (currentView.sizey || 0) / 2;
    const newY = viewCenterY - widget.position.height / 2;
    updateWidget(currentViewId, widget.id, { position: { ...widget.position, y: newY } });
    saveToHA();
  };

  // Distribution functions
  const distributeHorizontal = () => {
    if (selectedWidgets.length < 3 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id)).sort((a, b) => a.position.x - b.position.x);
    const leftmost = widgets[0].position.x;
    const rightmost = widgets[widgets.length - 1].position.x + widgets[widgets.length - 1].position.width;
    const totalGap = rightmost - leftmost - widgets.reduce((sum, w) => sum + w.position.width, 0);
    const gap = totalGap / (widgets.length - 1);
    
    let currentX = leftmost;
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, x: currentX } });
      currentX += widget.position.width + gap;
    });
    saveToHA();
  };

  const distributeVertical = () => {
    if (selectedWidgets.length < 3 || !currentView || !currentViewId) return;
    const widgets = currentView.widgets.filter(w => selectedWidgets.includes(w.id)).sort((a, b) => a.position.y - b.position.y);
    const topmost = widgets[0].position.y;
    const bottommost = widgets[widgets.length - 1].position.y + widgets[widgets.length - 1].position.height;
    const totalGap = bottommost - topmost - widgets.reduce((sum, w) => sum + w.position.height, 0);
    const gap = totalGap / (widgets.length - 1);
    
    let currentY = topmost;
    widgets.forEach(widget => {
      updateWidget(currentViewId, widget.id, { position: { ...widget.position, y: currentY } });
      currentY += widget.position.height + gap;
    });
    saveToHA();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentView || !currentViewId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Delete key
      if (e.key === 'Delete' && selectedWidgets.length > 0) {
        e.preventDefault();
        deleteWidget();
        return;
      }

      // Escape key - deselect all
      if (e.key === 'Escape' && selectedWidgets.length > 0) {
        e.preventDefault();
        setSelectedWidgets([]);
        return;
      }

      // Ctrl+A - select all widgets
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const allWidgetIds = currentView.widgets.map(w => w.id);
        setSelectedWidgets(allWidgetIds);
        return;
      }

      // Ctrl+Z - undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        saveToHA();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y - redo
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        redo();
        saveToHA();
        return;
      }

      // Ctrl+C - copy selected widgets
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedWidgets.length > 0) {
        e.preventDefault();
        const widgetsToCopy = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
        setCopiedWidgets(widgetsToCopy);
        return;
      }

      // Ctrl+V - paste copied widgets
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && copiedWidgets.length > 0) {
        e.preventDefault();
        
        // Get all existing widgets to check for name conflicts
        const allWidgets = config?.views.flatMap(view => view.widgets) || [];
        const existingNames = new Set(allWidgets.map(w => w.name).filter(Boolean));
        
        const newWidgets = copiedWidgets.map(widget => {
          // Generate unique name for pasted widget
          let baseName = widget.name || widget.type;
          let counter = 1;
          let uniqueName = `${baseName}_copy`;
          
          // Ensure uniqueness
          while (existingNames.has(uniqueName)) {
            counter++;
            uniqueName = `${baseName}_copy${counter}`;
          }
          existingNames.add(uniqueName); // Reserve this name
          
          return {
            ...widget,
            id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: uniqueName,
            position: {
              ...widget.position,
              x: widget.position.x + 20, // Offset pasted widgets
              y: widget.position.y + 20,
            },
          };
        });
        
        const updatedWidgets = [...currentView.widgets, ...newWidgets];
        useConfigStore.getState().updateView(currentViewId, { widgets: updatedWidgets });
        
        // Select the newly pasted widgets
        setSelectedWidgets(newWidgets.map(w => w.id));
        saveToHA();
        return;
      }

      // Ctrl+X - cut selected widgets
      if (e.key === 'x' && (e.ctrlKey || e.metaKey) && selectedWidgets.length > 0) {
        e.preventDefault();
        const widgetsToCopy = currentView.widgets.filter(w => selectedWidgets.includes(w.id));
        setCopiedWidgets(widgetsToCopy);
        deleteWidget();
        return;
      }

      // Arrow keys - move or resize
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedWidgets.length === 0) return;
        e.preventDefault();

        const step = e.shiftKey ? 10 : 1;

        selectedWidgets.forEach(widgetId => {
          const widget = currentView.widgets.find(w => w.id === widgetId);
          if (!widget) return;

          let updates: Partial<WidgetConfig> = {};

          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Arrow: Resize
            updates = { position: { ...widget.position } };
            switch (e.key) {
              case 'ArrowRight':
                updates.position!.width = Math.max(50, widget.position.width + step);
                break;
              case 'ArrowLeft':
                updates.position!.width = Math.max(50, widget.position.width - step);
                break;
              case 'ArrowDown':
                updates.position!.height = Math.max(30, widget.position.height + step);
                break;
              case 'ArrowUp':
                updates.position!.height = Math.max(30, widget.position.height - step);
                break;
            }
          } else {
            // Arrow: Move
            updates = { position: { ...widget.position } };
            switch (e.key) {
              case 'ArrowRight':
                updates.position!.x = widget.position.x + step;
                break;
              case 'ArrowLeft':
                updates.position!.x = widget.position.x - step;
                break;
              case 'ArrowDown':
                updates.position!.y = widget.position.y + step;
                break;
              case 'ArrowUp':
                updates.position!.y = widget.position.y - step;
                break;
            }
          }

          updateWidget(currentViewId, widgetId, updates);
        });
        saveToHA();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgets, copiedWidgets, currentView, currentViewId, updateWidget]);

  if (loading) {
    return (
      <Box sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}>
        <Typography>
          Loading Canvas UI Editor...
          {!connected && ' Connecting...'}
          {connected && !authenticated && ' Authenticating...'}
        </Typography>
      </Box>
    );
  }

  if (!config || !currentViewId) {
    return (
      <Box sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}>
        <Typography>No view configured</Typography>
      </Box>
    );
  }

  const selectedWidgetConfig = selectedWidgets.length === 1 
    ? currentView?.widgets.find(w => w.id === selectedWidgets[0])
    : undefined;
  const selectedWidgetMetadata = selectedWidgetConfig ? WIDGET_REGISTRY[selectedWidgetConfig.type] : null;

  if (!currentView) {
    return (
      <Box sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}>
        <Typography>View not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Canvas Toolbar - Hidden in kiosk mode */}
      {mode !== 'kiosk' && (
        <CanvasToolbar
          currentViewName={currentView.name}
          onViewsClick={() => setViewManagerOpen(true)}
          onCloneView={() => setCloneViewDialogOpen(true)}
          onDeleteView={() => setDeleteViewDialogOpen(true)}
          onExportView={() => {
            if (currentViewId) {
              exportView(currentViewId);
            }
          }}
          onImportView={async (file: File) => {
            try {
              await importView(file);
              // Save after import
              saveToHA();
            } catch (error) {
              console.error('Import failed:', error);
              alert(`Failed to import view: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }}
          onFileManagerClick={() => setFileManagerOpen(true)}
          onVariablesClick={() => setVariablesManagerOpen(true)} // Phase 2
          onFlowsClick={() => setFlowBuilderOpen(true)} // Phase 3
          onPromptTemplatesClick={() => setAISettingsOpen(true)} // AI Settings
          onAddWidget={() => setWidgetLibraryOpen(true)}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={() => {
            undo();
            saveToHA();
          }}
          onRedo={() => {
            redo();
            saveToHA();
          }}
          selectedCount={selectedWidgets.length}
          onDelete={deleteWidget}
          onDeleteAllWidgets={deleteAllWidgets}
          widgetCount={currentView.widgets.length}
          isSaving={saving}
          onSave={handleSave}
          gridSnap={gridSnap}
          showGrid={showGrid}
          gridSize={gridSize}
          gridColor={gridColor}
          gridLineWidth={gridLineWidth}
          gridBrightness={gridBrightness}
          zoom={zoom}
          onToggleGridSnap={() => setGridSnap(!gridSnap)}
          onToggleShowGrid={() => setShowGrid(!showGrid)}
          onGridSizeChange={setGridSize}
          onGridColorChange={setGridColor}
          onGridLineWidthChange={setGridLineWidth}
          onGridBrightnessChange={setGridBrightness}
          onZoomIn={() => setZoom(Math.min(200, zoom + 10))}
          onZoomOut={() => setZoom(Math.max(50, zoom - 10))}
          onZoomReset={() => setZoom(100)}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          onAlignLeft={alignLeft}
          onAlignRight={alignRight}
          onAlignTop={alignTop}
          onAlignBottom={alignBottom}
          onAlignCenterH={alignCenterHorizontal}
          onAlignCenterV={alignCenterVertical}
          onAlignToViewCenterH={alignToViewCenterH}
          onAlignToViewCenterV={alignToViewCenterV}
          onDistributeH={distributeHorizontal}
          onDistributeV={distributeVertical}
          mode={mode}
          onModeChange={setMode}
        />
      )}

      {/* Main Canvas Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: mode === 'kiosk' ? '100vh' : 'calc(100vh - 90px)', // Full viewport in kiosk
          mt: mode === 'kiosk' ? 0 : '90px', // No margin in kiosk
          overflow: 'auto', // Allow scrolling if canvas exceeds container
        }}
      >
        {currentView ? (
          <Canvas
            view={currentView}
            isEditMode={mode === 'edit'}
            selectedWidgetIds={mode === 'edit' ? selectedWidgets : []}
            onWidgetUpdate={handleWidgetUpdate}
            onWidgetSelect={handleWidgetSelect}
            onBoxSelect={handleBoxSelect}
            onDragStart={() => isDraggingRef.current = true}
            onDragEnd={handleDragEnd}
            gridSnap={gridSnap}
            gridSize={gridSize}
            showGrid={showGrid}
            gridColor={gridColor}
            gridLineWidth={gridLineWidth}
            gridBrightness={gridBrightness}
            zoom={zoom}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              No view selected
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right Inspector Drawer - Only in edit mode */}
      {mode === 'edit' && (
        <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: '90px', // Match toolbar height
            height: 'calc(100vh - 90px)', // Full viewport minus toolbar
            overflow: 'hidden', // Let Inspector manage its own scroll
            transition: 'transform 0.2s ease',
            transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          },
        }}
      >
        <Inspector
          widget={selectedWidgetConfig || null}
          metadata={selectedWidgetMetadata || null}
          onUpdate={(updates) => {
            if (selectedWidgets.length === 1 && currentViewId) {
              updateWidget(currentViewId, selectedWidgets[0], updates);
              saveToHA();
            }
          }}
          currentView={currentView}
          allViews={config.views}
          allWidgets={currentView.widgets}
          onViewSwitch={(viewId) => setCurrentView(viewId)}
          onWidgetSelect={(widgetId) => setSelectedWidgets([widgetId])}
          onUpdateView={(viewId, updates) => {
            updateView(viewId, updates);
            saveToHA();
          }}
          onToggleWidgetHidden={(widgetId) => {
            if (currentViewId) {
              const widget = currentView.widgets.find(w => w.id === widgetId);
              if (widget) {
                updateWidget(currentViewId, widgetId, {
                  hiddenInEdit: !widget.hiddenInEdit
                });
                saveToHA();
              }
            }
          }}
          onClearSelection={() => setSelectedWidgets([])}
          selectedWidgetIds={selectedWidgets}
          selectedCount={selectedWidgets.length}
          onUpdateStyle={(styleUpdates) => {
            if (currentViewId) {
              selectedWidgets.forEach(widgetId => {
                const w = currentView.widgets.find(w => w.id === widgetId);
                if (w) {
                  updateWidget(currentViewId, widgetId, {
                    config: { ...w.config, style: { ...w.config.style, ...styleUpdates } }
                  });
                }
              });
              saveToHA();
            }
          }}
        />
      </Drawer>
      )}

      {/* Widget Library - Only in edit mode */}
      {mode === 'edit' && (
        <WidgetLibrary
          open={widgetLibraryOpen}
          onClose={() => setWidgetLibraryOpen(false)}
          onAddWidget={addWidget}
        />
      )}

      {/* View Manager - Only in edit mode */}
      {mode === 'edit' && (
        <ViewManager
        open={viewManagerOpen}
        onClose={() => setViewManagerOpen(false)}
        views={config.views}
        currentViewId={currentViewId}
        onViewSwitch={setCurrentView}
        onAddView={(view) => {
          addView(view);
          saveToHA();
        }}
        onDeleteView={(viewId) => {
          deleteView(viewId);
          saveToHA();
        }}
        onDuplicateView={(viewId) => {
          duplicateView(viewId);
          saveToHA();
        }}
        onUpdateView={(viewId, updates) => {
          updateView(viewId, updates);
          saveToHA();
        }}
      />
      )}

      {/* File Manager */}
      {mode === 'edit' && (
        <FileManager
          open={fileManagerOpen}
          onClose={() => setFileManagerOpen(false)}
        />
      )}

      {/* Variables Manager (Phase 2) */}
      {mode === 'edit' && (
        <VariablesManager
          open={variablesManagerOpen}
          onClose={() => setVariablesManagerOpen(false)}
        />
      )}

      {/* Flow Builder (Phase 3) */}
      {mode === 'edit' && (
        <FlowBuilder
          open={flowBuilderOpen}
          onClose={() => setFlowBuilderOpen(false)}
          onSave={saveToHA}
          onVariablesClick={() => setVariablesManagerOpen(true)}
        />
      )}

      {/* AI Settings Dialog - Provider and Prompts */}
      {mode === 'edit' && (
        <AISettingsDialog
          open={aiSettingsOpen}
          onClose={() => setAISettingsOpen(false)}
          provider={aiProvider}
          apiKey={aiApiKey}
          githubToken={aiGitHubToken}
          groqApiKey={aiGroqApiKey}
          openWebUIUrl={aiOpenWebUIUrl}
          openWebUIApiKey={aiOpenWebUIApiKey}
          copilotProxyToken={aiCopilotProxyToken}
          copilotProxyUrl={aiCopilotProxyUrl}
          onProviderChange={(provider) => {
            setAIProvider(provider);
            localStorage.setItem('canvasui_ai_provider', provider);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onApiKeyChange={(apiKey) => {
            setAIApiKey(apiKey);
            localStorage.setItem('canvasui_openai_apikey', apiKey);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onGitHubTokenChange={(token) => {
            setAIGitHubToken(token);
            localStorage.setItem('canvasui_github_token', token);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onGroqApiKeyChange={(key) => {
            setAIGroqApiKey(key);
            localStorage.setItem('canvasui_groq_apikey', key);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onOpenWebUIUrlChange={(url) => {
            setAIOpenWebUIUrl(url);
            localStorage.setItem('canvasui_openwebui_url', url);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onOpenWebUIApiKeyChange={(key) => {
            setAIOpenWebUIApiKey(key);
            localStorage.setItem('canvasui_openwebui_apikey', key);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onCopilotProxyTokenChange={(token) => {
            setAICopilotProxyToken(token);
            localStorage.setItem('canvasui_copilotproxy_token', token);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
          onCopilotProxyUrlChange={(url) => {
            setAICopilotProxyUrl(url);
            localStorage.setItem('canvasui_copilotproxy_url', url);
            // Trigger event for AITabPanel to reload
            window.dispatchEvent(new CustomEvent('ai-settings-changed'));
          }}
        />
      )}

      {/* Clone View Dialog */}
      {mode === 'edit' && currentView && (
        <CloneViewDialog
          open={cloneViewDialogOpen}
          currentViewName={currentView.name}
          onClose={() => setCloneViewDialogOpen(false)}
          onClone={(newName: string) => {
            if (currentViewId) {
              cloneView(currentViewId, newName);
              saveToHA();
            }
          }}
        />
      )}

      {/* Delete View Dialog */}
      {mode === 'edit' && currentView && config && (
        <DeleteViewDialog
          open={deleteViewDialogOpen}
          viewName={currentView.name}
          viewCount={config.views.length}
          onClose={() => setDeleteViewDialogOpen(false)}
          onDelete={() => {
            if (currentViewId) {
              deleteView(currentViewId);
              saveToHA();
              setDeleteViewDialogOpen(false);
            }
          }}
        />
      )}

      {/* Widget Name Dialog */}
      {mode === 'edit' && pendingWidgetType && config && (
        <WidgetNameDialog
          open={widgetNameDialogOpen}
          widgetType={pendingWidgetType}
          onClose={() => {
            setWidgetNameDialogOpen(false);
            setPendingWidgetType(null);
          }}
          onConfirm={(name) => {
            createWidgetWithName(name);
            setPendingWidgetType(null);
          }}
          validateName={(name) => {
            // Get all widgets from all views
            const allWidgets = config.views.flatMap(view => view.widgets);
            return validateWidgetName(name, '', allWidgets);
          }}
        />
      )}
    </Box>
  );
};

export default Editor;
