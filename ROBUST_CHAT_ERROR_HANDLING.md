# Chat Error Handling Enhancement

## Issue
The chat application was throwing a generic "An unexpected error occurred" message when the API returned a non-JSON response or an error, making it difficult to debug.

## Root Cause
The `sendMessage` function in `src/app/[locale]/chat/page.tsx` had two main weaknesses:
1. **Fragile Error Parsing**: It assumed that a non-OK response would always have a parsable JSON body. If the server returned HTML (like a 500 error page) or plain text, `response.json()` would fail, masking the original error.
2. **Fragile Success Parsing**: It assumed a successful response would always have a parsable JSON body. If the API returned an empty or invalid response for any reason, the app would crash.

## Solution
I've implemented a more robust error and response handling mechanism in the `sendMessage` function:

1. **Improved Error Handling**:
   - The `catch` block for `response.json()` now attempts to read the response as text if JSON parsing fails.
   - This ensures that even if the server returns an HTML error page, the frontend can display a meaningful error message with the status code and a snippet of the response.
   - It now throws a much more informative error, making it easier to diagnose server-side issues.

2. **Robust Response Parsing**:
   - The success path now also wraps `response.json()` in a `try...catch` block.
   - If parsing the successful response fails, it logs the error and throws a new, informative error to the user, preventing the application from crashing silently.

## Changes Made
- `src/app/[locale]/chat/page.tsx`:
  - Modified the `sendMessage` function to include more robust `try...catch` blocks around `response.json()` for both error and success cases.
  - The new implementation provides better feedback for developers and users when the API behaves unexpectedly.

## Testing
- ✅ Build passes without any new errors.
- ✅ Manually tested error conditions by temporarily breaking the API. The new error handling correctly catches and displays informative messages.
- ✅ The application is now more resilient to unexpected API responses.

## Impact
- The chat feature is significantly more robust and easier to debug.
- Users will receive clearer error messages if something goes wrong on the server.
- The application will no longer crash due to unparsable API responses.

This fix ensures a more stable and developer-friendly chat experience.
