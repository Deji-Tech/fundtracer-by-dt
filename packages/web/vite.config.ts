import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    define: {
        global: 'globalThis',
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@fundtracer/core': path.resolve(__dirname, '../core/src'),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
