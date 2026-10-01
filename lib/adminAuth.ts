import crypto from "crypto";
import jwt from "jsonwebtoken";

export const ADMIN_TOKEN_STORAGE_KEY = "egold_admin_token";

export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAdminToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_JWT_SECRET environment variable.");
  }
  return secret;
}

export function createAdminJwt(payload: Record<string, unknown> = { role: "admin" }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAdminJwt(token: string | undefined | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return !!decoded;
  } catch {
    return false;
  }
}

export function getAdminApiKey(): string | undefined {
  return process.env.ADMIN_API_KEY;
}

export function isValidAdminApiKey(apiKey: string | undefined | null): boolean {
  const expected = getAdminApiKey();
  if (!expected || !apiKey) return false;

  const actualBuffer = Buffer.from(apiKey);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAuthorizedAdminRequest(req: Request | { headers?: Headers }): boolean {
  const headerMap = req.headers;
  const authHeader = headerMap?.get?.("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const apiKey = headerMap?.get?.("x-admin-api-key") ?? "";

  if (isValidAdminApiKey(apiKey)) return true;
  if (verifyAdminJwt(bearerToken)) return true;

  return false;
}

export function checkAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Missing ADMIN_PASSWORD environment variable.");
  }
  const inputBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(adminPassword);
  if (inputBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}
