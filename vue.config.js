import { defineConfig } from "@vue/cli-service";

export default defineConfig({
  publicPath: "./",
  transpileDependencies: true,
  configureWebpack: {
    experiments: {
      topLevelAwait: true,
    },
    output: {
      environment: {
        module: true,
      },
    },
  },
});
