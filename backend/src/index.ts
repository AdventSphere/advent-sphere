import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { doSomeTaskOnASchedule } from "./lib/cronFunction";
import ai from "./routes/ai";
import calendarItem from "./routes/calendarItem";
import item from "./routes/item";
import room from "./routes/room";

const allowedOrigins = [
  "http://localhost:3000",
  "https://advent-sphere-app.3d-calendar.workers.dev",
  /^https:\/\/([a-zA-Z0-9-]+-)?advent-sphere-app\.3d-calendar\.workers\.dev$/,
];

import user from "./routes/user";

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
}>();
app.use(
  "*",
  cors({
    origin: (origin) => {
      return allowedOrigins.includes(origin) ? origin : undefined;
    },
    allowHeaders: ["Content-Type"],
    allowMethods: ["POST", "GET", "PATCH", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/", (c) => c.text("Hello, World!"));
app.route("/calendarItems", calendarItem);
app.route("/users", user);
app.route("/items", item);
app.route("/rooms", room);
app.route("/ai", ai);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "advent-sphere API",
  },
});

app.get(
  "/docs",
  Scalar({
    pageTitle: "API Documentation",
    sources: [{ url: "/openapi.json", title: "API" }],
  }),
);

const scheduled: ExportedHandlerScheduledHandler<CloudflareBindings> = async (
  _event,
  env,
  ctx,
) => {
  ctx.waitUntil(
    doSomeTaskOnASchedule(env)
      .then((response) => {
        console.log(
          `スケジュール関数が正常に完了しました: ${response} 件の古いルームが削除されました。`,
        );
      })
      .catch((error) => {
        console.error("スケジュール関数の実行中にエラーが発生しました:", error);
      }),
  );
  console.log("スケジュール関数が実行されました");
};

export default {
  fetch: app.fetch,
  scheduled,
};
