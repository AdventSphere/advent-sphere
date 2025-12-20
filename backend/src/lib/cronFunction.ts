import { subDays } from "date-fns";
import { and, asc, eq, isNotNull, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "../db/schema";

export const doSomeTaskOnASchedule = async (
  env: CloudflareBindings,
): Promise<number> => {
  const drizzleDb = drizzle(env.DB);
  // 例: 古いカレンダーアイテムを削除する
  // 90日以上前に作成されたルームを取得
  const ninetyDaysAgo = subDays(new Date(), 90);
  const oldRooms = await drizzleDb
    .select()
    .from(schema.roomTable)
    .where(
      and(
        isNotNull(schema.roomTable.startAt),
        lt(schema.roomTable.startAt, ninetyDaysAgo),
      ),
    )
    .orderBy(asc(schema.roomTable.createdAt));
  for (const room of oldRooms) {
    const deletedCalendarItems = await drizzleDb
      .delete(schema.calendarItemTable)
      .where(eq(schema.calendarItemTable.roomId, room.id))
      .returning();
    for (const item of deletedCalendarItems) {
      const objectKey = `item/user_image/${item.imageId}.png`;
      await env.BUCKET.delete(objectKey);
    }
  }
  const deletedRooms = await drizzleDb
    .delete(schema.roomTable)
    .where(
      and(
        isNotNull(schema.roomTable.startAt),
        lt(schema.roomTable.startAt, ninetyDaysAgo),
      ),
    );
  return deletedRooms.meta.changes;
};
