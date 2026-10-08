import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
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

// Reads a file from the public image folders and returns a base64 data URI, or
// null if it can't be found/read. We support both public/images and public/image
// because older templates and new additions may live in either location.
function loadImageDataUri(filename: string, mime = "image/png"): string | null {
  const searchDirs = [
    path.join(process.cwd(), "public", "images"),
    path.join(process.cwd(), "public", "image"),
  ];

  for (const dir of searchDirs) {
    try {
      const filePath = path.join(dir, filename);
      const buffer = fs.readFileSync(filePath);
      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      // Try the next directory; missing assets should not crash the render.
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

    // The TJ voucher card is the actual design template. We no longer layer the
    // older promotional images on top of it; the uploaded image is the final card.
    const templateImage = loadImageDataUri("tjvoucher.jpeg", "image/jpeg");

    let qrDataUrl: string | null = null;
    try {
      const scanUrl = `${getBaseUrl(req)}/voucher/${encodeURIComponent(customer.voucherId)}`;
      qrDataUrl = await QRCode.toDataURL(scanUrl, {
        margin: 1,
        width: 200,
        color: { dark: "#181511", light: "#ffffff" },
      });
    } catch (err) {
      console.error("[voucher-image] Failed to generate QR code:", err);
    }

    const issuedDate = new Date(customer.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: "#f0b056",
          }}
        >
          {templateImage && (
            <img
              src={templateImage}
              width={1200}
              height={630}
              style={{ position: "absolute", inset: 0, objectFit: "cover" }}
              alt="TJ voucher template"
            />
          )}

          {qrDataUrl && (
            <div
              style={{
                position: "absolute",
                right: "120px",
                top: "115px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.9)",
                borderRadius: "12px",
                padding: "10px",
                boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
              }}
            >
              <img src={qrDataUrl} width={130} height={130} alt="Redemption QR code" />
            </div>
          )}

          <div
            style={{
              position: "absolute",
              left: "56px",
              bottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.85)",
              borderRadius: "8px",
              padding: "8px 16px",
              maxWidth: "1080px",
            }}
          >
            <div
              style={{
                color: "#2a1a00",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.3px",
                textAlign: "center",
              }}
            >
              {customer.fullName} · {customer.voucherId} · Issued {issuedDate}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        }
      }
    );
  } catch (err) {
    console.error("[voucher-image] Unhandled error:", err);
    return new Response("Failed to generate voucher image", { status: 500 });
  }
}