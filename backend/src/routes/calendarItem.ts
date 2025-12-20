import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { set } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import * as schema from "../db/schema";
import { ItemSchema } from "./item";

const uploadFunction = (
  bucket: R2Bucket,
  object: File,
  path: string,
  fileName: string,
) => {
  const key = `${path}/${fileName}`;
  return bucket.put(key, object);
};

export const CalendarItemSchema = z
  .object({
    id: z.string().openapi({
      example: "calendarItem_12345",
      description: "カレンダーアイテムID",
    }),
    userId: z
      .string()
      .openapi({ example: "user_12345", description: "ユーザーID" }),
    userName: z
      .string()
      .openapi({ example: "太郎", description: "ユーザー名" }),
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

export const CalendarItemWithItemSchema = CalendarItemSchema.extend({
  item: ItemSchema.pick({ id: true, name: true, type: true }),
}).openapi("CalendarItemWithItem");

export type CalendarItemWithItemSchema = z.infer<
  typeof CalendarItemWithItemSchema
>;

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

export const UploadPhotoSchema = z
  .object({
    photo: z.instanceof(File).openapi({
      type: "string",
      format: "binary",
      description: "アップロードする写真ファイル",
      example: "image.png",
    }),
  })
  .openapi("UploadPhoto");
export type UploadPhotoSchema = z.infer<typeof UploadPhotoSchema>;

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
  },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: z.array(CalendarItemWithItemSchema),
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
          schema: z.array(CalendarItemWithItemSchema),
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

const uploadPhotoRoute = createRoute({
  method: "post",
  path: "/uploadPhoto",
  tags: ["calendar_items"],
  summary: "写真のアップロード",
  description: "写真をアップロードします。",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: UploadPhotoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "写真が正常にアップロードされました",
      content: {
        "application/json": {
          schema: z.object({
            imageId: z.string().openapi({
              example: "image_12345",
              description: "アップロードされた画像ID",
            }),
          }),
        },
      },
    },
    400: {
      description: "写真ファイルが提供されていません",
    },
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(listCalendarItemsRoute, async (c) => {
  const { roomId } = c.req.valid("param");
  const db = drizzle(c.env.DB, { schema });

  const calendarItems = await db
    .select({
      calendarItem: schema.calendarItemTable,
      item: schema.itemTable,
      user: schema.usersTable,
    })
    .from(schema.calendarItemTable)
    .innerJoin(
      schema.itemTable,
      eq(schema.calendarItemTable.itemId, schema.itemTable.id),
    )
    .innerJoin(
      schema.usersTable,
      eq(schema.calendarItemTable.userId, schema.usersTable.id),
    )
    .where(eq(schema.calendarItemTable.roomId, roomId));

  const transformed = calendarItems.map((i) =>
    transformCalendarItemWithItem(i.calendarItem, i.item, i.user),
  );
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
  const baseDateJST = toZonedTime(
    new Date(calendarItem.openDate),
    "Asia/Tokyo",
  );
  let targetDateJST: Date;
  if (roomInfo[0].itemGetTime === null) {
    targetDateJST = set(baseDateJST, {
      hours: Math.floor(Math.random() * 24),
      minutes: Math.floor(Math.random() * 60),
      seconds: 0,
      milliseconds: 0,
    });
  } else {
    const itemGetTimeJST = toZonedTime(roomInfo[0].itemGetTime, "Asia/Tokyo");
    const getHours = itemGetTimeJST.getHours();
    const getMinutes = itemGetTimeJST.getMinutes();

    targetDateJST = set(baseDateJST, {
      hours: getHours,
      minutes: getMinutes,
      seconds: 0,
      milliseconds: 0,
    });
  }
  const finalUtcDate = fromZonedTime(targetDateJST, "Asia/Tokyo");

  const calendarInfo = await db
    .insert(schema.calendarItemTable)
    .values({
      userId: calendarItem.userId,
      roomId: calendarItem.roomId,
      openDate: finalUtcDate,
      position: stringifyCoordinates(calendarItem.position),
      rotation: stringifyCoordinates(calendarItem.rotation),
      itemId: calendarItem.itemId,
      imageId: calendarItem.imageId,
      isOpened: calendarItem.isOpened ?? false,
    })
    .returning();

  if (calendarInfo.length === 0) {
    return c.json({ message: "カレンダーアイテムの作成に失敗しました" }, 500);
  }

  return c.json(
    {
      id: calendarInfo[0].id,
      openDate: calendarInfo[0].openDate,
    },
    201,
  );
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

    const user = await db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.id, result[0].userId))
      .limit(1);

    if (user.length === 0) {
      return c.json({ message: "ユーザーが見つかりません" }, 404);
    }

    return c.json(transformCalendarItem(result[0], user[0]), 200);
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

  const user = await db
    .select()
    .from(schema.usersTable)
    .where(eq(schema.usersTable.id, result[0].userId))
    .limit(1);

  if (user.length === 0) {
    return c.json({ message: "ユーザーが見つかりません" }, 404);
  }

  const updated = transformCalendarItem(result[0], user[0]);
  return c.json(updated, 200);
});

