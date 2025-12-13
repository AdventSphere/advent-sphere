import { defineConfig } from "orval";

export default defineConfig({
  "petstore-file": {
    input: "./generate/openapi.json",
    output: {
      biome: true,
      target: "./generate",
      mode: "tags-split",
    },
  },
});
