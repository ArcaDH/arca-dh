// Domain errors, thrown by services. They describe what went wrong without knowing about HTTP;
// the error handler middleware maps each one to a status code.

export class UnauthorizedError extends Error {}

export class NotFoundError extends Error {}

export class ConflictError extends Error {}
