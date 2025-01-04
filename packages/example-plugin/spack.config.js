/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require("@swc/core/spack");
 
module.exports = config({
  entry: {
    plugin: __dirname + "/src/plugin.ts",
  },
  output: {
    path: __dirname + "/dist",
  },
});