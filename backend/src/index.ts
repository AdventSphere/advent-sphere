import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import ai from "./routes/ai";
import calendarItem from "./routes/calendarItem";
import item from "./routes/item";
import room from "./routes/room";

const allowedOrigins = [
  "http://localhost:3000",
  "https://advent-sphere-app.3d-calendar.workers.dev",
];

import user from "./routes/user";

const app = new OpenAPIHono();
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

export default app;
