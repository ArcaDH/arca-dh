import { users } from "../db/schema";
import { ConflictError, UnauthorizedError } from "../errors";
import { hashPassword, verifyPassword } from "../lib/password";
import { signToken } from "../lib/token";
import { LoginInput, PublicUser, RegisterInput } from "../models/auth.model";
import { usersRepository } from "../repositories/users.repository";

const convertToPublicUser = (user: typeof users.$inferSelect): PublicUser => ({
  id: user.userId,
  username: user.username,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  currentPlanId: user.currentPlanId,
});

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const [emailTaken, usernameTaken] = await Promise.all([
      usersRepository.findByEmail(input.email),
      usersRepository.findByUsername(input.username),
    ]);
    if (emailTaken) throw new ConflictError("This email address is already in use.");
    if (usernameTaken) throw new ConflictError("This username is already taken.");

    const user = await usersRepository.insert({
      firstname: input.firstName,
      lastname: input.lastName,
      email: input.email,
      username: input.username,
      password: await hashPassword(input.password),
    });
    return convertToPublicUser(user);
  },

  /** @returns The user and a token to store in the auth cookie. */
  async login({ email, password }: LoginInput): Promise<{ user: PublicUser; token: string }> {
    const user = await usersRepository.findByEmail(email);
    // Same answer for an unknown email and a wrong password, so emails can't be probed
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    return { user: convertToPublicUser(user), token: signToken(user.userId) };
  },

  /** The logged-in user. Fails if the account was deleted after the token was issued. */
  async getCurrentUser(userId: number): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new UnauthorizedError("You need to log in.");
    return convertToPublicUser(user);
  },
};
