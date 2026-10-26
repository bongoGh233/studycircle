type ErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  details?: string | null;
  hint?: string | null;
} | null | undefined;

export type FriendlyError = {
  message: string;
  code?: string;
};

const authCodeMessages: Record<string, string> = {
  invalid_credentials: "Invalid email or password. Please check your details and try again.",
  email_not_confirmed:
    "Your email address is not confirmed yet. Open the confirmation link we sent you, or resend it from the verification page.",
  user_already_exists: "An account with this email already exists. Sign in instead, or reset your password.",
  email_exists: "An account with this email already exists. Sign in instead, or reset your password.",
  weak_password: "Choose a stronger password with at least 8 characters, including letters and numbers.",
  over_email_send_rate_limit: "Too many emails have been sent. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many attempts. Wait a few minutes and try again.",
  signup_disabled: "New sign-ups are currently disabled for this project.",
  email_provider_disabled: "Email sign-in is not enabled for this project yet.",
  validation_failed: "Check the email address and password, then try again.",
  same_password: "Choose a password you have not used before.",
  session_not_found: "Your session has expired. Sign in again to continue.",
  refresh_token_not_found: "Your session has expired. Sign in again to continue.",
};

const dataCodeMessages: Record<string, string> = {
  "42501": "You do not have permission to do that. Sign in with the right account and try again.",
  "23503": "That department or profile is not available. Refresh the page and try again.",
  "23514": "Some of those details are not valid. Check the fields and try again.",
  "23505": "That record already exists. Refresh the page and try again.",
  "42P01": "The database schema is incomplete. Run the latest migration in the Supabase SQL editor, then try again.",
  PGRST116: "We could not find that record.",
  PGRST202: "The database function is missing. Run the latest migration in the Supabase SQL editor, then try again.",
};

export function normalizeAuthError(error: ErrorLike): FriendlyError {
  if (!error) return { message: "Something went wrong. Please try again." };

  const message = error.message ?? "";
  const code =
    error.code ??
    (message.toLowerCase().includes("email not confirmed")
      ? "email_not_confirmed"
      : message.toLowerCase().includes("invalid login credentials")
        ? "invalid_credentials"
        : message.toLowerCase().includes("user already registered")
          ? "user_already_exists"
          : undefined);

  if (code && authCodeMessages[code]) {
    return { message: authCodeMessages[code], code };
  }

  if (message.toLowerCase().includes("email not confirmed")) {
    return { message: authCodeMessages.email_not_confirmed, code: "email_not_confirmed" };
  }

  return {
    message:
      message && !message.toLowerCase().includes("failed to fetch")
        ? message
        : "We could not reach the authentication service. Check your internet connection and try again.",
    code,
  };
}

export function normalizeDataError(error: ErrorLike): FriendlyError {
  if (!error) return { message: "Something went wrong. Please try again." };

  const message = error.message ?? "";

  if (error.code && dataCodeMessages[error.code]) {
    return { message: dataCodeMessages[error.code], code: error.code };
  }

  if (message.includes("row-level security") || message.includes("permission denied")) {
    return { message: dataCodeMessages["42501"], code: "42501" };
  }

  if (message.toLowerCase().includes("could not find the table") || error.code === "42P01") {
    return {
      message: dataCodeMessages["42P01"],
      code: "42P01",
    };
  }

  if (
    message.toLowerCase().includes("could not find the function") ||
    error.code === "PGRST202"
  ) {
    return {
      message: dataCodeMessages.PGRST202,
      code: "PGRST202",
    };
  }

  if (message.toLowerCase().includes("failed to fetch")) {
    return { message: "We could not reach the database. Check your internet connection and try again." };
  }

  return { message: message || "Something went wrong. Please try again.", code: error.code };
}
