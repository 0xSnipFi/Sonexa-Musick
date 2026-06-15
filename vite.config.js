import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Capacitor loads from ./dist via a relative base so assets resolve on-device.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: { outDir: 'dist', target: 'es2020' },
});
