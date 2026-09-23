import { Request, Response } from "express";
import { MessageCodes } from "../handlers/codes";
import { returnCode } from "../services/apiService";
import { db } from "../db";
import { User } from "../db/schema";
import { sql } from "drizzle-orm";

/**
 * Actually, this method checks some basics things about a request to create a user:
 * - Every required field is provided
 * - The email format is valid (basic regex)
 * - The age is a number and above 15
 * - The password is not above 18 characters (bcrypt limitation)
 * - The username is not above 20 characters
 * - The username is not already used
 * - The email is not already used
 * 
 * ... Feel free to add more checks.
 * @param request 
 * @param response 
 * @returns The result status of the validation. If the result is false, the client response is already prepared.
 */
export async function validateUserCreation(request: Request, response: Response): Promise<any>
{
    let firstName = request.body.firstName;
    let lastName = request.body.lastName;
    let email = request.body.email;
    let password = request.body.password;
    let username = request.body.username;

    // All those informations are provided
    if (!firstName || !lastName || !email || !password || !username)
    {
        returnCode(response, 400, MessageCodes.USER_CREATE_MISSING_DATA);
        return undefined;
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
    {
        returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT);
        return undefined;
    }

    // The password is not above 18 characters (bcrypt limitation)
    if (password.length > 18)
    {
        returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_PASSWORD);
        return undefined;
    }

    // Username is too long, we limit it to 20 characters
    if (username.length > 20)
    {
        returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_USERNAME);
        return undefined;
    }

    // Username is already used by someone.
    let found = await db.select().from(User)
        .where(sql`${User.username} = ${username}`)
        .limit(1)
        .then((users) => users.length > 0);

    if (found)
    {  
        returnCode(response, 400, MessageCodes.USER_CREATE_USERNAME_ALREADY_USED);
        return undefined;
    }

    // Email is already used by someone.
    found = await db.select().from(User)
        .where(sql`${User.email} = ${email}`)
        .limit(1)
        .then((users) => users.length > 0);

    if (found)
    {
        returnCode(response, 400, MessageCodes.USER_CREATE_EMAIL_ALREADY_USED);
        return undefined;
    }

    // Everything is fine.
    return {
        firstname: firstName,
        lastname: lastName,
        email: email,
        username: username,
        password: password
    };
}

export async function validateUserUpdate(request: Request, response: Response) : Promise<boolean>
{
    // The password is not above 18 characters (bcrypt limitation)
    if (request.body.password && request.body.password.length > 18)
    {
        returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_PASSWORD);
        return false;
    }

    // Username is too long, we limit it to 20 characters
    if (request.body.username)
    {
        if (request.body.username.length > 20)
        {
            returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_USERNAME);
            return false;
        }

        // Username is already used by someone.    // Username is already used by someone.
        let found = await db.select().from(User)
            .where(sql`${User.username} = ${request.body.username}`)
            .limit(1)
            .then((users) => users.length > 0);

        if (found)
        {  
            returnCode(response, 400, MessageCodes.USER_CREATE_USERNAME_ALREADY_USED);
            return false;
        }        
    }

    if (request.body.email)
    {
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(request.body.email))
        {
            returnCode(response, 400, MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT);
            return false;
        }

        // Email is already used by someone.
        let found = await db.select().from(User)
        .where(sql`${User.email} = ${request.body.email}`)
        .limit(1)
        .then((users) => users.length > 0);

        if (found)
        {
            returnCode(response, 400, MessageCodes.USER_CREATE_EMAIL_ALREADY_USED);
            return false;
        }
    }


    return true;
}