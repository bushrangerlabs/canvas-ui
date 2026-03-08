import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/local/canvas-ui/',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),    // Main entry (generates app.html for backwards compatibility)
        index: resolve(__dirname, 'index.html'),  // Also generate index.html
        edit: resolve(__dirname, 'edit.html'),
        view: resolve(__dirname, 'view.html'),
        kiosk: resolve(__dirname, 'kiosk.html'),
      },
      
      output: {
        // Code splitting configuration
        manualChunks: (id) => {
          // Keep React libraries together in vendor chunk (prevents loading order issues)
          if (id.includes('node_modules')) {
            // Split icon libraries into separate chunks (lazy loaded)
            if (id.includes('@mdi/js')) {
              return 'icons-mdi';
            }
            if (id.includes('@mdi/react')) {
              return 'icons-mdi-react';
            }
            if (id.includes('react-icons/fa')) {
              return 'icons-fa';
            }
            if (id.includes('react-icons/md')) {
              return 'icons-md';
            }
            if (id.includes('react-icons/io5')) {
              return 'icons-io';
            }
            if (id.includes('react-icons/bi')) {
              return 'icons-bi';
            }
            
            // MUI icons into separate chunk (only loaded in edit mode)
            if (id.includes('@mui/icons-material')) {
              return 'vendor-mui-icons';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            if (id.includes('react-gauge-component')) {
              return 'vendor-gauge';
            }
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }
            // Other node_modules go to vendor
            return 'vendor';
          }
          
          // Individual widgets (lazy loaded)
          if (id.includes('/widgets/')) {
            const widgetMatch = id.match(/\/widgets\/(\w+)Widget/);
            if (widgetMatch) {
              return `widget-${widgetMatch[1].toLowerCase()}`;
            }
          }
        },
        
        // Output file naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    
    // Bundle size warnings
    chunkSizeWarningLimit: 5000, // MUI icons are large but only load in edit mode
    
    // Minification
    minify: 'terser',
  },
  
  // Development server
  server: {
    port: 3000,
    proxy: {
      // Proxy HA API requests during development
      '/api': {
        target: 'http://homeassistant.local:8123',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
