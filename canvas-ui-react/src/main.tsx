/**
 * Main Entry Point - Routes based on URL parameters
 * ?edit=viewname   -> Edit Mode (full editor)
 * ?preview=viewname -> Preview Mode (interactive widgets, no editing)
 * ?kiosk=viewname  -> Kiosk Mode (fullscreen, no chrome)
 */

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Editor from './edit/components/Editor';
import { QueryProvider } from './shared/providers/QueryProvider';
import { WebSocketProvider } from './shared/providers/WebSocketProvider';
import { getModeFromURL } from './shared/stores/useConfigStore';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Get mode from URL on initial load (sets store state)
getModeFromURL();

console.log('[main.tsx] Starting Canvas UI React');
console.log('[main.tsx] Looking for root element...');

// Wait for root element (created by panel in document.body)
const waitForRoot = () => {
  return new Promise<HTMLElement>((resolve) => {
    const checkRoot = () => {
      const root = document.getElementById('root');
      if (root) {
        console.log('[main.tsx] ✅ Found root element');
        resolve(root);
      } else {
        setTimeout(checkRoot, 50);
      }
    };
    checkRoot();
  });
};

// All modes use Editor component - it handles visibility based on mode
waitForRoot().then((root) => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryProvider>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <WebSocketProvider>
            <Editor />
          </WebSocketProvider>
        </ThemeProvider>
      </QueryProvider>
    </React.StrictMode>
  );
});
