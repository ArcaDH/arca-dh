# Managing Authentication & Authorization Status in API Requests

This documentation explains how to use available methods to verify a user's authentication and authorization status.

## Validating a Request Token

To validate the bearer token passed in request headers, use the `authorizeRequest` function located in `src/services/apiService.ts`.
This function verifies that:

- The token is present in the request header.
- The token is valid and signed by our API.

If any of these conditions are not met, the function prepares a `401 Unauthorized` response indicating the user is not authenticated.

In addition, this function accepts 2 optional parameters: an `email` string and a user `id` number. This enables basic route authorization checks.
For example, on a route `users/infos/{userId}`, only the account owner should have permission to retrieve their details.
To verify this, use `authorizeRequest(request, response, email, userId)`.
If the user ID extracted from the token does not match the parameter passed, the function returns a `403 Forbidden` response indicating the user is not authorized to access the requested resource.
