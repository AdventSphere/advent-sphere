import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

const uploadFunction = (
  bucket: R2Bucket,
  object: File,
  path: string,
  fileName: string,
) => {
  const key = `${path}/${fileName}`;
  return bucket.put(key, object);
};

export const ItemSchema = z
  .object({
    id: z
      .string()
      .openapi({ example: "item_12345", description: "アイテムID" }),
    name: z
      .string()
      .openapi({ example: "アイテム名", description: "アイテム名" }),
    createdAt: z.string().openapi({
      example: "2024-06-01T12:00:00Z",
      description: "アイテム作成日時",
    }),
    description: z
      .string()
      .openapi({ example: "アイテムの説明", description: "アイテムの説明" }),
    type: z
      .string()
      .openapi({ example: "photo_frame", description: "アイテムの種類" }),
  })
  .openapi("Item");

export type ItemSchema = z.infer<typeof ItemSchema>;

export const CreateItemSchema = z
  .object({
    name: z
      .string()
      .openapi({ example: "アイテム名", description: "アイテム名" }),
    description: z
      .string()
      .openapi({ example: "アイテムの説明", description: "アイテムの説明" }),
    type: z
      .string()
      .openapi({ example: "photo_frame", description: "アイテムの種類" }),
    objectFile: z.instanceof(File).openapi({
      type: "string",
      format: "binary",
      description: "アイテムの3Dモデルファイル",
      example: "model.glb",
    }),
    objectThumbnail: z.instanceof(File).openapi({
      type: "string",
      format: "binary",
      description: "アイテムのサムネイル画像ファイル",
      example: "thumbnail.png",
    }),
  })
  .openapi("CreateItem");

export type CreateItemSchema = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema =
  CreateItemSchema.partial().openapi("UpdateItem");

const IdParamSchema = z.object({
  id: z.string().openapi({
    param: { name: "id", in: "path" },
    example: "item_12345",
    description: "アイテムID",
  }),
});

const listItemsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Item"],
  summary: "アイテム一覧の取得",
  description: "すべてのアイテムを取得します。",
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: z.array(ItemSchema),
        },
      },
    },
  },
});

const getItemRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Item"],
  summary: "アイテムの取得",
  description: "アイテムIDを指定してアイテムを取得します。",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: ItemSchema,
        },
      },
    },
    404: { description: "アイテムが見つかりません" },
  },
});

const createItemRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Item"],
  summary: "アイテムの作成",
  description: "新しいアイテムを作成します。",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: CreateItemSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "アイテムが正常に作成されました",
      content: {
        "application/json": {
          schema: z
            .object({
              id: z
                .string()
                .openapi({ example: "item_12345", description: "アイテムID" }),
              name: z
                .string()
                .openapi({ example: "アイテム名", description: "アイテム名" }),
            })
            .openapi("CreateItemResponse"),
        },
      },
    },
    500: {
      description: "アイテムの作成またはファイルのアップロードに失敗しました",
      content: {
        "application/json": {
          schema: z
            .object({
              error: z.string(),
            })
            .openapi("CreateItemError"),
        },
      },
    },
  },
});

const deleteItemRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Item"],
  summary: "アイテムの削除",
  description: "アイテムIDを指定してアイテムを削除します。",
  request: { params: IdParamSchema },
  responses: {
    204: { description: "アイテムが正常に削除されました" },
    404: { description: "アイテムが見つかりません" },
  },
});

const patchItemRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Item"],
  summary: "アイテムの更新",
  description: "アイテムIDを指定してアイテム情報を更新します。",
  request: {
    params: IdParamSchema,
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: UpdateItemSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "アイテムが正常に更新されました",
      content: {
        "application/json": {
          schema: ItemSchema,
        },
      },
    },
    404: { description: "アイテムが見つかりません" },
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(listItemsRoute, async (c) => {
  const mockItems: ItemSchema[] = [
    {
      id: "item_1",
      name: "アイテム名1",
      createdAt: new Date().toISOString(),
      description: "アイテムの説明1",
      type: "photo_frame",
    },
    {
      id: "item_2",
      name: "アイテム名2",
      createdAt: new Date().toISOString(),
      description: "アイテムの説明2",
      type: "sticker",
    },
  ];
  return c.json(mockItems);
});

app.openapi(getItemRoute, async (c) => {
  const { id } = c.req.valid("param");
  const mockItem: ItemSchema = {
    id,
    name: `アイテム名${id}`,
    createdAt: new Date().toISOString(),
    description: `アイテムの説明${id}`,
    type: "photo_frame",
  };
  return c.json(mockItem);
});

app.openapi(createItemRoute, async (c) => {
  const { name, description, type, objectFile, objectThumbnail } =
    c.req.valid("form");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .insert(schema.itemTable)
    .values({
      name,
      description,
      type,
    })
    .returning();
  if (result.length === 0) {
    return c.json({ error: "アイテムの作成に失敗しました" }, 500);
  }
  try {
    await Promise.all([
      uploadFunction(
        c.env.BUCKET,
        objectFile,
        `item/object/${type}`,
        `${result[0].id}.${objectFile.name.split(".").pop()}`,
      ),
      uploadFunction(
        c.env.BUCKET,
        objectThumbnail,
        `item/thumbnail/${type}`,
        `${result[0].id}.${objectThumbnail.name.split(".").pop()}`,
      ),
    ]);
  } catch (e) {
    await db
      .delete(schema.itemTable)
      .where(eq(schema.itemTable.id, result[0].id));
    return c.json({ error: `ファイルのアップロードに失敗しました．${e}` }, 500);
  }

  const newItemResponse = {
    id: result[0].id,
    name: result[0].name,
  };
  return c.json(newItemResponse, 201);
});

app.openapi(deleteItemRoute, async (c) => {
  // const { id } = c.req.valid('param')
  return c.body(null, 204);
});

app.openapi(patchItemRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("form");

  const updatedItem: ItemSchema = {
    id,
    name: body.name ?? `アイテム名${id}`,
    createdAt: new Date().toISOString(),
    description: body.description ?? `アイテムの説明${id}`,
    type: body.type ?? "photo_frame",
  };
  return c.json(updatedItem);
});

export default app;
