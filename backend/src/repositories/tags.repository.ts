import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { tags } from "../db/schema";

type NewTag = typeof tags.$inferInsert;

export const tagsRepository = {
  listForUser: (userId: number) => db.query.tags.findMany({ where: eq(tags.userId, userId), orderBy: asc(tags.name) }),

  /** The tags among `ids` that belong to the user. */
  findOwned: (userId: number, ids: string[]) =>
    db.query.tags.findMany({ where: and(eq(tags.userId, userId), inArray(tags.id, ids)) }),

  findByName: (userId: number, name: string) =>
    db.query.tags.findFirst({ where: and(eq(tags.userId, userId), sql`lower(${tags.name}) = lower(${name})`) }),

  insert: async (values: NewTag) => (await db.insert(tags).values(values).returning())[0],
};
