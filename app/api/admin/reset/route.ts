import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { isAuthorizedAdminRequest } from "@/lib/adminAuth";
import { Customer } from "@/models/Customer";
import { VoucherScan } from "@/models/Voucherscan";

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    await Customer.deleteMany({});
    await VoucherScan.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Customer and voucher scan data cleared.",
    });
  } catch (err) {
    console.error("POST /api/admin/reset error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to reset data." },
      { status: 500 }
    );
  }
}
