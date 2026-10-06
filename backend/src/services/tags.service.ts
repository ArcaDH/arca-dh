import { tags } from "../db/schema";
import { ConflictError } from "../errors";
import { CreateTagInput, TagDto } from "../models/tag.model";
import { tagsRepository } from "../repositories/tags.repository";

export const toTagDto = (tag: typeof tags.$inferSelect): TagDto => ({ id: tag.id, name: tag.name, color: tag.color });

export const tagsService = {
  async create(userId: number, input: CreateTagInput): Promise<TagDto> {
    if (await tagsRepository.findByName(userId, input.name)) {
      throw new ConflictError("You already have a tag with that name.");
    }
    return toTagDto(await tagsRepository.insert({ ...input, userId }));
  },
};
