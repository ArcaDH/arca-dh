import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { IdParam } from "../models/common.model";
import { recurringService } from "../services/recurring.service";

// Mounted at /recurring in app.ts. These are the user's monthly payments.
export const recurringController = Router().use(requireAuth);

recurringController.get("/", async (_req, res) => {
  res.json(await recurringService.list(res.locals.userId));
});

recurringController.post("/:id/stop", async (req, res) => {
  await recurringService.stop(res.locals.userId, IdParam.parse(req.params.id));
  res.status(204).end();
});
