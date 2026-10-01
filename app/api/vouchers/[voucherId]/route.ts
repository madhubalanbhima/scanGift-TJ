import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

export async function GET(
  req: NextRequest,
  { params }: { params: { voucherId: string } }
) {
  try {
    await connectToDatabase();
    const rawVoucherId = decodeURIComponent(params.voucherId).trim();
    const normalizedVoucherId = rawVoucherId.replace(/^#/, "");
    const candidateIds = Array.from(
      new Set([rawVoucherId, normalizedVoucherId, `#${normalizedVoucherId}`])
    );

    const customer = await Customer.findOne({ voucherId: { $in: candidateIds } }).lean();

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "No customer found for this voucher ID." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customer });
  } catch (err) {
    console.error("GET /api/vouchers/[voucherId] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch voucher." },
      { status: 500 }
    );
  }
}
