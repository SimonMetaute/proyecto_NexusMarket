import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const sharedSrc = fileURLToPath(new URL('../../shared/src', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@nexus\/shared\/(.+)$/, replacement: `${sharedSrc}/$1` },
      { find: '@nexus/shared', replacement: `${sharedSrc}/index.ts` },
    ],
  },
  server: { port: 5176, strictPort: true },
  preview: { port: 5176, strictPort: true },
  envDir: '../../',
});
