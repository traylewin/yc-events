"use client";

import { useEffect, useState } from "react";
import db from "@/lib/instant";

type Step = "email" | "code" | "sending" | "verifying";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setStep("sending");
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStep("code");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "body" in err
          ? (err as { body?: { message?: string } }).body?.message
          : "Failed to send code";
      setError(msg || "Failed to send code");
      setStep("email");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setStep("verifying");
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "body" in err
          ? (err as { body?: { message?: string } }).body?.message
          : "Invalid code";
      setError(msg || "Invalid code");
      setStep("code");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-yc-orange rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Y</span>
          </div>
          <h2 className="text-xl font-semibold">Sign in to YC Events</h2>
          <p className="text-gray-500 text-sm mt-1">
            {step === "code"
              ? `Enter the code sent to ${email}`
              : "Enter your email to receive a sign-in code"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "email" || step === "sending" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-yc-orange/50 focus:border-yc-orange"
            />
            <button
              type="submit"
              disabled={step === "sending"}
              className="w-full bg-yc-orange text-white font-medium rounded-lg py-3 px-4 text-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {step === "sending" ? "Sending..." : "Send sign-in code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              autoFocus
              inputMode="numeric"
              className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-yc-orange/50 focus:border-yc-orange"
            />
            <button
              type="submit"
              disabled={step === "verifying"}
              className="w-full bg-yc-orange text-white font-medium rounded-lg py-3 px-4 text-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {step === "verifying" ? "Verifying..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
