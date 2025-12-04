/**
 * Vite configuration for ClaimLens Go browser extension
 */
import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'background.ts'),
                content: resolve(__dirname, 'content.ts'),
                sidepanel: resolve(__dirname, 'sidepanel.ts'),
                consent: resolve(__dirname, 'consent.ts'),
                settings: resolve(__dirname, 'settings.ts')
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        },
        target: 'esnext',
        minify: 'terser',
        sourcemap: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './')
        }
    }
});
