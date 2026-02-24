"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { id, tx } from "@instantdb/react";
import db from "@/lib/instant";
import { useProfile } from "@/lib/useProfile";
import Navbar from "@/app/components/Navbar";
import LoginModal from "@/app/components/LoginModal";

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function EventPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const { user, profile, isLoading: profileLoading } = useProfile();
  const authEmail = user?.email ?? "";

  const { data: eventData, isLoading: eventLoading } = db.useQuery(
    slug ? { events: { $: { where: { slug } }, questions: {} } } : null
  );

  const { data: userData } = db.useQuery(
    authEmail
      ? {
          users: {
            $: { where: { email: authEmail } },
            applications: { event: {} },
          },
        }
      : null
  );

  const [showLogin, setShowLogin] = useState(false);
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const event = eventData?.events?.[0];
  const userProfile = userData?.users?.[0];
  const existingApplication = userProfile?.applications?.find(
    (a: { event?: { slug?: string } }) => a.event?.slug === slug
  );

  useEffect(() => {
    if (profile) {
      setName(
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
          authEmail.split("@")[0] ||
          ""
      );
      setEmail(profile.email || authEmail || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (event?.questions) {
      setAnswers((prev) => {
        const next = { ...prev };
        for (const q of event.questions) {
          if (!(q.id in next)) next[q.id] = "";
        }
        return next;
      });
    }
  }, [event?.questions]);

  const questions = event?.questions
    ? [...event.questions].sort(
        (a: { order?: number }, b: { order?: number }) =>
          (a.order ?? 0) - (b.order ?? 0)
      )
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !profile || existingApplication || submitting) return;
    if (!name.trim() || !email.trim()) return;

    const requiredQuestions = questions.filter((q: { required?: boolean }) => q.required);
    const missing = requiredQuestions.filter(
      (q: { id: string }) => !answers[q.id]?.trim()
    );
    if (missing.length > 0) return;

    setSubmitting(true);
    const appId = id();
    const now = new Date().toISOString();

    const txs = [
      tx.applications[appId]
        .update({ status: "applied", createdAt: now })
        .link({ user: profile.id, event: event.id }),
      ...questions.map((q: { id: string }) => {
        const answerId = id();
        return tx.applicationAnswers[answerId]
          .update({ answerText: answers[q.id] ?? "" })
          .link({ application: appId, question: q.id });
      }),
    ];

    try {
      await db.transact(txs);
    } finally {
      setSubmitting(false);
    }
  }

  if (eventLoading || !slug) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Event not found</div>
      </div>
    );
  }

  return (
    <>
      <Navbar transparent={true} />
      <div className="min-h-screen bg-white">
        <section
          className="relative overflow-hidden min-h-[420px] flex flex-col items-center justify-center text-center px-6 pt-24"
          style={{
            background:
              "linear-gradient(135deg, #1B1340 0%, #2D1B69 40%, #3D2580 60%, #1B1340 100%)",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 320,
              height: 320,
              top: -60,
              left: -80,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 200,
              height: 200,
              top: 40,
              right: "10%",
              background: "rgba(255,255,255,0.04)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              bottom: -120,
              right: -60,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              top: 60,
              left: "20%",
              background: "rgba(255,255,255,0.05)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 80,
              height: 80,
              bottom: 40,
              left: "30%",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 260,
              height: 260,
              top: 20,
              right: "30%",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          />

          <div className="relative z-10">
            <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-white/90 text-sm">
              {event.date && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{formatDate(event.date)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-10 sm:p-12">
            <p className="text-yc-orange text-xs font-medium tracking-widest uppercase text-center mb-2">
              ABOUT
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-6">
              {event.title}
            </h2>
            {event.description && (
              <div className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            )}
          </div>
        </div>

        <section className="mt-8 pb-24 bg-yc-peach">
          <div className="max-w-2xl mx-auto px-4 py-12">
            {!user ? (
              <div className="bg-white rounded-xl shadow-sm p-8 sm:p-10 text-center">
                <h3 className="text-xl font-bold mb-2">Request a spot</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Sign in to apply for this event.
                </p>
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-yc-orange text-white font-medium px-8 py-3 rounded-full hover:bg-orange-600 transition-colors"
                >
                  Sign in with Google
                </button>
              </div>
            ) : existingApplication ? (
              <div className="bg-white rounded-xl shadow-sm p-8 sm:p-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium text-sm mb-4">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {existingApplication.status}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Your application has been submitted!
                </h3>
                <p className="text-gray-500 text-sm">
                  We&apos;ll reach out with details if we&apos;re able to confirm
                  your attendance.
                </p>
              </div>
            ) : profileLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 sm:p-10 text-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-sm p-8 sm:p-10"
              >
                <h3 className="text-xl font-bold mb-1">Request a spot</h3>
                <p className="text-gray-500 text-sm mb-6">
                  We&apos;ll reach out with details if we&apos;re able to
                  confirm your attendance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Your name <span className="text-red-500">*</span>
                    </label>
                    {editName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yc-orange/50 focus:border-yc-orange"
                        />
                        <button
                          type="button"
                          onClick={() => setEditName(false)}
                          className="text-blue-500 text-sm hover:underline"
                        >
                          (done)
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{name || "—"}</span>
                        <button
                          type="button"
                          onClick={() => setEditName(true)}
                          className="text-blue-500 text-sm hover:underline"
                        >
                          (edit)
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Your email <span className="text-red-500">*</span>
                    </label>
                    {editEmail ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yc-orange/50 focus:border-yc-orange"
                        />
                        <button
                          type="button"
                          onClick={() => setEditEmail(false)}
                          className="text-blue-500 text-sm hover:underline"
                        >
                          (done)
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{email || "—"}</span>
                        <button
                          type="button"
                          onClick={() => setEditEmail(true)}
                          className="text-blue-500 text-sm hover:underline"
                        >
                          (edit)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5 mb-8">
                  {questions.map((q: { id: string; questionText: string; required?: boolean }) => (
                    <div key={q.id}>
                      <label className="block text-sm text-gray-700 mb-1">
                        {q.questionText}{" "}
                        {q.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <textarea
                        rows={3}
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yc-orange/50 focus:border-yc-orange resize-y"
                      />
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-yc-orange text-white font-medium px-8 py-3 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Request a spot"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
