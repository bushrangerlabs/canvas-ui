/**
 * Preview/View Mode Entry Point
 * Runtime view without MUI (~400KB)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import Runtime from './runtime/Runtime';
import { WebSocketProvider } from './shared/providers/WebSocketProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebSocketProvider>
      <Runtime />
    </WebSocketProvider>
  </React.StrictMode>
);
