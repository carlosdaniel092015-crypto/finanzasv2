import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'build',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'chart-vendor': ['chart.js', 'react-chartjs-2'],
                    'pdf-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas'],
                    'supabase-vendor': ['@supabase/supabase-js']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    },
});
