import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const CalendarItemSchema = z
  .object({
    id: z.string().openapi({
      example: "calendarItem_12345",
      description: "カレンダーアイテムID",
    }),
    user_id: z
      .string()
      .openapi({ example: "user_12345", description: "ユーザーID" }),
    room_id: z
      .string()
      .openapi({ example: "room_12345", description: "ルームID" }),
    create_at: z
      .string()
      .openapi({ example: "2024-06-01T12:00:00Z", description: "作成日時" }),
    open_date: z.string().openapi({
      example: "2024-07-01T12:00:00Z",
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
    is_opened: z
      .boolean()
      .openapi({ example: false, description: "アイテムが開封されたかどうか" }),
    item_id: z
      .string()
      .openapi({ example: "item_12345", description: "関連するアイテムID" }),
    image_id: z
      .string()
      .optional()
      .openapi({ example: "image_12345", description: "関連する画像ID" }),
  })
  .openapi("CalendarItem");

export type CalendarItemSchema = z.infer<typeof CalendarItemSchema>;

export const CreateCalendarItemSchema = CalendarItemSchema.pick({
  user_id: true,
  room_id: true,
  open_date: true,
  position: true,
  rotation: true,
  item_id: true,
  image_id: true,
}).openapi("CreateCalendarItem");

export type CreateCalendarItemSchema = z.infer<typeof CreateCalendarItemSchema>;

const EditIdSchema = z.object({
  edit_id: z
    .string()
    .openapi({ example: "12345", description: "ルームの編集ID" }),
});

const CreateCalendarItemRequestSchema = z
  .object({
    edit_id: z
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

const PatchCalendarItemRequestSchema = CreateCalendarItemRequestSchema.openapi(
  "PatchCalendarItemRequest",
);

const listCalendarItemsRoute = createRoute({
  method: "get",
  path: "/{room_id}/calendarItems",
  tags: ["カレンダーアイテム"],
  summary: "カレンダーアイテム一覧の取得",
  description: "すべてのカレンダーアイテムを取得します。",
  request: {
    params: z.object({
      room_id: z.string().openapi({
        param: { name: "room_id", in: "path" },
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
  path: "/{room_id}/calendarItems",
  tags: ["カレンダーアイテム"],
  summary: "カレンダーアイテムの作成",
  description: "新しいカレンダーアイテムを作成します。",
  request: {
    params: z.object({
      room_id: z.string().openapi({
        param: { name: "room_id", in: "path" },
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
  path: "/{room_id}/calendarItems/{id}",
  tags: ["カレンダーアイテム"],
  summary: "カレンダーアイテムの削除",
  description: "指定したIDのカレンダーアイテムを削除します。",
  request: {
    params: z.object({
      room_id: z.string().openapi({
        param: { name: "room_id", in: "path" },
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
  path: "/{room_id}/calendarItems/{id}",
  tags: ["カレンダーアイテム"],
  summary: "カレンダーアイテムの更新",
  description: "指定したIDのカレンダーアイテム情報を更新します。",
  request: {
    params: z.object({
      room_id: z.string().openapi({
        param: { name: "room_id", in: "path" },
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
  const { room_id } = c.req.valid("param");

  const mockCalendarItems: CalendarItemSchema[] = [
    {
      id: "calendarItem_1",
      user_id: "user_12345",
      room_id: room_id,
      create_at: new Date().toISOString(),
      open_date: new Date().toISOString(),
      position: [0, 1, 2],
      is_opened: false,
      item_id: "item_12345",
      image_id: "image_12345",
      rotation: [0, 0, 0],
    },
  ];

  return c.json(mockCalendarItems);
});

app.openapi(createCalendarItemRoute, async (c) => {
  const { room_id } = c.req.valid("param");
  const { edit_id, calendarItem } = c.req.valid("json");

  // mock
  const res = {
    id: "calendarItem_12345",
    // ここで calendarItem と room_id を使ってDB保存する想定
  };
  return c.json(res, 201);
});

app.openapi(deleteCalendarItemRoute, async (c) => {
  const { room_id, id } = c.req.valid("param");
  const { edit_id } = c.req.valid("json");

  // mock delete
  return c.body(null, 204);
});

app.openapi(patchCalendarItemRoute, async (c) => {
  const { room_id, id } = c.req.valid("param");
  const { edit_id, calendarItem } = c.req.valid("json");

  const updated: CalendarItemSchema = {
    id,
    room_id,
    user_id: calendarItem.user_id,
    create_at: new Date().toISOString(),
    open_date: calendarItem.open_date,
    position: calendarItem.position,
    is_opened: false,
    item_id: calendarItem.item_id,
    image_id: calendarItem.image_id,
    rotation: calendarItem.rotation,
  };

  return c.json(updated);
});

export default app;
