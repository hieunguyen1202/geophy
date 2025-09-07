import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    css: {
        postcss: './postcss.config.cjs',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://43.207.90.255:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
