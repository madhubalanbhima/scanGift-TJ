import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createAdminJwt } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body.password ?? "");

    if (!password || !checkAdminPassword(password)) {
      return NextResponse.json(
        { success: false, message: "Incorrect password." },
        { status: 401 }
      );
    }

    const token = createAdminJwt({ sub: "admin", role: "admin" });
    return NextResponse.json({ success: true, token });
  } catch (err) {
    console.error("POST /api/admin/login error:", err);
    return NextResponse.json(
      { success: false, message: "Login failed." },
      { status: 500 }
    );
  }
}
