import { Request, Response } from "express";
import { TagRepository } from "../repositories/tagRepository";
import { returnJson } from "../services/apiService";
import { validateRequest, validateTagData, validateTagId } from "../validators/tags";

const UNIQUE_VIOLATION = "23505";

const duplicateName = (response: Response) =>
  returnJson(response, 409, { code: 409, message: "You already have a tag with that name." });

export namespace TagHandler {
  /** GET /tags */
  export async function getTags(request: Request, response: Response) {
    try {
      const userId = validateRequest(request, response);
      if (userId == null) return;

      const result = await TagRepository.findByUserId(userId);
      return returnJson(response, 200, result);
    } catch (error) {
      console.error("Error in getTags:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** POST /tags (unique per user, case-insensitive) */
  export async function createTag(request: Request, response: Response) {
    try {
      const userId = validateRequest(request, response);
      if (userId == null) return;

      const validData = validateTagData(request.body, response);
      if (!validData) return;

      if (await TagRepository.findByNameAndUserId(validData.name, userId)) return duplicateName(response);

      const created = await TagRepository.createTag({ ...validData, userId });
      return returnJson(response, 201, created);
    } catch (error: any) {
      // Handle concurrent duplicate insertion caught by unique index
      if ((error?.code ?? error?.cause?.code) === UNIQUE_VIOLATION) return duplicateName(response);
      console.error("Error in createTag:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** DELETE /tags/:id */
  export async function deleteTag(request: Request, response: Response) {
    try {
      const userId = validateRequest(request, response);
      if (userId == null) return;

      const id = validateTagId(request, response);
      if (id == null) return;

      const existing = await TagRepository.findByIdAndUserId(id, userId);
      if (!existing) return returnJson(response, 404, { code: 404, message: "Tag not found" });

      await TagRepository.deleteTag(id);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteTag:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
