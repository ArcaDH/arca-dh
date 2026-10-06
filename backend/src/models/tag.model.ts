import { z } from "zod";
import { tagColorEnum } from "../db/schema";

export const MAX_TAG_NAME_LENGTH = 30;

export type TagColor = (typeof tagColorEnum.enumValues)[number];

export const CreateTagInput = z.object({
  name: z
    .string("Tag name is required.")
    .trim()
    .min(1, "Tag name is required.")
    .max(MAX_TAG_NAME_LENGTH, `Tag name can be at most ${MAX_TAG_NAME_LENGTH} characters.`),
  color: z.enum(tagColorEnum.enumValues, "Pick one of the tag colors."),
});

export type CreateTagInput = z.infer<typeof CreateTagInput>;

export interface TagDto {
  id: string;
  name: string;
  color: TagColor;
}
