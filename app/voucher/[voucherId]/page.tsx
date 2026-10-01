import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { VoucherScan } from "@/models/Voucherscan";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function scanAndLoad(voucherId: string) {
  await connectToDatabase();

  const normalizedId = voucherId.replace(/^#/, "");
  const candidateIds = Array.from(
    new Set([voucherId, normalizedId, `#${normalizedId}`])
  );

  const customer = await Customer.findOne({ voucherId: { $in: candidateIds } });
  if (!customer) return null;

  const userAgent = headers().get("user-agent") || undefined;
  await VoucherScan.create({
    voucherId: customer.voucherId,
    customerId: String(customer._id),
    userAgent,
  });

  const isFirstScan = !customer.redeemed;
  customer.scanCount = (customer.scanCount || 0) + 1;
  if (isFirstScan) {
    customer.redeemed = true;
    customer.redeemedAt = new Date();
  }
  await customer.save();

  return { customer, isFirstScan };
}

export default async function VoucherScanPage({
  params,
}: {
  params: { voucherId: string };
}) {
  const voucherId = decodeURIComponent(params.voucherId).trim();
  const result = await scanAndLoad(voucherId);

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-card border border-line rounded-2xl p-8 text-center max-w-sm">
          <h1 className="font-display text-2xl text-ink mb-2">Voucher not found</h1>
          <p className="text-charcoal/60">
            No voucher matches this code. Please check and try again.
          </p>
        </div>
      </main>
    );
  }

  const { customer, isFirstScan } = result;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8">
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs tracking-widest uppercase mb-4 ${
            isFirstScan
              ? "border border-gold text-gold-dark"
              : "border border-error/40 text-error bg-error/5"
          }`}
        >
          {isFirstScan ? "Redeemed just now" : "Already redeemed"}
        </div>

        <h1 className="font-display text-3xl text-ink mb-1">{customer.fullName}</h1>
        <p className="font-mono text-gold-dark text-lg mb-6">{customer.voucherId}</p>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-line pb-2">
            <dt className="text-charcoal/50">WhatsApp</dt>
            <dd className="text-ink">{customer.whatsappNumber}</dd>
          </div>
          <div className="flex justify-between border-b border-line pb-2">
            <dt className="text-charcoal/50">PIN code</dt>
            <dd className="text-ink">{customer.pincode}</dd>
          </div>
          <div className="flex justify-between border-b border-line pb-2">
            <dt className="text-charcoal/50">Redeemed at</dt>
            <dd className="text-ink">
              {customer.redeemedAt
                ? new Date(customer.redeemedAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-charcoal/50">Times scanned</dt>
            <dd className="text-ink">{customer.scanCount}</dd>
          </div>
        </dl>

        {!isFirstScan && (
          <p className="mt-6 text-sm text-error">
            This voucher has already been redeemed. Verify with the customer before
            honoring it again.
          </p>
        )}
      </div>
    </main>
  );
}