app.openapi(getInventoryItemRoute, async (c) => {
  const { roomId } = c.req.valid("param");

  const db = drizzle(c.env.DB, { schema });
  const calendarItems = await db
    .select({
      calendarItem: schema.calendarItemTable,
      item: schema.itemTable,
      user: schema.usersTable,
    })
    .from(schema.calendarItemTable)
    .innerJoin(
      schema.itemTable,
      eq(schema.calendarItemTable.itemId, schema.itemTable.id),
    )
    .innerJoin(
      schema.usersTable,
      eq(schema.calendarItemTable.userId, schema.usersTable.id),
    )
    .where(
      and(
        eq(schema.calendarItemTable.roomId, roomId),
        isNull(schema.calendarItemTable.position),
        eq(schema.calendarItemTable.isOpened, true),
      ),
    )
    .orderBy(asc(schema.itemTable.name));

  const transformed = calendarItems.map((i) =>
    transformCalendarItemWithItem(i.calendarItem, i.item, i.user),
  );
  return c.json(transformed, 200);
});

app.openapi(getRoomItemsRoute, async (c) => {
  const { roomId } = c.req.valid("param");

  const db = drizzle(c.env.DB, { schema });
  const calendarItems = await db
    .select({
      calendarItem: schema.calendarItemTable,
      item: schema.itemTable,
      user: schema.usersTable,
    })
    .from(schema.calendarItemTable)
    .innerJoin(
      schema.itemTable,
      eq(schema.calendarItemTable.itemId, schema.itemTable.id),
    )
    .innerJoin(
      schema.usersTable,
      eq(schema.calendarItemTable.userId, schema.usersTable.id),
    )
    .where(
      and(
        eq(schema.calendarItemTable.roomId, roomId),
        isNotNull(schema.calendarItemTable.position),
        eq(schema.calendarItemTable.isOpened, true),
      ),
    )
    .orderBy(asc(schema.itemTable.name));

  const transformed = calendarItems.map((i) =>
    transformCalendarItemWithItem(i.calendarItem, i.item, i.user),
  );
  return c.json(transformed, 200);
});

app.openapi(uploadPhotoRoute, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("photo");
  if (!file || !(file instanceof File)) {
    return c.json({ message: "写真ファイルが提供されていません" }, 400);
  }

  const imageId = nanoid();
  await uploadFunction(
    c.env.BUCKET,
    file,
    "item/user_image",
    `${imageId}.${file.name.split(".").pop()}`,
  );

  return c.json({ imageId }, 200);
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
  user: typeof schema.usersTable.$inferSelect,
): CalendarItemSchema => {
  const result = CalendarItemSchema.safeParse({
    ...item,
    userName: user.name,
    position: parseCoordinates(item.position),
    rotation: parseCoordinates(item.rotation),
  });
  if (!result.success) {
    throw new Error(`パースエラーが発生しました ${result.error.message}`);
  }
  return result.data;
};

const transformCalendarItemWithItem = (
  calendarItem: typeof schema.calendarItemTable.$inferSelect,
  item: typeof schema.itemTable.$inferSelect,
  user: typeof schema.usersTable.$inferSelect,
): CalendarItemWithItemSchema => {
  const parsed = transformCalendarItem(calendarItem, user);
  const result = CalendarItemWithItemSchema.safeParse({
    ...parsed,
    item: {
      id: item.id,
      name: item.name,
      type: item.type,
    },
  });
  if (!result.success) {
    throw new Error(`パースエラーが発生しました ${result.error.message}`);
  }
  return result.data;
};

export default app;
