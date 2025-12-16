import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { set } from "date-fns";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const CalendarItemSchema = z
  .object({
    id: z.string().openapi({
      example: "calendarItem_12345",
      description: "カレンダーアイテムID",
    }),
    userId: z
      .string()
      .openapi({ example: "user_12345", description: "ユーザーID" }),
    roomId: z
      .string()
      .openapi({ example: "room_12345", description: "ルームID" }),
    createdAt: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "作成日時",
    }),
    openDate: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2024-01-01T00:00:00Z",
      description: "開封可能日時",
    }),
    position: z
      .array(z.number())
      .nullable()
      .optional()
      .openapi({ example: [0, 1, 2], description: "アイテムの位置情報" }),
    rotation: z
      .array(z.number())
      .nullable()
      .optional()
      .openapi({ example: [0, 0, 0], description: "アイテムの回転情報" }),
    isOpened: z
      .boolean()
      .optional()
      .openapi({ example: false, description: "アイテムが開封されたかどうか" }),
    itemId: z
      .string()
      .openapi({ example: "item_12345", description: "関連するアイテムID" }),
    imageId: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "image_12345", description: "関連する画像ID" }),
  })
  .openapi("CalendarItem");

export type CalendarItemSchema = z.infer<typeof CalendarItemSchema>;

export const CreateCalendarItemSchema = CalendarItemSchema.pick({
  userId: true,
  roomId: true,
  openDate: true,
  position: true,
  rotation: true,
  itemId: true,
  imageId: true,
  isOpened: true,
}).openapi("CreateCalendarItem");

export type CreateCalendarItemSchema = z.infer<typeof CreateCalendarItemSchema>;

const EditIdSchema = z.object({
  editId: z
    .string()
    .openapi({ example: "12345", description: "ルームの編集ID" }),
});

const CreateCalendarItemRequestSchema = z
  .object({
    editId: z
      .string()
      .openapi({ example: "12345", description: "ルームの編集ID" }),
    calendarItem: CreateCalendarItemSchema,
  })
  .openapi("CreateCalendarItemRequest");

const CreateCalendarItemResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "calendarItem_12345",
      description: "カレンダーアイテムID",
    }),
  })
  .openapi("CreateCalendarItemResponse");

const PatchCalendarItemRequestSchema = z
  .object({
    editId: z
      .string()
      .optional()
      .openapi({ example: "12345", description: "ルームの編集ID" }),
    calendarItem: CreateCalendarItemSchema.partial(),
  })
  .openapi("PatchCalendarItemRequest");

