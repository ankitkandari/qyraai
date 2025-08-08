import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
    plugins: [react(), cssInjectedByJsPlugin()],
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': {},
        global: 'globalThis',
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'ChatbotWidget',
            fileName: () => 'widget.js',
            formats: ['umd'],
        },
        rollupOptions: {

        },
    },
});