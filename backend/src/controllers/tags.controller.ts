import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { CreateTagInput } from "../models/tag.model";
import { tagsService } from "../services/tags.service";

// Mounted at /tags in app.ts
export const tagsController = Router().use(requireAuth);

tagsController.post("/", async (req, res) => {
  res.status(201).json(await tagsService.create(res.locals.userId, CreateTagInput.parse(req.body)));
});
