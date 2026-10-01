import test from "node:test";
import assert from "node:assert/strict";

import { createAdminJwt, isAuthorizedAdminRequest } from "../lib/adminAuth";

test("accepts matching admin API key header", () => {
  process.env.ADMIN_API_KEY = "test-admin-key";

  const req = new Request("https://example.com/api/admin/export", {
    headers: { "x-admin-api-key": "test-admin-key" },
  });

  assert.equal(isAuthorizedAdminRequest(req), true);
});

test("accepts valid bearer JWT token", () => {
  process.env.ADMIN_JWT_SECRET = "test-jwt-secret";

  const token = createAdminJwt({ sub: "admin" });
  const req = new Request("https://example.com/api/admin/export", {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(isAuthorizedAdminRequest(req), true);
});
