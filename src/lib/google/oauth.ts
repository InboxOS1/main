import "server-only";
import { google } from "googleapis";
import { GMAIL_SCOPES } from "@/lib/constants";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    envOrThrow("GOOGLE_OAUTH_CLIENT_ID"),
    envOrThrow("GOOGLE_OAUTH_CLIENT_SECRET"),
    envOrThrow("GOOGLE_OAUTH_REDIRECT_URI")
  );
}

/**
 * Builds the consent screen URL for connecting one Gmail inbox.
 * `state` carries the InboxOS uid (+ a CSRF nonce) through the redirect
 * so /api/gmail/callback knows which InboxOS account to attach the
 * inbox to. access_type=offline + prompt=consent are required to
 * reliably get a refresh_token back, including on re-connects.
 */
export function buildGmailConsentUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh_token. This usually means the account already granted consent without `prompt=consent`, or this is a Google Workspace account blocked by an admin policy."
    );
  }
  return tokens;
}

/** Returns an authenticated OAuth2 client for a connected account, given its (decrypted) refresh token. */
export function oauthClientFromRefreshToken(refreshToken: string) {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export async function fetchGoogleProfile(accessToken: string) {
  const client = createOAuthClient();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return {
    email: data.email ?? "",
    name: data.name ?? data.email ?? "Connected inbox",
    photoURL: data.picture ?? null,
  };
}
