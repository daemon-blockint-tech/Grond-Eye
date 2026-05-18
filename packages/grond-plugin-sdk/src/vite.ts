/**
 * @file vite.ts
 * @description Node-only Vite plugins for Grond plugin packages. Do not import from
 * browser or Next.js client bundles — use `@grond/plugin-sdk/vite` in vite.config only.
 */

export { grondPluginGlobals } from "./viteGlobals";
export { grondStaticCompiler } from "./vite/wwvStaticCompiler";

/** @deprecated Use `grondPluginGlobals` from `@grond/plugin-sdk/vite`. */
export { grondPluginGlobals as wwvPluginGlobals } from "./viteGlobals";

/** @deprecated Use `grondStaticCompiler` from `@grond/plugin-sdk/vite`. */
export { grondStaticCompiler as wwvStaticCompiler } from "./vite/wwvStaticCompiler";
