import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string(`${label} is required.`)
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} can be at most ${max} characters.`);

export const RegisterInput = z.object({
  firstName: requiredText("First name", 60),
  lastName: requiredText("Last name", 60),
  username: requiredText("Username", 20),
  email: z.email("Email address format is invalid.").max(60, "Email can be at most 60 characters."),
  // bcrypt only uses the first 72 bytes of a password
  password: z
    .string("Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password can be at most 72 characters."),
});

export const LoginInput = z.object({
  email: z.string("Email is required.").min(1, "Email is required."),
  password: z.string("Password is required.").min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof RegisterInput>;
export type LoginInput = z.infer<typeof LoginInput>;

/** A user as sent to clients: never includes the password hash. */
export interface PublicUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  currentPlanId: string | null;
}
