import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";

export default defineConfig({
  input: {
    path: "../openapi/openapi.json",
  },
  output: {
    path: "./src/api/gen",
    clean: true,
    format: true,
    lint: false,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: "models",
      },
    }),
    pluginClient({
      client: "fetch",
      output: {
        path: "client",
      },
      dataReturnType: "data",
    }),
    pluginReactQuery({
      output: {
        path: "hooks",
      },
      client: {
        client: "fetch",
      },
    }),
  ],
});
