import QRCode from "qrcode";
import Link from "next/link";

const STATIC_REGISTER_URL =
  process.env.NEXT_PUBLIC_REGISTER_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://scan-gift-tvl.vercel.app/register";

async function getRegisterUrl() {
  return `${STATIC_REGISTER_URL.replace(/\/$/, "")}`;
}

export default async function HomePage() {
  const registerUrl = await getRegisterUrl();
  const qrDataUrl = await QRCode.toDataURL(registerUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#181511", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full border border-gold/40 text-gold-dark text-xs tracking-[0.25em] uppercase mb-4">
            e-Gold Voucher Program
          </div>
          <h1 className="font-display text-4xl text-ink">
            Scan to claim your voucher
          </h1>
          <p className="mt-3 text-charcoal/70">
            Point your phone camera at the code below to open the registration
            form. Your e-voucher will arrive on WhatsApp.
          </p>
        </div>

        <div className="ticket-edge bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8">
          <div className="rounded-xl bg-white p-6 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR code linking to the eGold registration form"
              width={280}
              height={280}
              className="rounded-lg"
            />
          </div>

          <div className="ticket-perforation mt-6 pt-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal/50">
              Can't scan?
            </p>
            <Link
              href="/register"
              className="mt-2 inline-block font-display text-lg text-gold-dark underline decoration-gold/40 underline-offset-4 hover:text-gold"
            >
              Open the registration form instead
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
