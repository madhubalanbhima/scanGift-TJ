import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import * as fs from "fs";
import * as path from "path";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  return `${proto}://${host}`;
}

// The real design is a static uploaded voucher card. We serve that file directly
// instead of generating a new OG image so WhatsApp can fetch a stable JPEG URL
// without tripping Next's ImageResponse renderer on Windows/Node runtime issues.
function loadTemplateBuffer(filename: string): Buffer | null {
  const searchDirs = [
    path.join(process.cwd(), "public", "images"),
    path.join(process.cwd(), "public", "image"),
  ];

  for (const dir of searchDirs) {
    try {
      return fs.readFileSync(path.join(dir, filename));
    } catch {
      // Try next directory.
    }
  }

  console.error(`[voucher-image] Failed to load ${filename} from ${searchDirs.join(", ")}`);
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { voucherId: string } }
) {
  try {
    const rawVoucherId = decodeURIComponent(params.voucherId).trim();
    const normalizedVoucherId = rawVoucherId.replace(/^#/, "");
    const candidateIds = Array.from(
      new Set([rawVoucherId, normalizedVoucherId, `#${normalizedVoucherId}`])
    );

    await connectToDatabase();
    const customer = await Customer.findOne({ voucherId: { $in: candidateIds } }).lean();

    if (!customer) {
      console.error("[voucher-image] Voucher not found:", rawVoucherId);
      return new Response("Voucher not found", { status: 404 });
    }

    const templateBuffer = loadTemplateBuffer("tjvoucher.jpeg");
    if (!templateBuffer) {
      return new Response("Voucher template not found", { status: 404 });
    }

    return new Response(new Uint8Array(templateBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[voucher-image] Unhandled error:", err);
    return new Response("Failed to generate voucher image", { status: 500 });
  }
}