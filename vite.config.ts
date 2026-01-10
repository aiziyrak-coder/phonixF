import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
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
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
      }
    };
});
