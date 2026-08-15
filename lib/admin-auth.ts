import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "satumeja_admin_session";

function getAdminPassword() {
  return process.env.ADMIN_ACCESS_PASSWORD?.trim() || "";
}

function createSessionToken(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function hasAdminPasswordConfigured() {
  return getAdminPassword().length > 0;
}

export function validateAdminPassword(password: string) {
  const expected = getAdminPassword();

  if (!expected || !password) {
    return false;
  }

  const expectedHash = createSessionToken(expected);
  const providedHash = createSessionToken(password);

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(providedHash),
  );
}

export function createAdminSessionValue() {
  const password = getAdminPassword();

  if (!password) {
    throw new Error("ADMIN_ACCESS_PASSWORD is not configured.");
  }

  return createSessionToken(password);
}

export function isValidAdminSession(value?: string | null) {
  const password = getAdminPassword();

  if (!password || !value) {
    return false;
  }

  const expected = createSessionToken(password);

  if (expected.length !== value.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(value));
}
