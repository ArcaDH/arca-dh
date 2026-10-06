import { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { User } from "../db/schema";
import { db } from "../db/index";
import { returnCode, returnJson, authorizeRequest, userIdFromToken } from "../services/apiService";
import { MessageCodes } from "./codes";
import { verifyPassword, hashPassword } from "../services/passwordService";
import { generateToken } from "../services/tokenService";
import { validateUserCreation, validateUserUpdate } from "../validators/users";

export namespace UserHandler {
  export async function createUser(request: Request, response: Response) {
    // Checks if the request is valid.
    // There could be missing informations at the moment inside the user object.
    let user = await validateUserCreation(request, response);
    if (!user) return;

    user.password = await hashPassword(user.password);

    await db.insert(User).values(user);

    returnCode(response, 201, MessageCodes.RESOURCE_CREATED);
    return;
  }

  export async function connectUser(request: Request, response: Response) {
    let password = request.body.password;
    let email = request.body.email;

    if (!password || !email) {
      returnCode(response, 400, MessageCodes.LOGIN_MISSING_DATA);
      return;
    }

    let user = await db
      .select()
      .from(User)
      .where(sql`${User.email} = ${email}`)
      .limit(1)
      .then((users) => (users.length > 0 ? users[0] : undefined));

    if (!user) {
      returnCode(response, 404, MessageCodes.LOGIN_INCORRECT_DATA);
      return;
    }

    // Password verification and response to the user.
    if (await verifyPassword(user.password, password)) {
      let content = {
        id: user.userId,
        token: generateToken(user.email, user.userId),
      };

      return returnJson(response, 200, content);
    } else {
      returnCode(response, 404, MessageCodes.LOGIN_INCORRECT_DATA);
    }
  }

  export async function patchUser(request: Request, response: Response) {
    // Checks if the user is authentificated and if he requests to update its own informations.
    let userId = request.params.id as unknown as number;
    if (!authorizeRequest(request, response, "", userId)) return;

    // Validate request
    if (!(await validateUserUpdate(request, response))) return;

    // Find user
    let user = await db
      .select()
      .from(User)
      .where(sql`${User.userId} = ${userId}`)
      .limit(1)
      .then((users) => (users.length > 0 ? users[0] : undefined));

    let modifications: any = {};

    if (!user) {
      returnCode(response, 404, MessageCodes.USER_NOT_FOUND);
      return;
    }

    // Application modifications provided by the user
    if (request.body.email) modifications.email = request.body.email;

    if (request.body.username) modifications.username = request.body.username;

    if (request.body.password) modifications.password = await hashPassword(request.body.password);

    await db
      .update(User)
      .set(modifications)
      .where(sql`${User.userId} = ${user.userId}`);

    modifications.id = user.userId;

    // Don't send the hashed password to the client.
    if (modifications.password) delete modifications.password;

    returnJson(response, 200, modifications);
  }

  export async function getUser(request: Request, response: Response) {
    if (!authorizeRequest(request, response)) return;

    // Safe, it would not have matched this route if the id was not a valid number.
    let requestedUser = request.params.id as unknown as number;
    if (!requestedUser) {
      returnCode(response, 400, MessageCodes.USER_NO_ID);
      return;
    }

    let user = await db
      .select()
      .from(User)
      .where(sql`${User.userId} = ${requestedUser}`);
    if (user.length == 0) {
      returnCode(response, 404, MessageCodes.USER_NOT_FOUND);
    } else {
      returnJson(response, 200, {
        id: user[0].userId,
        username: user[0].username,
        lastname: user[0].lastname,
        firstname: user[0].firstname,
        email: user[0].email,
      });
    }
  }
}
