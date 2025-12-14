import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const CreateRoomSchema = z
  .object({
    ownerId: z
      .string()
      .openapi({ example: "user_12345", description: "オーナーのユーザーID" }),
    itemGetTime: z.date().optional().openapi({
      example: new Date().toISOString(),
      description: "アイテム取得日時",
    }),
    password: z.string().optional().openapi({
      example: "securepassword",
      description: "ルームのパスワード",
    }),
    isAnonymous: z
      .boolean()
      .openapi({ example: false, description: "匿名モードかどうか" }),
    startAt: z
      .date()
      .openapi({ example: new Date().toISOString(), description: "開始日時" }),
  })
  .openapi("CreateRoom");

export const RoomSchema = CreateRoomSchema.extend({
  id: z.string().openapi({ example: "room_12345", description: "ルームID" }),
  createdAt: z.coerce.date().openapi({
    example: new Date().toISOString(),
    description: "ルーム作成日時",
  }),
  generateCount: z.number().openapi({ example: 0, description: "生成回数" }),
  editId: z
    .string()
    .openapi({ example: "edit_12345", description: "ルームの編集ID" }),
}).openapi("Room");

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
  // ここでルーム作成のロジックを実装（mock）
  const mockResponse = { editId: "12345" };
  return c.json(mockResponse, 201);
});

app.openapi(getRoomRoute, async (c) => {
  const { id } = c.req.valid("param");
  const mockRoom: RoomSchema = {
    id,
    createdAt: new Date(),
    ownerId: "user_12345",
    itemGetTime: new Date(),
    password: "securepassword",
    isAnonymous: false,
    startAt: new Date(),
    generateCount: 0,
    editId: "edit_12345",
  };
  return c.json(mockRoom);
});

app.openapi(deleteRoomRoute, async (c) => {
  const { id } = c.req.valid("param");
  // mock delete
  return c.body(null, 204);
});

app.openapi(patchRoomRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const updatedRoom: RoomSchema = {
    id,
    createdAt: new Date(),
    ownerId: "user_12345",
    itemGetTime: body.itemGetTime ?? new Date(),
    password: body.password ?? "securepassword",
    isAnonymous: body.isAnonymous ?? false,
    startAt: body.startAt ?? new Date(),
    generateCount: 0,
    editId: "edit_12345",
  };

  return c.json(updatedRoom);
});

export default app;
