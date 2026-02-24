"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { id, tx } from "@instantdb/react";
import db from "@/lib/instant";
import { slugify } from "@/lib/utils";

type QuestionItem = {
  id: string;
  questionText: string;
  required: boolean;
  order: number;
};

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("draft");
  const [eventAttendeeSelectionParams, setEventAttendeeSelectionParams] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [criteriaTexts, setCriteriaTexts] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState("");
  const [saving, setSaving] = useState(false);

  const slug = slugify(title) || "(enter title)";

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: id(),
        questionText: "",
        required: false,
        order: prev.length,
      },
    ]);
  }

  function updateQuestion(qId: string, updates: Partial<QuestionItem>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updates } : q))
    );
  }

  function removeQuestion(qId: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  }

  function moveQuestion(qId: string, direction: "up" | "down") {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === qId);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy.map((q, i) => ({ ...q, order: i }));
    });
  }

  function addCriterion() {
    if (!newCriterion.trim()) return;
    setCriteriaTexts((prev) => [...prev, newCriterion.trim()]);
    setNewCriterion("");
  }

  function removeCriterion(idx: number) {
    setCriteriaTexts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const eventId = id();
    const now = new Date().toISOString();
    const eventSlug = slugify(title) || id().slice(0, 8);

    const txs = [
      tx.events[eventId].update({
        slug: eventSlug,
        title: title.trim(),
        description: description.trim() || undefined,
        date: date ? new Date(date).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location: location.trim() || undefined,
        status,
        eventAttendeeSelectionParams: eventAttendeeSelectionParams.trim() || undefined,
        createdAt: now,
      }),
      ...questions
        .filter((q) => q.questionText.trim())
        .map((q, i) =>
          tx.eventQuestions[id()]
            .update({
              questionText: q.questionText.trim(),
              required: q.required,
              order: i,
            })
            .link({ event: eventId })
        ),
      ...criteriaTexts
        .filter((t) => t.trim())
        .map((t) =>
          tx.eventCriteria[id()]
            .update({ text: t.trim() })
            .link({ event: eventId })
        ),
    ];

    try {
      await db.transact(txs);
      router.push("/admin/events");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Create Event</h1>
      <form onSubmit={handleSave}>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Slug: {slug}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Attendee Selection Params
              </label>
              <textarea
                value={eventAttendeeSelectionParams}
                onChange={(e) => setEventAttendeeSelectionParams(e.target.value)}
                rows={4}
                placeholder="Internal criteria for selecting attendees..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
              />
              <p className="mt-1 text-xs text-gray-400">Admin only — not shown on the event page.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Selection Criteria
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {criteriaTexts.map((text, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                  >
                    {text}
                    <button
                      type="button"
                      onClick={() => removeCriterion(idx)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-purple-200"
                      aria-label={`Remove ${text}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addCriterion(); }
                  }}
                  placeholder="Add a criterion (e.g. AI/ML engineers)…"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
                />
                <button
                  type="button"
                  onClick={addCriterion}
                  disabled={!newCriterion.trim()}
                  className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Each criterion becomes a searchable filter pill on the applicants page.</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="rounded-md bg-yc-orange px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Add Question
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <textarea
                    value={q.questionText}
                    onChange={(e) =>
                      updateQuestion(q.id, { questionText: e.target.value })
                    }
                    placeholder="Question text"
                    rows={2}
                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          updateQuestion(q.id, { required: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      Required
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(q.id, "up")}
                        disabled={q.order === 0}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                        aria-label="Move up"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(q.id, "down")}
                        disabled={q.order === questions.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                        aria-label="Move down"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-yc-orange px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
