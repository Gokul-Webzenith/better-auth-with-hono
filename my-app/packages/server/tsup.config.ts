import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  bundle: true,          // 🔥 MUST BE TRUE
  splitting: false,
  sourcemap: false,
  clean: true,
  platform: "node",
  target: "es2022",
  external: [],          // 🔥 VERY IMPORTANT (DO NOT exclude db)
});
