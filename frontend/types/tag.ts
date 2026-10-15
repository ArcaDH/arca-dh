// types/tag.ts: matches what the backend sends for tags

// Tailwind's built-in color names, the same list as the backend's
export const TAG_COLORS = [
  "blue",
  "teal",
  "emerald",
  "amber",
  "orange",
  "red",
  "pink",
  "violet",
  "slate",
  "lime",
] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export const MAX_TAGS_PER_TRANSACTION = 5;
export const MAX_TAG_NAME_LENGTH = 30;

export type Tag = {
  id: string;
  name: string;
  color: TagColor;
};

/** What the page sends when it creates a tag. */
export type NewTag = {
  name: string;
  color: TagColor;
};
