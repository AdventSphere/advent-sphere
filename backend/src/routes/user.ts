import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const UserSchema = z
  .object({
    id: z
      .string()
      .openapi({ example: "user_12345", description: "ユーザーID" }),
    createdAt: z.string().openapi({
      example: "2021-08-01T12:00:00Z",
      description: "ユーザー作成日時のタイムスタンプ",
    }),
    name: z.string().openapi({ example: "太郎", description: "ユーザー名" }),
  })
  .openapi("User");

export type UserSchema = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({
  id: true,
  name: true,
}).openapi("CreateUser");

const getUserRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["User"],
  summary: "ユーザー情報の取得",
  description: "ユーザーIDを指定してユーザー情報を取得します。",
  request: {
    params: z.object({
      id: z
        .string()
        .min(1)
        .openapi({
          param: {
            name: "id",
            in: "path",
          },
          example: "user_12345",
          description: "ユーザーID",
        }),
    }),
  },
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
    404: {
      description: "ユーザーが見つかりません",
    },
  },
});

const createUserRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["User"],
  summary: "ユーザーの作成",
  description: "新しいユーザーを作成します。",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "ユーザーが正常に作成されました",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
  },
});

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const mockUser: UserSchema = {
    id,
    createdAt: new Date().toISOString(),
    name: "太郎",
  };
  return c.json(mockUser);
});

app.openapi(createUserRoute, async (c) => {
  const body = c.req.valid("json");
  const newUser: UserSchema = {
    id: body.id,
    createdAt: new Date().toISOString(),
    name: body.name,
  };
  return c.json(newUser, 201);
});

export default app;
