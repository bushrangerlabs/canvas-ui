/**
 * Edit Mode Entry Point
 * Loads Editor with full MUI framework (~1.2MB)
 */

import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Editor from './edit/components/Editor';
import { WebSocketProvider } from './shared/providers/WebSocketProvider';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Wait for root element (created by panel in document.body)
const waitForRoot = () => {
  return new Promise<HTMLElement>((resolve) => {
    const checkRoot = () => {
      const root = document.getElementById('root');
      if (root) {
        resolve(root);
      } else {
        setTimeout(checkRoot, 50);
      }
    };
    checkRoot();
  });
};

waitForRoot().then((root) => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemeProvider theme={darkTheme}>
        <WebSocketProvider>
          <Editor />
        </WebSocketProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
});
