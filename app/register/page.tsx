"use client";

import { useState } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        {!isSubmitted && (
          <div className="mb-8 text-center">
            <div className="mb-5 flex justify-center">
              <img
                src="/images/Bhima.png"
                alt="Bhima Gold logo"
                className="w-full max-w-md rounded-lg border p-3 object-contain"
              />
            </div>
            <h1 className="font-display text-2xl text-ink">Claim your e-voucher</h1>
            <p className="mt-3 text-charcoal/70">
              Fill in your details once. We&apos;ll send your voucher straight to
              your WhatsApp.
            </p>
          </div>
        )}

        <RegisterForm onSubmitSuccess={() => setIsSubmitted(true)} />
      </div>
    </main>
  );
}