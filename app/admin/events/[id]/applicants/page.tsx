"use client";

import { useParams } from "next/navigation";
import React, { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { tx } from "@instantdb/react";
import db from "@/lib/instant";

const statusStyles: Record<
  string,
  { bg: string; text: string }
> = {
  applied: { bg: "bg-blue-100", text: "text-blue-800" },
  confirmed: { bg: "bg-green-100", text: "text-green-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
};

type Application = {
  id: string;
  status: string;
  internalNotes?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    linkedin?: string;
    location?: string;
    currentTitleAndCompany?: string;
    priorTitleAndCompany?: string;
    schoolAndDegree?: string;
  };
  answers?: Array<{
    id: string;
    answerText: string;
    question?: { questionText?: string };
  }>;
};

function matchesSearch(app: Application, search: string): boolean {
  if (!search.trim()) return true;
  const s = search.toLowerCase();
  const name = [app.user?.firstName, app.user?.lastName].filter(Boolean).join(" ");
  const fields = [
    name,
    app.user?.email,
    app.user?.location,
    app.user?.currentTitleAndCompany,
    app.user?.priorTitleAndCompany,
    app.user?.schoolAndDegree,
    ...(app.answers ?? []).map((a) => a.answerText),
  ].filter(Boolean);
  return fields.some((f) => String(f).toLowerCase().includes(s));
}

export default function ApplicantsPage() {
  const params = useParams();
  const eventId = typeof params.id === "string" ? params.id : params.id?.[0];

  const { data, isLoading } = db.useQuery(
    eventId
      ? {
          events: {
            $: { where: { id: eventId } },
            questions: {},
            criteria: {},
            applications: { user: {}, answers: { question: {} } },
          },
        }
      : null
  );

  const event = data?.events?.[0];
  const applications = (event?.applications ?? []) as Application[];
  const criteriaItems = (event?.criteria ?? []) as Array<{ id: string; text: string }>;
  const questions = (event?.questions ?? []).sort(
    (a: { order?: number }, b: { order?: number }) =>
      (a.order ?? 0) - (b.order ?? 0)
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [activeCriterion, setActiveCriterion] = useState<string | null>(null);
  const [loadingCriterion, setLoadingCriterion] = useState<string | null>(null);
  const scoreCacheRef = useRef<Map<string, Map<string, number>>>(new Map());

  const userIdToAppId = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of applications) {
      if (app.user?.id) map.set(app.user.id, app.id);
    }
    return map;
  }, [applications]);

  const appScores = useMemo(() => {
    if (!activeCriterion) return new Map<string, number>();
    const cached = scoreCacheRef.current.get(activeCriterion);
    if (!cached) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const [userId, score] of cached) {
      const appId = userIdToAppId.get(userId);
      if (appId) map.set(appId, score);
    }
    return map;
  }, [activeCriterion, userIdToAppId]);

  const fetchScores = useCallback(async (text: string) => {
    if (scoreCacheRef.current.has(text)) return;
    setLoadingCriterion(text);
    try {
      const res = await fetch("/api/suggest-attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) return;
      const { suggestions } = (await res.json()) as {
        suggestions: Array<{ userId: string; score: number }>;
      };
      const map = new Map<string, number>();
      for (const s of suggestions) map.set(s.userId, s.score);
      scoreCacheRef.current.set(text, map);
    } catch (err) {
      console.error("Suggest attendees failed:", err);
    } finally {
      setLoadingCriterion(null);
    }
  }, []);

  async function handleCriterionClick(text: string) {
    if (activeCriterion === text) {
      setActiveCriterion(null);
      return;
    }
    if (!scoreCacheRef.current.has(text)) {
      await fetchScores(text);
    }
    setActiveCriterion(text);
  }

  const filtered = useMemo(() => {
    let list = applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      return matchesSearch(app, search);
    });
    if (activeCriterion && appScores.size > 0) {
      list = [...list].sort(
        (a, b) => (appScores.get(b.id) ?? 0) - (appScores.get(a.id) ?? 0),
      );
    }
    return list;
  }, [applications, statusFilter, search, activeCriterion, appScores]);

  const tabCounts = useMemo(() => {
    const match = (a: Application) => matchesSearch(a, search);
    return {
      all: applications.filter(match).length,
      applied: applications.filter((a) => a.status === "applied" && match(a)).length,
      confirmed: applications.filter((a) => a.status === "confirmed" && match(a)).length,
      rejected: applications.filter((a) => a.status === "rejected" && match(a)).length,
    };
  }, [applications, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((a) => a.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function confirmSelected() {
    const txs = [...selected].map((appId) =>
      tx.applications[appId].update({
        status: "confirmed",
        reviewedAt: new Date().toISOString(),
      })
    );
    await db.transact(txs);
    deselectAll();
  }

  async function rejectSelected() {
    const txs = [...selected].map((appId) =>
      tx.applications[appId].update({
        status: "rejected",
        reviewedAt: new Date().toISOString(),
      })
    );
    await db.transact(txs);
    deselectAll();
  }

  async function confirmOne(appId: string) {
    await db.transact(
      tx.applications[appId].update({
        status: "confirmed",
        reviewedAt: new Date().toISOString(),
      })
    );
    setExpandedId(null);
  }

  async function rejectOne(appId: string) {
    await db.transact(
      tx.applications[appId].update({
        status: "rejected",
        reviewedAt: new Date().toISOString(),
      })
    );
    setExpandedId(null);
  }

  async function saveNotes(appId: string, value: string) {
    await db.transact(
      tx.applications[appId].update({ internalNotes: value })
    );
  }

  if (isLoading || !eventId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-yc-orange" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  const name = (app: Application) =>
    [app.user?.firstName, app.user?.lastName].filter(Boolean).join(" ") ||
    app.user?.email ||
    "—";

  return (
    <div className="p-8">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/admin/events" className="text-yc-orange hover:underline">
          Events
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{event.title}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{event.title}</h1>
      <div className="mb-6 flex gap-6">
        <span className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {applications.filter((a) => a.status === "applied").length}
          </span>{" "}
          applied
        </span>
        <span className="text-sm text-gray-600">
          <span className="font-medium text-green-700">
            {applications.filter((a) => a.status === "confirmed").length}
          </span>{" "}
          confirmed
        </span>
        <span className="text-sm text-gray-600">
          <span className="font-medium text-red-700">
            {applications.filter((a) => a.status === "rejected").length}
          </span>{" "}
          rejected
        </span>
      </div>

      {criteriaItems.length > 0 && (
        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-700">
            Selection Criteria
          </p>
          <div className="flex flex-wrap gap-2">
            {criteriaItems.map((c) => {
              const isActive = activeCriterion === c.text;
              const isLoading = loadingCriterion === c.text;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCriterionClick(c.text)}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100"
                  } disabled:opacity-60`}
                >
                  {isLoading && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                  )}
                  {c.text}
                </button>
              );
            })}
          </div>
          {activeCriterion && (
            <p className="mt-2 text-xs text-purple-600">
              Sorted by relevance to &ldquo;{activeCriterion}&rdquo; &middot;{" "}
              <button
                onClick={() => setActiveCriterion(null)}
                className="underline hover:text-purple-800"
              >
                Clear filter
              </button>
            </p>
          )}
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All", count: tabCounts.all },
          { key: "applied", label: "Applied", count: tabCounts.applied },
          { key: "confirmed", label: "Confirmed", count: tabCounts.confirmed },
          { key: "rejected", label: "Rejected", count: tabCounts.rejected },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              statusFilter === key
                ? "bg-yc-orange text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">
            {selected.size} selected
          </span>
          <button
            onClick={confirmSelected}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Confirm Selected
          </button>
          <button
            onClick={rejectSelected}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Reject Selected
          </button>
          <button
            onClick={deselectAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Deselect All
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3" />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              {activeCriterion && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Score
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((app) => {
              const style = statusStyles[app.status] ?? statusStyles.applied;
              const isExpanded = expandedId === app.id;
              return (
                <React.Fragment key={app.id}>
                  <tr
                    key={app.id}
                    onClick={() =>
                      setExpandedId((prev) => (prev === app.id ? null : app.id))
                    }
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="h-[18px] w-[18px] rounded border-gray-300"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                      {name(app)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {app.user?.email ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {app.user?.location ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {app.user?.currentTitleAndCompany ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    {activeCriterion && (
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-600">
                        {appScores.has(app.id)
                          ? `${(appScores.get(app.id)! * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {app.status === "applied" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmOne(app.id)}
                            className="rounded p-1 text-green-600 hover:bg-green-50"
                            aria-label="Confirm"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => rejectOne(app.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            aria-label="Reject"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={activeCriterion ? 8 : 7} className="bg-gray-50 p-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">
                              Profile
                            </h3>
                            <dl className="space-y-2 text-sm">
                              {app.user?.linkedin && (
                                <div>
                                  <dt className="text-gray-500">LinkedIn</dt>
                                  <dd>
                                    <a
                                      href={app.user.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-yc-orange hover:underline"
                                    >
                                      {app.user.linkedin}
                                    </a>
                                  </dd>
                                </div>
                              )}
                              {app.user?.priorTitleAndCompany && (
                                <div>
                                  <dt className="text-gray-500">Prior Title</dt>
                                  <dd className="text-gray-900">
                                    {app.user.priorTitleAndCompany}
                                  </dd>
                                </div>
                              )}
                              {app.user?.schoolAndDegree && (
                                <div>
                                  <dt className="text-gray-500">School</dt>
                                  <dd className="text-gray-900">
                                    {app.user.schoolAndDegree}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">
                              Application Answers
                            </h3>
                            <div className="space-y-3">
                              {[...(app.answers ?? [])]
                                .sort((a, b) => {
                                  const qid = (x: typeof a) =>
                                    (x.question as { id?: string } | undefined)?.id ?? "";
                                  const ai = questions.findIndex(
                                    (q: { id: string }) => q.id === qid(a)
                                  );
                                  const bi = questions.findIndex(
                                    (q: { id: string }) => q.id === qid(b)
                                  );
                                  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                                })
                                .map((ans) => (
                                  <div key={ans.id}>
                                    <p className="text-xs font-medium text-gray-500">
                                      {ans.question?.questionText ?? "—"}
                                    </p>
                                    <p className="text-sm text-gray-900">
                                      {ans.answerText || "—"}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Internal Notes
                          </label>
                          <textarea
                            defaultValue={app.internalNotes ?? ""}
                            onBlur={(e) =>
                              saveNotes(app.id, e.target.value)
                            }
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yc-orange focus:outline-none focus:ring-1 focus:ring-yc-orange"
                          />
                        </div>
                        {app.status === "applied" && (
                          <div className="mt-6 flex gap-4">
                            <button
                              onClick={() => confirmOne(app.id)}
                              className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => rejectOne(app.id)}
                              className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
