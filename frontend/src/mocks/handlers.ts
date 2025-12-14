import * as mocks from "common/generate/index.msw.ts";
import type { RequestHandler } from "msw";

export const handlers: RequestHandler[] = Object.entries(mocks).flatMap(
  ([, getMock]) => getMock(),
);
