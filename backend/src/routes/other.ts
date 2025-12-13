import { GoogleGenAI } from "@google/genai";
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
const createPromptRoute = createRoute({
  method: "post",
  path: "/createPrompt",
  tags: ["Other"],
  summary: "AIを用いて写真プロンプトを生成する",
  description: "AIを用いて写真プロンプトを生成します。",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z
            .object({
              prompt: z.string().openapi({
                example: "クリスマスの夜に輝く街並み",
                description: "写真プロンプトのテーマ",
              }),
              history: z
                .array(
                  z.object({
                    role: z.enum(["user", "assistant"]).openapi({
                      example: "user",
                      description: "発言者の役割",
                    }),
                    content: z.string().openapi({
                      example:
                        "クリスマスのフォトフレームに使う写真のプロンプトを考えてください。",
                      description: "発言内容",
                    }),
                  }),
                )
                .openapi({
                  example: [
                    {
                      role: "user",
                      content:
                        "クリスマスのフォトフレームに使う写真のプロンプトを考えてください。",
                    },
                    {
                      role: "assistant",
                      content:
                        "雪が降り積もる中、クリスマスのイルミネーションが輝く街並み。暖かい光が窓から漏れ、通りには人々が楽しそうに歩いている様子。",
                    },
                  ],
                  description: "これまでの会話履歴",
                }),
            })
            .openapi("CreatePromptRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "写真プロンプトの生成に成功しました",
      content: {
        "application/json": {
          schema: z
            .object({
              prompt: z.string().openapi({
                example:
                  "雪が降り積もる中、クリスマスのイルミネーションが輝く街並み。暖かい光が窓から漏れ、通りには人々が楽しそうに歩いている様子。",
                description: "生成された写真プロンプト",
              }),
            })
            .openapi("CreatePromptResponse"),
        },
      },
    },
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(createPhotoRoute, async (c) => {
  const { prompt } = c.req.valid("json");
  const response = await c.env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
    prompt: prompt,
    seed: Math.floor(Math.random() * 10),
  });
  const dataURI = `data:image/jpeg;charset=utf-8;base64,${response.image}`;

  return c.json({ imageData: dataURI }, 201);
});

app.openapi(createPromptRoute, async (c) => {
  const { prompt, history } = c.req.valid("json");
  const ai = new GoogleGenAI({
    apiKey: c.env.GOOGLE_GEMINI_API_KEY,
  });

  const messages = [
    {
      role: "model",
      parts: [
        {
          text: "You are a prompt generator for image creation. Given a theme from the user, generate a vivid and detailed image generation prompt in English. Output only the prompt text — nothing else. Example: if the user gives 'sunlit cyberpunk street', you might output: 'A sunlit cyberpunk street with glowing neon signs, rainy pavement reflecting light, warm and cool contrasts, ultra-detailed cinematic style.'",
        },
      ],
    },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [
        {
          text: `Theme: ${prompt}`,
        },
      ],
    },
  ];

  const completion = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages,
  });
  const generatedPrompt = completion.text?.trim() || "";

  return c.json({ prompt: generatedPrompt });
});

export default app;
