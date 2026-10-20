export enum MessageCodes {
  // General
  RESOURCE_CREATED = 1,
  USER_NOT_FOUND,

  // User routes
  LOGIN_MISSING_DATA,
  LOGIN_INCORRECT_DATA,

  USER_CREATE_MISSING_DATA,
  USER_CREATE_INVALID_EMAIL_FORMAT,
  USER_CREATE_INVALID_AGE,
  USER_CREATE_INVALID_PASSWORD,
  USER_CREATE_INVALID_USERNAME,
  USER_CREATE_USERNAME_ALREADY_USED,
  USER_CREATE_EMAIL_ALREADY_USED,
  USER_NO_ID,
}

export function toMessage(code: MessageCodes): string {
  switch (code) {
    case MessageCodes.USER_NO_ID:
      return "User ID was not specified.";
    case MessageCodes.RESOURCE_CREATED:
      return "Resource created successfully.";
    case MessageCodes.USER_CREATE_MISSING_DATA:
      return "Invalid data: A required field is missing.";
    case MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT:
      return "Email address format is invalid.";
    case MessageCodes.USER_CREATE_INVALID_PASSWORD:
      return "Password exceeds maximum length.";
    case MessageCodes.USER_CREATE_INVALID_USERNAME:
      return "Username exceeds maximum length.";
    case MessageCodes.USER_CREATE_EMAIL_ALREADY_USED:
      return "This email address is already in use.";
    case MessageCodes.USER_CREATE_USERNAME_ALREADY_USED:
      return "This username is already taken.";
    case MessageCodes.USER_NOT_FOUND:
      return "The requested user was not found.";
    case MessageCodes.LOGIN_MISSING_DATA:
      return "Invalid data: Required login fields missing.";
    case MessageCodes.LOGIN_INCORRECT_DATA:
      return "Invalid email or password combination.";
    case MessageCodes.USER_CREATE_INVALID_AGE:
      return "User must be over 15 years old.";
    default:
      return "An unexpected error occurred.";
  }
}
