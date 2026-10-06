import { z } from "zod";

export const IdParam = z.guid("That id is not valid.");

export const IsoDate = z.iso.date("Date must look like 2026-09-20.");
