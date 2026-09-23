import { MessageCodes } from "../handlers/codes";

export class AppError
{
    code: number;
    message: MessageCodes|undefined;

    constructor(code: number, message: MessageCodes|undefined = undefined)
    {
        this.code = code;
        this.message = message;
    }
}