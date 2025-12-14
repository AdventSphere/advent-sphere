import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

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
    createdAt: z
      .date()
      .openapi({ example: new Date().toISOString(), description: "作成日時" }),
    openDate: z.date().openapi({
      example: new Date().toISOString(),
      description: "開封可能日時",
    }),
    position: z
      .array(z.number())
      .optional()
      .openapi({ example: [0, 1, 2], description: "アイテムの位置情報" }),
    rotation: z
      .array(z.number())
      .optional()
      .openapi({ example: [0, 0, 0], description: "アイテムの回転情報" }),
    isOpened: z
      .boolean()
      .openapi({ example: false, description: "アイテムが開封されたかどうか" }),
    itemId: z
      .string()
      .openapi({ example: "item_12345", description: "関連するアイテムID" }),
    imageId: z
      .string()
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
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(listCalendarItemsRoute, async (c) => {
  const { roomId } = c.req.valid("param");

  const mockCalendarItems: CalendarItemSchema[] = [
    {
      id: "calendarItem_1",
      userId: "user_12345",
      roomId: roomId,
      createdAt: new Date(),
      openDate: new Date(),
      position: [0, 1, 2],
      isOpened: false,
      itemId: "item_12345",
      imageId: "image_12345",
      rotation: [0, 0, 0],
    },
  ];

  return c.json(mockCalendarItems);
});

app.openapi(createCalendarItemRoute, async (c) => {
  const { roomId } = c.req.valid("param");
  const { editId, calendarItem } = c.req.valid("json");

  // mock
  const res = {
    id: "calendarItem_12345",
    // ここで calendarItem と roomId を使ってDB保存する想定
  };
  return c.json(res, 201);
});

app.openapi(deleteCalendarItemRoute, async (c) => {
  const { roomId, id } = c.req.valid("param");
  const { editId } = c.req.valid("json");

  // mock delete
  return c.body(null, 204);
});

app.openapi(patchCalendarItemRoute, async (c) => {
  const { roomId, id } = c.req.valid("param");
  const { editId, calendarItem } = c.req.valid("json");

  const updated: CalendarItemSchema = {
    id,
    roomId,
    userId: calendarItem.userId || "user_12345",
    createdAt: new Date(),
    openDate: calendarItem.openDate || new Date(),
    position: calendarItem.position,
    isOpened: false,
    itemId: calendarItem.itemId || "item_12345",
    imageId: calendarItem.imageId,
    rotation: calendarItem.rotation,
  };

  return c.json(updated);
});

export default app;
