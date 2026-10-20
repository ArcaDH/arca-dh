import { eq, and, asc, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { tags, transactionTags, NewTagModel } from "../db/schema";

export namespace TagRepository {
  /** List all tags for user, sorted alphabetically. */
  export async function findByUserId(userId: number) {
    const rows = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(asc(sql`lower(${tags.name})`));
    return rows.map(formatTag);
  }

  /** Find tag by ID, verifying user ownership. */
  export async function findByIdAndUserId(id: string, userId: number) {
    const [row] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);
    return row ? formatTag(row) : null;
  }

  /** Find tag by case-insensitive name and userId. */
  export async function findByNameAndUserId(name: string, userId: number) {
    const [row] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), sql`lower(${tags.name}) = ${name.toLowerCase()}`))
      .limit(1);
    return row ? formatTag(row) : null;
  }

  /** Count how many of the given tag IDs exist and belong to the user. */
  export async function countByIdsAndUserId(ids: string[], userId: number) {
    if (ids.length === 0) return 0;
    const rows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(inArray(tags.id, ids), eq(tags.userId, userId)));
    return rows.length;
  }

  /** Create a tag. */
  export async function createTag(data: Pick<NewTagModel, "name" | "color" | "userId">) {
    const [created] = await db.insert(tags).values(data).returning();
    return formatTag(created);
  }

  /** Delete a tag (cascades tag removal from transactions). */
  export async function deleteTag(id: string) {
    const result = await db.delete(tags).where(eq(tags.id, id)).returning();
    return result.length > 0;
  }

  /** Map transaction IDs to their respective tags. */
  export async function findByTransactionIds(transactionIds: string[]) {
    const byTransaction = new Map<string, ReturnType<typeof formatTag>[]>();
    if (transactionIds.length === 0) return byTransaction;

    const rows = await db
      .select({ transactionId: transactionTags.transactionId, tag: tags })
      .from(transactionTags)
      .innerJoin(tags, eq(transactionTags.tagId, tags.id))
      .where(inArray(transactionTags.transactionId, transactionIds))
      .orderBy(asc(sql`lower(${tags.name})`));

    // Group tags by transaction in alphabetical order
    const ids = [...new Set(rows.map((row) => row.transactionId))];
    return new Map(
      ids.map((id) => [id, rows.filter((row) => row.transactionId === id).map((row) => formatTag(row.tag))]),
    );
  }

  /** Replace tags for a transaction. */
  export async function setTransactionTags(transactionId: string, tagIds: string[]) {
    await db.transaction(async (tx) => {
      await tx.delete(transactionTags).where(eq(transactionTags.transactionId, transactionId));
      if (tagIds.length > 0) {
        await tx.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId, tagId })));
      }
    });
  }

  /** Format tag record for JSON output. */
  function formatTag(tag: typeof tags.$inferSelect) {
    return { id: tag.id, name: tag.name, color: tag.color };
  }
}
