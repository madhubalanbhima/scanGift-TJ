import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import AdminTable from "./AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connectToDatabase();

  const customers = await Customer.find().sort({ createdAt: -1 }).lean();

  const rows = customers.map((customer) => ({
    id: String(customer._id),
    fullName: customer.fullName || "",
    whatsappNumber: customer.whatsappNumber || "",
    address: customer.address || "",
    voucherId: customer.voucherId || "",
    deliveryStatus: customer.deliveryStatus || "pending",
    createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <main className="min-h-screen bg-parchment px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full border border-gold/40 text-gold-dark text-xs tracking-[0.25em] uppercase mb-3">
              Admin
            </div>
            <h1 className="font-display text-3xl text-ink">Registered vouchers</h1>
          </div>
          <div className="text-sm text-charcoal/60">
            {rows.length} {rows.length === 1 ? "customer" : "customers"}
          </div>
        </div>

        <AdminTable customers={rows} />
      </div>
    </main>
  );
}