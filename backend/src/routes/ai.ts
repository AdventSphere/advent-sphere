import { GoogleGenAI } from "@google/genai";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

const createPhotoRoute = createRoute({
  method: "post",
  path: "/createPhoto",
  tags: ["AI"],
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
              roomId: z.string().openapi({
                example: "room_12345",
                description: "ルームIDで画像生成回数を取得する",
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
    403: {
      description: "画像生成の上限に達しました",
      content: {
        "application/json": {
          schema: z
            .object({
              error: z.string().openapi({
                example: "画像生成の上限に達しました",
                description: "エラーメッセージ",
              }),
            })
            .openapi("CreatePhotoError"),
        },
      },
    },
    404: {
      description: "ルームが見つかりません",
      content: {
        "application/json": {
          schema: z
            .object({
              error: z.string().openapi({
                example: "ルームが見つかりません",
                description: "エラーメッセージ",
              }),
            })
            .openapi("CreatePhotoNotFoundError"),
        },
      },
    },
    500: {
      description: "写真の作成に失敗しました",
      content: {
        "application/json": {
          schema: z
            .object({
              error: z.string().openapi({
                example: "写真の作成に失敗しました",
                description: "エラーメッセージ",
              }),
            })
            .openapi("CreatePhotoInternalError"),
        },
      },
    },
  },
});

const createPromptRoute = createRoute({
  method: "post",
  path: "/createPrompt",
  tags: ["AI"],
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
                    role: z.enum(["user", "model"]).openapi({
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
                      role: "model",
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
              feedback: z.string().openapi({
                example:
                  "写真のプロンプトが具体的で魅力的です。クリスマスの雰囲気がよく伝わります。",
                description:
                  "画像生成の意図を改善するためのフォローアップの質問、提案、または建設的なコメントを含む対話的なAIレスポンス",
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
  const db = drizzle(c.env.DB);

  const room = await db
    .select()
    .from(schema.roomTable)
    .where(eq(schema.roomTable.id, c.req.valid("json").roomId))
    .limit(1);
  if (room.length === 0) {
    return c.json({ error: "ルームが見つかりません" }, 404);
  }
  if (room[0].generateCount >= 5) {
    return c.json({ error: "画像生成の上限に達しました" }, 403);
  }
  try {
    const response = await c.env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      {
        prompt: prompt,
        seed: Math.floor(Math.random() * 10),
      },
    );
    const dataURI = `data:image/jpeg;charset=utf-8;base64,${response.image}`;
    await db
      .update(schema.roomTable)
      .set({ generateCount: room[0].generateCount + 1 })
      .where(eq(schema.roomTable.id, c.req.valid("json").roomId));
    return c.json({ imageData: dataURI }, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "写真の作成に失敗しました" }, 500);
  }
});

app.openapi(createPromptRoute, async (c) => {
  const { prompt, history } = c.req.valid("json");
  const systemPrompt = `
    You are a prompt generator for image creation. Given a theme from the user, output strictly a valid JSON object with two keys: "feedback" and "query".

  - "feedback": A short, concise comment or suggestion in Japanese.
  - "query": A vivid and detailed image generation prompt in English based on the context.

  Do not output any text outside the JSON object.
  `;

  const ai = new GoogleGenAI({
    apiKey: c.env.GOOGLE_GEMINI_API_KEY,
  });

  const messages = [
    {
      role: "user",
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
    ...history.map((msg) => ({
      role: msg.role,
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

  //NOTE: 通常はzodでzodToJsonSchemaを使ってスキーマを生成するが，zod@v3でしか対応していないため，手動でJSONスキーマを記述している
  const completion = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: JSON.parse(`
      {
        "type": "object",
        "properties": {
          "feedback": {
            "type": "string",
            "description": "画像生成の意図を改善するためのフォローアップの質問、提案、または建設的なコメントを含む対話的なAIレスポンス"
          },
          "query": {
            "type": "string",
            "description": "対話的な会話から蓄積されたフィードバックとコンテキストに基づいて作成された、洗練された画像生成プロンプト"
          }
        },
        "required": [
          "feedback",
          "query"
        ],
        "additionalProperties": false,
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
  `),
    },
  });
  const result = JSON.parse(completion.text?.trim() || "{}");
  const generatedPrompt = result.query || "";
  const feedback = result.feedback || "";
  console.log("Generated Prompt:", generatedPrompt);
  console.log("Feedback:", feedback);

  return c.json({ prompt: generatedPrompt, feedback: feedback });
});

export default app;
