import { BadRequestError } from "../errors";
import { usersRepository } from "../repositories/users.repository";

/** The budget plan that all of the user's transactions belong to. */
export async function requireCurrentPlanId(userId: number): Promise<string> {
  const user = await usersRepository.findById(userId);
  if (!user?.currentPlanId) throw new BadRequestError("Create a budget plan first.");
  return user.currentPlanId;
}
