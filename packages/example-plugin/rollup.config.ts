// rollup.config.js
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/plugin.ts",
  output: {
    dir: "dist",
    format: "esm",
  },
  plugins: [typescript()],
};
