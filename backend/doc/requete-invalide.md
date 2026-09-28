# How to Return Error Codes from the API

To maintain modularity and consistency across the application, error handling uses the `MessageCodes` enum.
This maps numeric error codes to specific failure states in the API. Frontend clients can map these error IDs to localized, user-friendly error messages.

Responses can be sent using the `returnCode` and `returnJson` helper functions in `src/services/apiService.ts`.