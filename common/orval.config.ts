import { defineConfig } from "orval";

export default defineConfig({
  "advent-sphere-file": {
    input: "./openapi.json",
    output: {
      mode: "tags-split",
      client: "react-query",
      target: "./generate",
      mock: {
        type: "msw",
        indexMockFiles: true,
        useExamples: true,
      },
      biome: true,
      override: {
        mutator: {
          path: "./axios-instance.ts",
          name: "axiosInstance",
        },
      },
    },
  },
});
