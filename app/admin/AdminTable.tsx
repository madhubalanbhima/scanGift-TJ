"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TOKEN_STORAGE_KEY, getAdminAuthHeaders } from "@/lib/adminAuth";

interface CustomerRow {
  id: string;
  fullName: string;
  whatsappNumber: string;
  address: string;
  voucherId: string;
  deliveryStatus: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  sent: "bg-green-100 text-green-800 border-green-300",
  failed: "bg-error/10 text-error border-error/30",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

export default function AdminTable({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.whatsappNumber.includes(q) ||
        c.voucherId.toLowerCase().includes(q)
    );
  }, [customers, query]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/export", {
        headers: getAdminAuthHeaders(),
      });
      if (!res.ok) {
        alert("Export failed: " + (await res.text()));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.href = url;
      a.download = match ? match[1] : "export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: getAdminAuthHeaders(),
      });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-5 border-b border-line">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, WhatsApp number, or voucher ID"
          className="w-full sm:max-w-xs rounded-lg border border-line bg-parchment/40 px-4 py-2 text-sm text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
        />
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center rounded-lg bg-gold-foil text-ink text-sm font-semibold px-4 py-2 tracking-wide hover:brightness-105 active:brightness-95 transition disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center rounded-lg border border-line text-sm font-medium px-4 py-2 text-charcoal/70 hover:bg-parchment/60 transition disabled:opacity-60"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50 uppercase text-xs tracking-wider border-b border-line">
              <th className="px-5 py-3 font-medium">Voucher ID</th>
              <th className="px-5 py-3 font-medium">Full name</th>
              <th className="px-5 py-3 font-medium">WhatsApp</th>
              <th className="px-5 py-3 font-medium">Address</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 font-mono text-gold-dark whitespace-nowrap">
                  {c.voucherId}
                </td>
                <td className="px-5 py-3 text-ink">{c.fullName}</td>
                <td className="px-5 py-3 text-charcoal/80 whitespace-nowrap">
                  {c.whatsappNumber}
                </td>
                <td className="px-5 py-3 text-charcoal/70 max-w-xs truncate" title={c.address}>
                  {c.address}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusStyles[c.deliveryStatus] || statusStyles.pending
                    }`}
                  >
                    {c.deliveryStatus}
                  </span>
                </td>
                <td className="px-5 py-3 text-charcoal/60 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-charcoal/50">
                  No registrations match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
