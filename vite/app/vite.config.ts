import { defineConfig } from 'vite';
export default defineConfig({
  base: '/client_side_xgboost/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
