// 1. turbo
import fs from "fs";
import path from "path";

const packagesDir = path.resolve(process.cwd(), "packages");
const dirs = fs.readdirSync(packagesDir).filter(d => (d.startsWith("grond-plugin-") || d.startsWith("wwv-plugin-")) && d !== "grond-plugin-sdk" && d !== "wwv-plugin-sdk");

for (const dir of dirs) {
    const pkgPath = path.join(packagesDir, dir, "package.json");
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        
        // Skip backend or utility packages without a plugin UI
        if (!(pkg.grond || pkg.worldwideview)) continue;

        let entryFile = "src/index.ts";
        if (fs.existsSync(path.join(packagesDir, dir, "src/index.tsx"))) {
            entryFile = "src/index.tsx";
        }

        const viteConfigContent = `import { defineConfig } from "vite";
import externalGlobals from "rollup-plugin-external-globals";

export default defineConfig({
  build: {
    lib: {
      entry: "${entryFile}",
      formats: ["es"],
      fileName: () => "frontend.mjs",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@grond/plugin-sdk", "@worldwideview/wwv-plugin-sdk", "cesium", "resium"],
      plugins: [
        externalGlobals({
          "react": "globalThis.__GROND_HOST__.React",
          "react-dom": "globalThis.__GROND_HOST__.ReactDOM",
          "react/jsx-runtime": "globalThis.__GROND_HOST__.jsxRuntime",
          "@grond/plugin-sdk": "globalThis.__GROND_HOST__.GrondPluginSDK",
          "@worldwideview/wwv-plugin-sdk": "globalThis.__GROND_HOST__.GrondPluginSDK",
          "cesium": "globalThis.__GROND_HOST__.Cesium",
          "resium": "globalThis.__GROND_HOST__.Resium",
        }),
      ],
    },
    minify: true,
    sourcemap: false,
  },
});
`;
        
        // Add vite.config.ts
        fs.writeFileSync(path.join(packagesDir, dir, "vite.config.ts"), viteConfigContent);
        console.log(`Added vite.config.ts to ${dir} (entry: ${entryFile})`);
    }
}
