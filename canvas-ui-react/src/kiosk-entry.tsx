/**
 * Kiosk Mode Entry Point
 * Minimal bundle for tablets (~200KB)
 * Only loads widgets actually used in the view
 */

import ReactDOM from 'react-dom/client';
import Runtime from './runtime/Runtime';
import { WebSocketProvider } from './shared/providers/WebSocketProvider';

// Production optimization: disable React DevTools
if (typeof window !== 'undefined') {
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
  };
}

// Wrapper component to expose hass to window for Lovelace cards
const KioskApp = () => {
  return (
    <WebSocketProvider>
      <Runtime />
    </WebSocketProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<KioskApp />);
