// vitest.config.js
import { babel } from "file:///home/bterlson/projects/tsp-mcp/node_modules/.pnpm/@rollup+plugin-babel@6.0.4_@babel+core@7.26.9_rollup@4.34.9/node_modules/@rollup/plugin-babel/dist/es/index.js";
import { defineConfig } from "file:///home/bterlson/projects/tsp-mcp/node_modules/.pnpm/vitest@2.1.9_@types+node@22.13.9/node_modules/vitest/dist/config.js";
var vitest_config_default = defineConfig({
  test: {
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    exclude: ["test/**/*.d.ts"]
  },
  esbuild: {
    jsx: "preserve",
    sourcemap: "both"
  },
  plugins: [
    babel({
      inputSourceMap: true,
      sourceMaps: "both",
      babelHelpers: "bundled",
      extensions: [".ts", ".tsx"],
      presets: ["@babel/preset-typescript", "@alloy-js/babel-preset"]
    })
  ]
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL2J0ZXJsc29uL3Byb2plY3RzL3RzcC1tY3AvcGFja2FnZXMvdHlwZXNwZWMtem9kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9idGVybHNvbi9wcm9qZWN0cy90c3AtbWNwL3BhY2thZ2VzL3R5cGVzcGVjLXpvZC92aXRlc3QuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL2J0ZXJsc29uL3Byb2plY3RzL3RzcC1tY3AvcGFja2FnZXMvdHlwZXNwZWMtem9kL3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBiYWJlbCB9IGZyb20gXCJAcm9sbHVwL3BsdWdpbi1iYWJlbFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGluY2x1ZGU6IFtcInRlc3QvKiovKi50ZXN0LnRzXCIsIFwidGVzdC8qKi8qLnRlc3QudHN4XCJdLFxuICAgIGV4Y2x1ZGU6IFtcInRlc3QvKiovKi5kLnRzXCJdLFxuICB9LFxuICBlc2J1aWxkOiB7XG4gICAganN4OiBcInByZXNlcnZlXCIsXG4gICAgc291cmNlbWFwOiBcImJvdGhcIixcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIGJhYmVsKHtcbiAgICAgIGlucHV0U291cmNlTWFwOiB0cnVlLFxuICAgICAgc291cmNlTWFwczogXCJib3RoXCIsXG4gICAgICBiYWJlbEhlbHBlcnM6IFwiYnVuZGxlZFwiLFxuICAgICAgZXh0ZW5zaW9uczogW1wiLnRzXCIsIFwiLnRzeFwiXSxcbiAgICAgIHByZXNldHM6IFtcIkBiYWJlbC9wcmVzZXQtdHlwZXNjcmlwdFwiLCBcIkBhbGxveS1qcy9iYWJlbC1wcmVzZXRcIl0sXG4gICAgfSksXG4gIF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVYsU0FBUyxhQUFhO0FBQzNXLFNBQVMsb0JBQW9CO0FBRTdCLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxJQUNKLFNBQVMsQ0FBQyxxQkFBcUIsb0JBQW9CO0FBQUEsSUFDbkQsU0FBUyxDQUFDLGdCQUFnQjtBQUFBLEVBQzVCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxLQUFLO0FBQUEsSUFDTCxXQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osZ0JBQWdCO0FBQUEsTUFDaEIsWUFBWTtBQUFBLE1BQ1osY0FBYztBQUFBLE1BQ2QsWUFBWSxDQUFDLE9BQU8sTUFBTTtBQUFBLE1BQzFCLFNBQVMsQ0FBQyw0QkFBNEIsd0JBQXdCO0FBQUEsSUFDaEUsQ0FBQztBQUFBLEVBQ0g7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
