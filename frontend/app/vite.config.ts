import { defineConfig } from "vite";

export default defineConfig({
  base: "/client_side_xgboost/",
  assetsInclude: ["**/*.wasm"], 
  optimizeDeps: {
    include: ["ml-xgboost"], 
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: { transformMixedEsModules: true },
  },
});