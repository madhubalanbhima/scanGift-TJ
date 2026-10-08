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

    // Use the new TJ voucher template as the base background when it exists, while
    // falling back to the old auto-generated layout assets for backwards compatibility.
    const templateImage = loadImageDataUri("tjvoucher.jpeg", "image/jpeg");
    const bgImage = templateImage || loadImageDataUri("bg.png");
    const badgeImage = loadImageDataUri("101.png");
    const figureImage = loadImageDataUri("bhima-boy.png");
    const modelImage = loadImageDataUri("model.png");
    const giftImage = loadImageDataUri("gift.png");
    const grandImage = loadImageDataUri("grand.png");
    const logoImage = loadImageDataUri("logo.png");

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
            borderRadius: "20px",
            overflow: "hidden",
            background: "#1a1410",
          }}
        >
          {/* Background */}
          {bgImage && (
            <img
              src={bgImage}
              width={1200}
              height={630}
              style={{ position: "absolute", top: "0px", left: "0px", objectFit: "cover" }}
              alt=""
            />
          )}

          {/* Top-left: 10 Years badge — adjust width/height to match your asset's real ratio */}
          {badgeImage && (
            <img
              src={badgeImage}
              width={220}
              height={140}
              style={{ position: "absolute", top: "20px", left: "30px", objectFit: "contain" }}
              alt="10 Years Celebrating"
            />
          )}

          {/* Top-right: Bhima boy figure */}
          {figureImage && (
            <img
              src={figureImage}
              width={150}
              height={220}
              style={{ position: "absolute", top: "0px", right: "0px", objectFit: "contain" }}
              alt="Celebration Figure"
            />
          )}

          {/* Left: model image, bleeding to the edge */}
          {/* {modelImage && (
            <img
              src={modelImage}
              width={440}
              height={630}
              style={{ position: "absolute", left: "50px", top: "100px", objectFit: "cover" }}
              alt="Bhima Model"
            />
          )} */}

          {/* Center: gift label + grand opening badge, stacked and centered */}
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: "230px",
              right: "270px",
              bottom: "100px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {giftImage && (
              <img src={giftImage} width={300} height={160} style={{ objectFit: "contain" }} alt="Gift" />
            )}
            {/* {grandImage && (
              <img
                src={grandImage}
                width={420}
                height={270}
                style={{ objectFit: "contain" }}
                alt="Grand Opening"
              />
            )} */}
          </div>

          {/* Right: amount badge */}
          <div
            style={{
              position: "absolute",
              right: "38px",
              top: "245px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "5px solid #e6c76a",
              borderRadius: "18px",
              padding: "18px 28px",
              background: "rgba(93,9,9,0.92)",
              color: "#fff0b5",
              fontSize: "64px",
              fontWeight: 900,
            }}
          >
            5,000
          </div>

          {/* QR code — bottom-left, sized to leave room for the footer bar */}
          {qrDataUrl && (
            <div
              style={{
                position: "absolute",
                left: "50px",
                bottom: "90px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#ffffff",
                borderRadius: "8px",
                padding: "8px",
              }}
            >
              <img src={qrDataUrl} width={180} height={180} alt="Redemption QR code" />
              <div
                style={{
                  display: "flex",
                  color: "#181511",
                  fontSize: "10px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginTop: "4px",
                }}
              >
                Scan to verify
              </div>
            </div>
          )}

          {/* Footer: per-customer voucher details pinned to bottom, full width */}
          <div
            style={{
              position: "absolute",
              bottom: "0px",
              left: "0px",
              right: "0px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.92)",
              padding: "10px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#2a1a00",
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "0.5px",
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