import type { NewTag, Tag } from "@/types/tag";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const tagsApi = {
  /** The logged-in user's tags, alphabetical. Tags belong to the user, not to a plan. */
  list: () => apiClient.get<Tag[]>(Endpoints.Tags.list()),

  create: (input: NewTag) => apiClient.post<Tag>(Endpoints.Tags.list(), input),

  /** Also removes the tag from every transaction that had it. */
  remove: (id: string) => apiClient.delete<void>(Endpoints.Tags.byId(id)),
};
