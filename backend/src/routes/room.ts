import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const CreateRoomSchema = z
  .object({
    ownerId: z
      .string()
      .openapi({ example: "user_12345", description: "オーナーのユーザーID" }),
    itemGetTime: z.coerce.date().optional().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "アイテム取得日時",
    }),
    password: z.string().optional().openapi({
      example: "securepassword",
      description: "ルームのパスワード",
    }),
    isAnonymous: z
      .boolean()
      .openapi({ example: false, description: "匿名モードかどうか" }),
    startAt: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "開始日時",
    }),
  })
  .openapi("CreateRoom");

export const RoomSchema = z
  .object({
    id: z.string().openapi({ example: "room_12345", description: "ルームID" }),
    ownerId: z
      .string()
      .openapi({ example: "user_12345", description: "オーナーのユーザーID" }),
    itemGetTime: z.coerce.date().nullable().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "アイテム取得日時",
    }),
    password: z.string().nullable().openapi({
      example: "securepassword",
      description: "ルームのパスワード",
    }),
    isAnonymous: z
      .boolean()
      .openapi({ example: false, description: "匿名モードかどうか" }),
    startAt: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "開始日時",
    }),
    createdAt: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "ルーム作成日時",
    }),
    generateCount: z.number().openapi({ example: 0, description: "生成回数" }),
    editId: z
      .string()
      .openapi({ example: "edit_12345", description: "ルームの編集ID" }),
  })
  .openapi("Room");

export type RoomSchema = z.infer<typeof RoomSchema>;

export const UpdateRoomSchema = CreateRoomSchema.pick({
  itemGetTime: true,
  password: true,
  isAnonymous: true,
  startAt: true,
})
  .partial()
  .openapi("UpdateRoom");

const createRoomRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Room"],
  summary: "ルームの作成",
  description: "新しいルームを作成します。",
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateRoomSchema },
      },
    },
  },
  responses: {
    201: {
      description: "ルームが正常に作成されました",
      content: {
        "application/json": {
          schema: z
            .object({
              id: z
                .string()
                .openapi({ example: "room_12345", description: "ルームID" }),
              editId: z
                .string()
                .openapi({ example: "12345", description: "ルームの編集ID" }),
            })
            .openapi("CreateRoomResponse"),
        },
      },
    },
  },
});

const getRoomRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Room"],
  summary: "ルーム情報の取得",
  description: "ルームIDを指定してルーム情報を取得します。",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
  },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": { schema: RoomSchema },
      },
    },
    404: { description: "ルームが見つかりません" },
  },
});

const deleteRoomRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Room"],
  summary: "ルームの削除",
  description: "ルームIDを指定してルームを削除します。",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
  },
  responses: {
    204: { description: "ルームが正常に削除されました" },
    404: { description: "ルームが見つかりません" },
  },
});

const patchRoomRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Room"],
  summary: "ルーム情報の更新",
  description: "ルームIDを指定してルーム情報を更新します。",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": { schema: UpdateRoomSchema },
      },
    },
  },
  responses: {
    200: {
      description: "ルーム情報が正常に更新されました",
      content: {
        "application/json": { schema: RoomSchema },
      },
    },
    404: { description: "ルームが見つかりません" },
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(createRoomRoute, async (c) => {
  const body = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const result = await db.insert(schema.roomTable).values(body).returning();

  return c.json({ editId: result[0].editId, id: result[0].id }, 201);
});

app.openapi(getRoomRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .select()
    .from(schema.roomTable)
    .where(eq(schema.roomTable.id, id));
  if (result.length === 0) {
    return c.json({ message: "ルームが見つかりません" }, 404);
  }
  const roomInfo = RoomSchema.parse(result[0]);

  return c.json(roomInfo, 200);
});

app.openapi(deleteRoomRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .delete(schema.roomTable)
    .where(eq(schema.roomTable.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: "ルームが見つかりません" }, 404);
  }

  return c.body(null, 204);
});

app.openapi(patchRoomRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .update(schema.roomTable)
    .set(body)
    .where(eq(schema.roomTable.id, id))
    .returning();
  if (result.length === 0) {
    return c.json({ message: "ルームが見つかりません" }, 404);
  }
  const updatedRoom = RoomSchema.parse(result[0]);

  return c.json(updatedRoom, 200);
});

export default app;
