/**
 * Vite build config for HACS distribution.
 *
 * Differences from the default vite.config.ts:
 *  - base: '/canvas-ui-static/'  → served via hass.http.register_static_path()
 *  - publicDir: 'public-hacs'  → panel JS files that fetch /canvas-ui-static/ paths
 *  - outDir: 'dist-hacs'  → separate output so personal-HA build stays in dist/
 *
 * Usage:
 *   npm run build:hacs
 */
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/canvas-ui-static/',
  publicDir: 'public-hacs',

  build: {
    outDir: 'dist-hacs',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        index: resolve(__dirname, 'index.html'),
        edit: resolve(__dirname, 'edit.html'),
        view: resolve(__dirname, 'view.html'),
        kiosk: resolve(__dirname, 'kiosk.html'),
      },

      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@mdi/js')) return 'icons-mdi';
            if (id.includes('@mdi/react')) return 'icons-mdi-react';
            if (id.includes('react-icons/fa')) return 'icons-fa';
            if (id.includes('react-icons/md')) return 'icons-md';
            if (id.includes('react-icons/io5')) return 'icons-io';
            if (id.includes('react-icons/bi')) return 'icons-bi';
            if (id.includes('@mui/icons-material')) return 'vendor-mui-icons';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
            if (id.includes('react-gauge-component')) return 'vendor-gauge';
            if (id.includes('zustand')) return 'vendor-zustand';
            return 'vendor';
          }
          if (id.includes('/widgets/')) {
            const widgetMatch = id.match(/\/widgets\/(\w+)Widget/);
            if (widgetMatch) return `widget-${widgetMatch[1].toLowerCase()}`;
          }
        },

        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    chunkSizeWarningLimit: 5000,
    minify: 'terser',
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
