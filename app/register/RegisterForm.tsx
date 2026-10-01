"use client";

import { useEffect, useState, FormEvent } from "react";
import { FULL_NAME_REGEX, WHATSAPP_REGEX } from "@/lib/validators";

interface FormState {
  fullName: string;
  whatsappNumber: string;
  address: string;
  pincode: string;  
}

interface FormErrors {
  fullName?: string;
  whatsappNumber?: string;
  address?: string;
  pincode?: string;
  form?: string;
}

const initialState: FormState = { fullName: "", whatsappNumber: "", address: "", pincode: "" };

interface RegisterFormProps {
  onSubmitSuccess?: () => void;
}

export default function RegisterForm({ onSubmitSuccess }: RegisterFormProps = {}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [voucherId, setVoucherId] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);

  // Generate a large paper-blast effect that covers the whole viewport.
  // It only renders after the voucher is successfully generated.
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{
      left: number;
      delay: number;
      duration: number;
      size: number;
      width: number;
      height: number;
      rotate: number;
      drift: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    if (!voucherId) {
      setConfettiPieces([]);
      return;
    }

    const colors = [
      "#8f1717",
      "#b52b22",
      "#d4ad5a",
      "#edc86c",
      "#f3d88d",
      "#7a351f",
      "#f4d785",
      "#fff0b5",
      "#c58b24",
      "#e5b95c",
    ];

    setConfettiPieces(
      Array.from({ length: 90 }, (_, index) => ({
        left: (index * 37.7) % 100,
        delay: -((index * 0.17) % 4.8),
        duration: 3.8 + ((index * 0.13) % 3.2),
        size: 5 + ((index * 7) % 7),
        width: 4 + ((index * 5) % 8),
        height: 8 + ((index * 11) % 13),
        rotate: (index * 47) % 360,
        drift: ((index * 29) % 180) - 90,
        color: colors[index % colors.length],
      }))
    );
  }, [voucherId]);


  function handleFullNameChange(value: string) {
    // Only allow letters, spaces, and dots while typing.
    const filtered = value.replace(/[^A-Za-z. ]/g, "");
    setForm((f) => ({ ...f, fullName: filtered }));
  }

  function handleWhatsappChange(value: string) {
    const filtered = value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, whatsappNumber: filtered }));
  }

  function handlePincodeChange(value: string) {
    const filtered = value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode: filtered }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    const fullName = form.fullName.trim();
    const whatsappNumber = form.whatsappNumber.trim();
    const address = form.address.trim();
    const pincode = form.pincode.trim();

    if (!fullName) {
      next.fullName = "Full name is required.";
    } else if (!FULL_NAME_REGEX.test(fullName)) {
      next.fullName =
        "Only letters, single spaces, and dots are allowed (e.g. \"A. John doe\").";
    }

    if (!whatsappNumber) {
      next.whatsappNumber = "WhatsApp number is required.";
    } else if (!WHATSAPP_REGEX.test(`91${whatsappNumber}`)) {
      next.whatsappNumber = "Enter a valid Indian WhatsApp number (10 digits).";
    }

    if (!address) {
      next.address = "Address is required.";
    }

    if (!pincode) {
      next.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(pincode)) {
      next.pincode = "Pincode must be a 6-digit number.";
    }

    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        whatsappNumber: `91${form.whatsappNumber}`,
        pincode: form.pincode.trim(),
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ form: data?.message || "Registration failed. Please try again." });
        }
        return;
      }

      setVoucherId(data.voucherId);
      setDeliveryStatus(data.deliveryStatus);
      setForm(initialState);
      onSubmitSuccess?.();
    } catch (err) {
      setErrors({ form: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (voucherId) {
    return (
      <>
        {/* Full-page paper blast / confetti. It stays behind the voucher card. */}
        <div className="paper-blast-page" aria-hidden="true">
          {confettiPieces.map((piece, index) => (
            <span
              key={index}
              className="paper-blast-piece"
              style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                backgroundColor: piece.color,
                ["--size" as any]: `${piece.size}px`,
                ["--rotate" as any]: `${piece.rotate}deg`,
                ["--drift" as any]: `${piece.drift}px`,
              }}
            />
          ))}
        </div>
            <div className="mb-5 flex justify-center">
              <img
                src="/images/Bhima.png"
                alt="Bhima Gold logo"
                className="w-full max-w-md rounded-lg p-3 object-contain"
              />
            </div>
            <h1 className="flex items-center justify-center font-display text-2xl text-ink">Claim your e-voucher</h1>
        <section className="voucher-success-page relative z-10 mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
          <div className="voucher-card relative overflow-hidden rounded-3xl border border-[#d4ad5a] bg-[#5d0909] p-6 text-center shadow-[0_25px_70px_-25px_rgba(74,0,0,0.65)] sm:p-10">
            {/* Gold border and decorative corner ribbons */}
            <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-[#e6c76a]/80" />
            <div className="pointer-events-none absolute -right-8 -top-1 h-20 w-32 rotate-45 bg-gradient-to-r from-[#c58b24] via-[#fff0b5] to-[#d4ad5a] opacity-90" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-32 -rotate-45 bg-gradient-to-r from-[#c58b24] via-[#fff0b5] to-[#d4ad5a] opacity-90" />

            {/* Gift ornament */}
            <div className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 sm:block">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e6c76a] bg-[#5d0909] shadow-[0_0_0_5px_rgba(212,173,90,0.08)]">
                <span className="text-4xl" aria-hidden="true">🎁</span>
              </div>
            </div>

            {/* BHIMA branding area */}
            {/* <div className="relative z-10 mx-auto max-w-xl">
              <p className="font-sans text-[10px] tracking-[0.42em] text-[#fff0b5] sm:text-xs">
                BHIMA GOLD <span className="text-[#edc86c]">•</span> PURE GOLD
              </p>

              <div className="mx-auto mt-2 inline-flex items-center justify-center border-y border-[#e6c76a] bg-[#f5a900] px-7 py-2 shadow-[0_5px_20px_rgba(0,0,0,0.2)] sm:px-10">
                <span className="font-sans text-3xl font-black tracking-[0.22em] text-black sm:text-5xl">
                  BHIMA
                </span>
              </div>

              <div className="mx-auto mt-1 w-fit bg-[#a51e1e] px-4 py-1 font-sans text-[9px] font-semibold tracking-[0.14em] text-white sm:text-xs">
                GOLD • DIAMONDS • SILVER • PLATINUM
              </div>

              <p className="mt-2 font-sans text-[10px] tracking-[0.38em] text-[#fff0b5] sm:text-xs">
                INDIA <span className="text-[#edc86c]">•</span> UAE
              </p>
              <p className="font-sans text-[10px] tracking-[0.38em] text-[#fff0b5] sm:text-xs">
                SINCE 1925
              </p>
            </div> */}
            
            {/* Registered badge */}
            <div className="relative z-10 mx-auto mt-5 inline-flex items-center gap-2 rounded-full border-2 border-[#e6c76a] px-5 py-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#ffe7a0] shadow-[inset_0_0_18px_rgba(230,199,106,0.08)] sm:text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e6c76a] text-[#5d0909]">
                ✓
              </span>
             Thank you!
            </div>

            <div className="relative z-10 mt-7">
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl text-[#edc86c]">✦</span>
                <h2 className="font-display text-2xl font-semibold text-[#fff0b5] sm:text-4xl">
                  Congratulations!
                </h2>
                <span className="text-xl text-[#edc86c]">✦</span>
              </div>
              <p className="mx-auto mt-3 max-w-lg font-sans text-sm leading-7 text-white/90 sm:text-base">
                
                {deliveryStatus === "sent"
                  ? "You have earned a Rs.1,000 voucher."
                  : "You have earned a Rs.1,000 voucher."}
              </p>
              <br />
            </div>

            <p className="relative z-10 mt-3 font-sans text-[10px] uppercase tracking-[0.18em] text-[#e6c76a]/80">
              Thank you for choosing BHIMA JEWELLERY
            </p>
          </div>
        </section>

        <style jsx>{`
          .paper-blast-page {
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
          }

          .paper-blast-piece {
            position: absolute;
            top: -30px;
            display: block;
            border-radius: 1px;
            opacity: 0;
            transform: translate3d(0, -20px, 0) rotate(var(--rotate));
            animation-name: paper-fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            box-shadow: 0 1px 3px rgba(60, 15, 0, 0.15);
          }

          .paper-blast-piece:nth-child(3n) {
            border-radius: 50%;
          }

          .paper-blast-piece:nth-child(4n) {
            clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          }

          @keyframes paper-fall {
            0% {
              opacity: 0;
              transform:
                translate3d(0, -40px, 0)
                rotate(var(--rotate))
                scale(0.7);
            }
            8% {
              opacity: 0.95;
            }
            75% {
              opacity: 0.9;
            }
            100% {
              opacity: 0;
              transform:
                translate3d(var(--drift), 110vh, 0)
                rotate(calc(var(--rotate) + 720deg))
                scale(1);
            }
          }

          .voucher-card {
            animation: voucher-pop 700ms cubic-bezier(0.2, 0.85, 0.25, 1) both;
          }

          @keyframes voucher-pop {
            0% {
              opacity: 0;
              transform: translateY(20px) scale(0.94);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .paper-blast-piece,
            .voucher-card {
              animation: none !important;
            }

            .paper-blast-piece {
              opacity: 0.55;
            }
          }
        `}</style>
      </>
    );
  }


  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="ticket-edge bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8 space-y-6"
    >
      {errors.form && (
        <div className="rounded-lg bg-error/10 border border-error/30 text-error text-sm px-4 py-3">
          {errors.form}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-ink mb-1.5">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={form.fullName}
          onChange={(e) => handleFullNameChange(e.target.value)}
          placeholder="e.g. John Doe"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1.5 text-sm text-error">
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
  <label
    htmlFor="whatsappNumber"
    className="block text-sm font-medium text-ink mb-1.5"
  >
    WhatsApp number
  </label>

  <div className="flex items-center rounded-lg border border-line bg-parchment/40 overflow-hidden transition focus-within:border-gold focus-within:ring-1 focus-within:ring-gold">
    <span className="shrink-0 px-4 text-ink font-medium border-r border-line">
      +91
    </span>

    <input
      id="whatsappNumber"
      type="tel"
      inputMode="numeric"
      value={form.whatsappNumber}
      onChange={(e) => handleWhatsappChange(e.target.value)}
      placeholder="9876543210"
      aria-invalid={!!errors.whatsappNumber}
      aria-describedby={errors.whatsappNumber ? "whatsapp-error" : undefined}
      className="w-full bg-transparent px-3 py-2.5 text-ink outline-none border-0 focus:ring-0"
    />
  </div>

  {errors.whatsappNumber && (
    <p id="whatsapp-error" className="mt-1.5 text-sm text-error">
      {errors.whatsappNumber}
    </p>
  )}
</div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-ink mb-1.5">
          Address
        </label>
        <textarea
          id="address"
          rows={4}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="House name, street, city"
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "address-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition resize-none"
        />
        {errors.address && (
          <p id="address-error" className="mt-1.5 text-sm text-error">
            {errors.address}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="pincode" className="block text-sm font-medium text-ink mb-1.5">
          Pincode
        </label>
        <input
          id="pincode"
          type="tel"
          inputMode="numeric"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          placeholder="e.g. 560001"
          aria-invalid={!!errors.pincode}
          aria-describedby={errors.pincode ? "pincode-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
        />
        {errors.pincode && (
          <p id="pincode-error" className="mt-1.5 text-sm text-error">
            {errors.pincode}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gold-foil text-ink font-semibold py-3 tracking-wide hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}