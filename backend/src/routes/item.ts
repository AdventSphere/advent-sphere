import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { asc, eq } from "drizzle-orm";
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

const deleteFunction = (bucket: R2Bucket, path: string) => {
  return bucket.delete(path);
};

export const ItemSchema = z
  .object({
    id: z
      .string()
      .openapi({ example: "item_12345", description: "アイテムID" }),
    name: z
      .string()
      .openapi({ example: "アイテム名", description: "アイテム名" }),
    createdAt: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
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
  request: {
    query: z.object({
      limit: z.coerce
        .number()
        .min(1)
        .optional()
        .openapi({ example: 20, description: "取得数" }),
      offset: z.coerce
        .number()
        .min(0)
        .optional()
        .openapi({ example: 0, description: "オフセット" }),
      type: z
        .string()
        .optional()
        .openapi({ example: "photo_frame", description: "アイテムの種類" }),
    }),
  },
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
  const { limit, offset, type } = c.req.valid("query");

  const db = drizzle(c.env.DB, { schema });
  if (type) {
    const items = await db
      .select()
      .from(schema.itemTable)
      .where(eq(schema.itemTable.type, type))
      .orderBy(asc(schema.itemTable.name))
      .limit(limit ?? 20)
      .offset(offset ?? 0);
    return c.json(items, 200);
  }
  const result = await db
    .select()
    .from(schema.itemTable)
    .orderBy(asc(schema.itemTable.name))
    .limit(limit ?? 20)
    .offset(offset ?? 0);
  return c.json(result, 200);
});

app.openapi(getItemRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .select()
    .from(schema.itemTable)
    .where(eq(schema.itemTable.id, id));
  if (result.length === 0) {
    return c.json({ error: "アイテムが見つかりません" }, 404);
  }
  return c.json(result[0], 200);
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
        "item/object",
        `${result[0].id}.${objectFile.name.split(".").pop()}`,
      ),
      uploadFunction(
        c.env.BUCKET,
        objectThumbnail,
        "item/thumbnail",
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
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .delete(schema.itemTable)
    .where(eq(schema.itemTable.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ error: "アイテムが見つかりません" }, 404);
  }
  await Promise.all([
    deleteFunction(c.env.BUCKET, `item/object/${result[0].id}`),
    deleteFunction(c.env.BUCKET, `item/thumbnail/${result[0].id}`),
  ]);
  return c.body(null, 204);
});

app.openapi(patchItemRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("form");
  const db = drizzle(c.env.DB, { schema });

  // 定義されたフィールドのみを含めて部分更新
  const updateData: Partial<{
    name: string;
    description: string;
    type: string;
  }> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.type !== undefined) updateData.type = body.type;

  if (
    Object.keys(updateData).length === 0 &&
    !body.objectFile &&
    !body.objectThumbnail
  ) {
    return c.json({ error: "更新するフィールドがありません" }, 400);
  }

  let result: (typeof schema.itemTable.$inferSelect)[] = [];

  //NOTE: フィールドの更新がある場合のみデータベース更新
  if (Object.keys(updateData).length > 0) {
    result = await db
      .update(schema.itemTable)
      .set(updateData)
      .where(eq(schema.itemTable.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "アイテムが見つかりません" }, 404);
    }
  } else {
    //NOTE: フィールド更新がない場合は、アイテムが存在するか確認
    const existing = await db
      .select()
      .from(schema.itemTable)
      .where(eq(schema.itemTable.id, id));

    if (existing.length === 0) {
      return c.json({ error: "アイテムが見つかりません" }, 404);
    }
    result = existing;
  }

  if (body.objectFile || body.objectThumbnail) {
    try {
      if (body.objectFile) {
        await deleteFunction(c.env.BUCKET, `item/object/${result[0].id}`);
        await uploadFunction(
          c.env.BUCKET,
          body.objectFile,
          "item/object",
          `${result[0].id}.${body.objectFile.name.split(".").pop()}`,
        );
      }

      if (body.objectThumbnail) {
        await deleteFunction(c.env.BUCKET, `item/thumbnail/${result[0].id}`);
        await uploadFunction(
          c.env.BUCKET,
          body.objectThumbnail,
          "item/thumbnail",
          `${result[0].id}.${body.objectThumbnail.name.split(".").pop()}`,
        );
      }
    } catch (e) {
      return c.json({ error: `ファイルの更新に失敗しました．${e}` }, 500);
    }
  }

  return c.json(result[0], 200);
});

export default app;
