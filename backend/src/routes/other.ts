import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const createPhotoRoute = createRoute({
  method: "post",
  path: "/createPhoto",
  tags: ["Other"],
  summary: "写真の作成",
  description: "新しい写真を作成します。",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z
            .object({
              prompt: z.string().openapi({
                example: "大きな山と湖の風景",
                description: "画像生成のためのプロンプト",
              }),
            })
            .openapi("CreatePhotoRequest"),
        },
      },
    },
  },
  responses: {
    201: {
      description: "写真が正常に作成されました",
      content: {
        "application/json": {
          schema: z
            .object({
              imageData: z.string().openapi({
                example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                description: "base64エンコードされた画像データ",
              }),
            })
            .openapi("CreatePhotoResponse"),
        },
      },
    },
  },
});

const app = new OpenAPIHono<{
  Bindings: { DB: D1Database };
}>();

app.openapi(createPhotoRoute, async (c) => {
  const { prompt } = c.req.valid("json");

  const mockResponse = {
    imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  };
  return c.json(mockResponse, 201);
});

export default app;
