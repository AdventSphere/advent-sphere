import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { addDays, set } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
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
    snowDomePartsLastDate: z.coerce.date().nullable().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "雪だるまパーツ最終更新日時",
    }),
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

const verifyPasswordRoute = createRoute({
  method: "post",
  path: "/{id}/verifyPassword",
  tags: ["Room"],
  summary: "ルームのパスワード確認",
  description: "ルームIDとパスワードを指定してパスワードが正しいか確認します。",
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
        "application/json": {
          schema: z.object({
            password: z.string().openapi({
              example: "securepassword",
              description: "ルームのパスワード",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "認証に成功しました" },
    401: { description: "認証に失敗しました" },
    404: { description: "ルームが見つかりません" },
  },
});

const isPasswordProtectedRoute = createRoute({
  method: "get",
  path: "/{id}/isPasswordProtected",
  tags: ["Room"],
  summary: "ルームのパスワード保護確認",
  description:
    "ルームIDを指定してそのルームがパスワード保護されているか確認します.",
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
      description: "ルームのパスワード保護状態",
      content: {
        "application/json": {
          schema: z.object({
            isPasswordProtected: z.boolean().openapi({
              example: true,
              description: "ルームがパスワード保護されているかどうか",
            }),
          }),
        },
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
  // 開始日時をJSTとして解釈
  const startAtJST = toZonedTime(new Date(body.startAt), "Asia/Tokyo");

  const randomDays = new Set<number>();
  while (randomDays.size < 4) {
    randomDays.add(Math.floor(Math.random() * 24) + 1);
  }

  const snowDomePartsUtcDates: Date[] = [];

  for (const day of Array.from(randomDays)) {
    let targetDateJST = addDays(startAtJST, day - 1);

    if (body.itemGetTime) {
      targetDateJST = set(targetDateJST, {
        hours: body.itemGetTime.getHours(),
        minutes: body.itemGetTime.getMinutes(),
        seconds: body.itemGetTime.getSeconds(),
        milliseconds: 0,
      });
    } else {
      targetDateJST = set(targetDateJST, {
        hours: Math.floor(Math.random() * 24),
        minutes: Math.floor(Math.random() * 60),
        seconds: 0,
        milliseconds: 0,
      });
    }

    const utcDate = fromZonedTime(targetDateJST, "Asia/Tokyo");
    snowDomePartsUtcDates.push(utcDate);
  }
  snowDomePartsUtcDates.sort((a, b) => a.getTime() - b.getTime());

  const result = await db
    .insert(schema.roomTable)
    .values({
      ...body,
      snowDomePartsLastDate: snowDomePartsUtcDates[0],
    })
    .returning();
  const snowdomeItems = await db
    .select()
    .from(schema.itemTable)
    .where(eq(schema.itemTable.type, "snowdome"));

  const snowDomePartsUtcDatesPromises = snowDomePartsUtcDates.map(
    async (date, index) => {
      const response = await db
        .insert(schema.calendarItemTable)
        .values({
          userId: "snowdome",
          roomId: result[0].id,
          openDate: date,
          itemId: snowdomeItems[index].id,
        })
        .returning();
      return response;
    },
  );
  await Promise.all(snowDomePartsUtcDatesPromises);

  return c.json(
    {
      editId: result[0].editId,
      id: result[0].id,
    },
    201,
  );
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

app.openapi(verifyPasswordRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { password } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .select()
    .from(schema.roomTable)
    .where(eq(schema.roomTable.id, id));

  if (result.length === 0) {
    return c.json({ message: "ルームが見つかりません" }, 404);
  }

  if (result[0].password !== password) {
    return c.json({ message: "認証に失敗しました" }, 401);
  }

  return c.json({ message: "認証に成功しました" }, 200);
});

app.openapi(isPasswordProtectedRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB, { schema });
  const result = await db
    .select()
    .from(schema.roomTable)
    .where(eq(schema.roomTable.id, id));

  if (result.length === 0) {
    return c.json({ message: "ルームが見つかりません" }, 404);
  }

  const isPasswordProtected =
    result[0].password !== null && result[0].password !== "";

  return c.json({ isPasswordProtected }, 200);
});

export default app;
