import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        fs: {
          // Allow serving files from one level up to the project root
          allow: ['..']
        },
        watch: {
          // Reduce file watching overhead
          usePolling: false,
          interval: 100
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'components': path.resolve(__dirname, './components'),
        },
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
      },
      build: {
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: isProduction, // Remove console.log in production
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : []
          }
        },
        sourcemap: !isProduction, // Only generate sourcemaps in development
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Split node_modules into separate chunks
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('react-router')) {
                  return 'router-vendor';
                }
                if (id.includes('lucide-react')) {
                  return 'ui-vendor';
                }
                if (id.includes('@google/genai')) {
                  return 'ai-vendor';
                }
                // Other node_modules
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