const listCalendarItemsRoute = createRoute({
  method: "get",
  path: "/{roomId}/calendarItems",
  tags: ["calendar_items"],
  summary: "カレンダーアイテム一覧の取得",
  description: "すべてのカレンダーアイテムを取得します。",
  request: {
    params: z.object({
      roomId: z.string().openapi({
        param: { name: "roomId", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
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
          schema: z.array(CalendarItemSchema),
        },
      },
    },
  },
});

const createCalendarItemRoute = createRoute({
  method: "post",
  path: "/{roomId}/calendarItems",
  tags: ["calendar_items"],
  summary: "カレンダーアイテムの作成",
  description: "新しいカレンダーアイテムを作成します。",
  request: {
    params: z.object({
      roomId: z.string().openapi({
        param: { name: "roomId", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: CreateCalendarItemRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "カレンダーアイテムが正常に作成されました",
      content: {
        "application/json": {
          schema: CreateCalendarItemResponseSchema,
        },
      },
    },
    403: { description: "ルームの編集権限がありません" },
  },
});

const deleteCalendarItemRoute = createRoute({
  method: "delete",
  path: "/{roomId}/calendarItems/{id}",
  tags: ["calendar_items"],
  summary: "カレンダーアイテムの削除",
  description: "指定したIDのカレンダーアイテムを削除します。",
  request: {
    params: z.object({
      roomId: z.string().openapi({
        param: { name: "roomId", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example: "calendarItem_12345",
        description: "カレンダーアイテムID",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: EditIdSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "カレンダーアイテムが正常に削除されました",
    },
  },
});

const patchCalendarItemRoute = createRoute({
  method: "patch",
  path: "/{roomId}/calendarItems/{id}",
  tags: ["calendar_items"],
  summary: "カレンダーアイテムの更新",
  description: "指定したIDのカレンダーアイテム情報を更新します。",
  request: {
    params: z.object({
      roomId: z.string().openapi({
        param: { name: "roomId", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
      id: z.string().openapi({
        param: { name: "id", in: "path" },
        example: "calendarItem_12345",
        description: "カレンダーアイテムID",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: PatchCalendarItemRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "カレンダーアイテムが正常に更新されました",
      content: {
        "application/json": {
          schema: CalendarItemSchema,
        },
      },
    },
    403: { description: "ルームの編集権限がありません" },
    404: { description: "カレンダーアイテムが見つかりません" },
  },
});

const getInventoryItemRoute = createRoute({
  method: "get",
  path: "/{roomId}/calendarItems/inventory",
  tags: ["calendar_items"],
  summary: "インベントリーに入っているアイテムの取得",
  description: "インベントリーに入っているアイテムを取得します。",
  request: {
    params: z.object({
      roomId: z.string().openapi({
        param: { name: "roomId", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
  },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: z.array(CalendarItemSchema),
        },
      },
    },
  },
});

const getRoomItemsRoute = createRoute({
  method: "get",
  path: "/{roomId}/calendarItems/room",
  tags: ["calendar_items"],
  summary: "部屋に配置されているアイテムの取得",
  description: "部屋に配置されているアイテムを取得します。",
  request: {
    params: z.object({
      roomId: z.string().openapi({
        param: { name: "roomId", in: "path" },
        example: "room_12345",
        description: "ルームID",
      }),
    }),
  },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: z.array(CalendarItemSchema),
        },
      },
    },
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(listCalendarItemsRoute, async (c) => {
  const { roomId } = c.req.valid("param");
  const { limit, offset, type } = c.req.valid("query");

  const db = drizzle(c.env.DB, { schema });

  if (type) {
    const calendarItems = await db
      .select({ calendarItem: schema.calendarItemTable })
      .from(schema.calendarItemTable)
      .innerJoin(
        schema.itemTable,
        eq(schema.calendarItemTable.itemId, schema.itemTable.id),
      )
      .where(
        and(
          eq(schema.calendarItemTable.roomId, roomId),
          eq(schema.itemTable.type, type),
        ),
      )
      .limit(limit ?? 10)
      .offset(offset ?? 0);

    const transformed = calendarItems.map((i) =>
      transformCalendarItem(i.calendarItem),
    );
    return c.json(transformed, 200);
  }

  const calendarItems = await db
    .select()
    .from(schema.calendarItemTable)
    .where(eq(schema.calendarItemTable.roomId, roomId))
    .limit(limit ?? 20)
    .offset(offset ?? 0);

  const transformed = calendarItems.map(transformCalendarItem);
  return c.json(transformed, 200);
});

app.openapi(createCalendarItemRoute, async (c) => {
  const { roomId } = c.req.valid("param");
  const { editId, calendarItem } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const roomInfo = await db
    .select()
    .from(schema.roomTable)
    .where(eq(schema.roomTable.id, roomId))
    .limit(1);
  if (roomInfo.length === 0 || roomInfo[0].editId !== editId) {
    return c.json({ message: "ルームの編集権限がありません" }, 403);
  }

  // NOTE: ユーザーとアイテムが存在するか確認
  const userExists = await db
    .select()
    .from(schema.usersTable)
    .where(eq(schema.usersTable.id, calendarItem.userId))
    .limit(1);
  if (userExists.length === 0) {
    return c.json({ message: "指定されたユーザーが見つかりません" }, 404);
  }

  const itemExists = await db
    .select()
    .from(schema.itemTable)
    .where(eq(schema.itemTable.id, calendarItem.itemId))
    .limit(1);
  if (itemExists.length === 0) {
    return c.json({ message: "指定されたアイテムが見つかりません" }, 404);
  }

  // NOTE: itemGetTimeが設定されている場合はその時間を使用、されていない場合はランダムな時間を設定する
  let openDate = calendarItem.openDate;
  if (roomInfo[0].itemGetTime === null) {
    {
      const randomHours = Math.floor(Math.random() * 24);
      const randomMinutes = Math.floor(Math.random() * 60);
      openDate = set(openDate, {
        hours: randomHours,
        minutes: randomMinutes,
        seconds: 0,
        milliseconds: 0,
      });
    }
  } else {
    openDate = set(openDate, {
      hours: roomInfo[0].itemGetTime.getHours(),
      minutes: roomInfo[0].itemGetTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });
  }

  const calendarInfo = await db
    .insert(schema.calendarItemTable)
    .values({
      userId: calendarItem.userId,
      roomId: calendarItem.roomId,
      openDate: openDate,
      position: stringifyCoordinates(calendarItem.position),
      rotation: stringifyCoordinates(calendarItem.rotation),
      itemId: calendarItem.itemId,
      imageId: calendarItem.imageId,
    })
    .returning();
  if (calendarInfo.length === 0) {
    return c.json({ message: "カレンダーアイテムの作成に失敗しました" }, 500);
  }

  return c.json({ id: calendarInfo[0].id }, 201);
});

app.openapi(deleteCalendarItemRoute, async (c) => {
  const { roomId, id } = c.req.valid("param");
  const { editId } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  if (!(await verifyEditId(db, roomId, editId))) {
    return c.json({ message: "ルームの編集権限がありません" }, 403);
  }

  await db
    .delete(schema.calendarItemTable)
    .where(
      and(
        eq(schema.calendarItemTable.id, id),
        eq(schema.calendarItemTable.roomId, roomId),
      ),
    );
  return c.body(null, 204);
});

app.openapi(patchCalendarItemRoute, async (c) => {
  const { roomId, id } = c.req.valid("param");
  const { editId, calendarItem } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  //NOTE: editIdがundefinedの場合は開封状態と位置情報・回転情報のみ更新を許可
  if (editId === undefined) {
    const result = await db
      .update(schema.calendarItemTable)
      .set({
        isOpened: calendarItem.isOpened,
        position: stringifyCoordinates(calendarItem.position),
        rotation: stringifyCoordinates(calendarItem.rotation),
      })
      .where(
        and(
          eq(schema.calendarItemTable.id, id),
          eq(schema.calendarItemTable.roomId, roomId),
        ),
      )
      .returning();
    if (result.length === 0) {
      return c.json({ message: "カレンダーアイテムが見つかりません" }, 404);
    }
    return c.json(transformCalendarItem(result[0]), 200);
  }

  if (!(await verifyEditId(db, roomId, editId))) {
    return c.json({ message: "ルームの編集権限がありません" }, 403);
  }
  const result = await db
    .update(schema.calendarItemTable)
    .set({
      openDate: calendarItem.openDate,
      position: stringifyCoordinates(calendarItem.position),
      rotation: stringifyCoordinates(calendarItem.rotation),
      itemId: calendarItem.itemId,
      imageId: calendarItem.imageId,
      isOpened: calendarItem.isOpened,
      userId: calendarItem.userId,
      roomId: calendarItem.roomId,
    })
    .where(
      and(
        eq(schema.calendarItemTable.id, id),
        eq(schema.calendarItemTable.roomId, roomId),
      ),
    )
    .returning();

  if (result.length === 0) {
    return c.json({ message: "カレンダーアイテムが見つかりません" }, 404);
  }

  const updated = transformCalendarItem(result[0]);
  return c.json(updated, 200);
});

app.openapi(getInventoryItemRoute, async (c) => {
  const { roomId } = c.req.valid("param");

  const db = drizzle(c.env.DB, { schema });
  const calendarItems = await db
    .select()
    .from(schema.calendarItemTable)
    .where(
      and(
        eq(schema.calendarItemTable.roomId, roomId),
        isNull(schema.calendarItemTable.position),
      ),
    );

  const transformed = calendarItems.map(transformCalendarItem);
  return c.json(transformed, 200);
});

app.openapi(getRoomItemsRoute, async (c) => {
  const { roomId } = c.req.valid("param");

  const db = drizzle(c.env.DB, { schema });
  const calendarItems = await db
    .select()
    .from(schema.calendarItemTable)
    .where(
      and(
        eq(schema.calendarItemTable.roomId, roomId),
        isNotNull(schema.calendarItemTable.position),
      ),
    );

  const transformed = calendarItems.map(transformCalendarItem);
  return c.json(transformed, 200);
});

// editId検証
const verifyEditId = async (
  db: ReturnType<typeof drizzle>,
  roomId: string,
  editId: string,
): Promise<boolean> => {
  const result = await db
    .select()
    .from(schema.roomTable)
    .where(eq(schema.roomTable.id, roomId))
    .limit(1);
  return result.length > 0 && result[0].editId === editId;
};

const stringifyCoordinates = (
  position: number[] | null | undefined,
): string | null => {
  return position ? JSON.stringify(position) : null;
};

const parseCoordinates = (data: string | null): number[] | null => {
  return data ? JSON.parse(data) : null;
};

const transformCalendarItem = (
  item: typeof schema.calendarItemTable.$inferSelect,
): CalendarItemSchema => {
  const result = CalendarItemSchema.safeParse({
    ...item,
    position: parseCoordinates(item.position),
    rotation: parseCoordinates(item.rotation),
  });
  if (!result.success) {
    throw new Error(`パースエラーが発生しました ${result.error.message}`);
  }
  return result.data;
};

export default app;
