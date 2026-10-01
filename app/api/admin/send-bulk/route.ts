import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";
import { sendVoucherOnWhatsApp } from "@/lib/whatsapp";

interface BulkSendResult {
  totalCustomers: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    voucherId: string;
    whatsappNumber: string;
    success: boolean;
    error?: string;
  }>;
}

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, ""); // strip trailing slash(es)
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  return `${proto}://${host}`;
}

async function sendTemplateMessage(
  req: NextRequest,
  toNumber: string,
  voucherId: string,
  customerName: string
): Promise<{ success: boolean; error?: string }> {
  const voucherImageUrl = `${getBaseUrl(req)}/api/voucher-image/${encodeURIComponent(
    voucherId
  )}`;

  return sendVoucherOnWhatsApp({
    toNumber,
    voucherId,
    voucherImageUrl,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { limit } = body;

    await connectToDatabase();

    let query = Customer.find();
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    const customers = await query.lean();

    const results: BulkSendResult["results"] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      const result = await sendTemplateMessage(
        req,
        customer.whatsappNumber,
        customer.voucherId,
        customer.fullName
      );

      results.push({
        voucherId: customer.voucherId,
        whatsappNumber: customer.whatsappNumber,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    const bulkResult: BulkSendResult = {
      totalCustomers: customers.length,
      successCount,
      failedCount,
      results,
    };

    return NextResponse.json({ success: true, ...bulkResult });
  } catch (err) {
    console.error("POST /api/admin/send-bulk error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}
