import { Response, Request, NextFunction } from "express";
import { MessageCodes, toMessage } from "../handlers/codes";
import { decodeToken, TokenValidationResult, verifyToken } from "./tokenService";
import { AppError } from "../data/app_error";

/**
 * Send a response to the client who made the request.
 * @param response object built by the express framework
 * @param code status code to return to the client 
 * @param messageId unique id destinated to the client representing the message. It could be used by a translation service of message code into user friendly message by the application. 
 * @param message message that the API wants to send to the client
 */
export function returnCode(response: Response, code: number, message: MessageCodes | undefined = undefined)
{
    response.status(code);
    
    if (message !== undefined)
    {
        response.json(
        {
            "code": message,
            "message": toMessage(message)
        });
    }
    else
    {
        // Case where the developper has not specified any message. 
        response.send();
    }
}

/**
 * Send a response to the client with a code and a content.
 * @param response object built by the express framework
 * @param code status code to return to the client
 * @param content an object of any type that will be sent to the client as a JSON object
 */
export function returnJson(response: Response, code: number, content: any)
{
    response.status(code).json(content);
}

export function authorizeRequestWithoutAnswer(request: Request, email: String = "", id: number = -1): boolean
{
    let token = request.headers.authorization;

    // No token provided
    if (!token || token.length == 0)
    {
        return false;
    }

    return verifyToken(token, email, id) == TokenValidationResult.SUCCESS;
}

/**
 * Validate if the client is authorized to make this request.
 * If the user is not authorized, an invalid response is prepared. 
 * @param request The express object representing the client request
 * @param email If provided, it will check that this token belong to this email (token.email = email)
 * @param id If provided, it will check that this token belon to this id (token.userId = id)
 */
export function authorizeRequest(request: Request, response: Response, email: String = "", id: number = -1) : boolean
{
    let token = request.headers.authorization;

    // No token provided
    if (!token || token.length == 0)
    {
        returnCode(response, 401);
        return false;
    }

    let result = verifyToken(token, email, id);

    if (result == TokenValidationResult.SUCCESS)
    {
        return true;
    }
    else if (result == TokenValidationResult.MISMATCH)
    {
        returnCode(response, 403);
        return false;
    }
    else
    {
        returnCode(response, 401);
        return false;
    }
}

/**
 * Tries to extract the user id from the jwt token.
 * @param request 
 */
export function userIdFromToken(request: Request) : number | undefined
{
    let token = request.headers.authorization;
    if (!token || token.length == 0)
        return undefined;

    return decodeToken(token)?.user;
}

/**
 * Tries to extract the user mail from the jwt token
 * @param request 
 */
export function emailFromToken(request: Request) : string | undefined
{
    let token = request.headers.authorization;
    if (!token || token.length == 0)
        return undefined;

    return decodeToken(token)?.email;
}

/**
 * Wraps an async handler so that a rejected promise is forwarded to the exception middleware.
 * Express 4 does not do this on its own, which leaves the request hanging.
 * @param handler async route handler
 */
export function asyncHandler(handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>)
{
    return (request: Request, response: Response, next: NextFunction) =>
    {
        handler(request, response, next).catch(next);
    };
}

export function exceptionMiddleware(err: any, req: Request, response: Response, next: NextFunction)
{
    // The response is already being sent, let express close the connection
    if (response.headersSent)
    {
        return next(err);
    }

    if (err instanceof AppError)
    {
        returnCode(response, err.code, err.message);
        return;
    }

    console.error(err);
    returnCode(response, 500);
}