import { Request, Response } from "express";
import { MessageCodes } from "../handlers/codes";
import { returnCode } from "../services/apiService";
import { UserRepository } from "../repositories/userRepository";

/** Validate request data for user creation. */
export async function validateUserCreation(request: Request, response: Response): Promise<any> {
  const firstName = request.body.firstName;
  const lastName = request.body.lastName;
  const email = request.body.email;
  const password = request.body.password;
  const username = request.body.username;

  if (!firstName || !lastName || !email || !password || !username) {
    returnCode(response, 400, MessageCodes.USER_CREATE_MISSING_DATA);
    return undefined;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT);
    return undefined;
  }

  if (password.length > 18) {
    returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_PASSWORD);
    return undefined;
  }

  if (username.length > 20) {
    returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_USERNAME);
    return undefined;
  }

  const existingUsernameUser = await UserRepository.findByUsername(username);
  if (existingUsernameUser) {
    returnCode(response, 400, MessageCodes.USER_CREATE_USERNAME_ALREADY_USED);
    return undefined;
  }

  const existingEmailUser = await UserRepository.findByEmail(email);
  if (existingEmailUser) {
    returnCode(response, 400, MessageCodes.USER_CREATE_EMAIL_ALREADY_USED);
    return undefined;
  }

  return {
    firstname: firstName,
    lastname: lastName,
    email: email,
    username: username,
    password: password,
  };
}

/** Validate request data for user updates. */
export async function validateUserUpdate(request: Request, response: Response): Promise<boolean> {
  if (request.body.password && request.body.password.length > 18) {
    returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_PASSWORD);
    return false;
  }

  if (request.body.username) {
    if (request.body.username.length > 20) {
      returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_USERNAME);
      return false;
    }

    const existingUser = await UserRepository.findByUsername(request.body.username);
    if (existingUser) {
      returnCode(response, 400, MessageCodes.USER_CREATE_USERNAME_ALREADY_USED);
      return false;
    }
  }

  if (request.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.body.email)) {
      returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT);
      return false;
    }

    const existingUser = await UserRepository.findByEmail(request.body.email);
    if (existingUser) {
      returnCode(response, 400, MessageCodes.USER_CREATE_EMAIL_ALREADY_USED);
      return false;
    }
  }

  return true;
}
