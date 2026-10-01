import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import {
  validateRegistration,
  hasErrors,
  normalizeWhatsappNumber,
} from "@/lib/validators";
import { sendVoucherOnWhatsApp } from "@/lib/whatsapp";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, ""); // strip trailing slash(es)
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const errors = validateRegistration(body);

    if (hasErrors(errors)) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const fullName = String(body.fullName).trim();
    const whatsappNumber = normalizeWhatsappNumber(String(body.whatsappNumber).trim());
    const address = String(body.address).trim();
    const pincode = String(body.pincode ?? "").trim();

    await connectToDatabase();

    const existingCustomer = await Customer.findOne({ whatsappNumber });
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            whatsappNumber:
              "This WhatsApp number is already registered. Please use a different number.",
          },
        },
        { status: 400 }
      );
    }

    const voucherId = `1000-${randomUUID()}`;

    const customer = await Customer.create({
      fullName,
      whatsappNumber,
      address,
      pincode,
      voucherId,
      deliveryStatus: "pending",
    });

    // Media URL must point to the generated voucher image endpoint so each voucher
    // has a unique image tied to its customer-specific voucher ID.
    const voucherImageUrl = `${getBaseUrl(req)}/api/voucher-image/${encodeURIComponent(
      voucherId
    )}`;

    const sendResult = await sendVoucherOnWhatsApp({
      toNumber: whatsappNumber,
      voucherId,
      voucherImageUrl,
    });

    customer.deliveryStatus = sendResult.success ? "sent" : "failed";
    if (!sendResult.success) customer.deliveryError = sendResult.error;
    await customer.save();

    return NextResponse.json(
      {
        success: true,
        voucherId,
        deliveryStatus: customer.deliveryStatus,
        deliveryError: customer.deliveryError,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/customers error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, customers });
  } catch (err) {
    console.error("GET /api/customers error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customers." },
      { status: 500 }
    );
  }
}