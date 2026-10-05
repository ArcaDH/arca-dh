import { compare, hash } from "bcrypt-ts";

export const hashPassword = (password: string) => hash(password, 10);

export const verifyPassword = (password: string, passwordHash: string) => compare(password, passwordHash);
