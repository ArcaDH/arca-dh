import { Request, Response } from "express";
import { UserRepository } from "../repositories/userRepository";
import { returnCode, returnJson, authorizeRequest } from "../services/apiService";
import { MessageCodes } from "./codes";
import { verifyPassword, hashPassword } from "../services/passwordService";
import { generateToken } from "../services/tokenService";
import { validateUserCreation, validateUserUpdate } from "../validators/users";

export namespace UserHandler {
  export async function createUser(request: Request, response: Response) {
    try {
      const user = await validateUserCreation(request, response);
      if (!user) return;

      user.password = await hashPassword(user.password);
      await UserRepository.createUser(user);

      returnCode(response, 201, MessageCodes.RESOURCE_CREATED);
    } catch (error) {
      console.error("Error in createUser:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  export async function connectUser(request: Request, response: Response) {
    try {
      const { password, email } = request.body || {};

      if (!password || !email) {
        returnCode(response, 400, MessageCodes.LOGIN_MISSING_DATA);
        return;
      }

      const user = await UserRepository.findByEmail(email);

      if (!user) {
        returnCode(response, 404, MessageCodes.LOGIN_INCORRECT_DATA);
        return;
      }

      if (await verifyPassword(user.password, password)) {
        const content = {
          id: user.userId,
          token: generateToken(user.email, user.userId),
        };
        return returnJson(response, 200, content);
      } else {
        returnCode(response, 404, MessageCodes.LOGIN_INCORRECT_DATA);
      }
    } catch (error) {
      console.error("Error in connectUser:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  export async function patchUser(request: Request, response: Response) {
    try {
      const userId = Number(request.params.id);
      if (!authorizeRequest(request, response, "", userId)) return;

      if (!(await validateUserUpdate(request, response))) return;

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404, MessageCodes.USER_NOT_FOUND);
        return;
      }

      const modifications: any = {};

      if (request.body.email) modifications.email = request.body.email;
      if (request.body.username) modifications.username = request.body.username;
      if (request.body.password) modifications.password = await hashPassword(request.body.password);

      await UserRepository.updateUser(user.userId, modifications);

      modifications.id = user.userId;
      if (modifications.password) delete modifications.password;

      returnJson(response, 200, modifications);
    } catch (error) {
      console.error("Error in patchUser:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  export async function getUser(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const requestedUser = Number(request.params.id);
      if (!requestedUser || isNaN(requestedUser)) {
        returnCode(response, 400, MessageCodes.USER_NO_ID);
        return;
      }

      const user = await UserRepository.findById(requestedUser);
      if (!user) {
        returnCode(response, 404, MessageCodes.USER_NOT_FOUND);
      } else {
        returnJson(response, 200, {
          id: user.userId,
          username: user.username,
          lastname: user.lastname,
          firstname: user.firstname,
          email: user.email,
        });
      }
    } catch (error) {
      console.error("Error in getUser:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  export async function deleteUser(request: Request, response: Response) {
    try {
      const userId = Number(request.params.id);
      if (!userId || isNaN(userId)) {
        returnCode(response, 400, MessageCodes.USER_NO_ID);
        return;
      }

      if (!authorizeRequest(request, response, "", userId)) return;

      const user = await UserRepository.findById(userId);
      if (!user) {
        returnCode(response, 404, MessageCodes.USER_NOT_FOUND);
        return;
      }

      // Cascades to user's plans and tags
      await UserRepository.deleteUser(userId);

      response.status(204).send();
    } catch (error) {
      console.error("Error in deleteUser:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
