"use client";

import Link from "next/link";
import db from "@/lib/instant";

const statusStyles: Record<
  string,
  { bg: string; text: string }
> = {
  published: { bg: "bg-green-100", text: "text-green-800" },
  draft: { bg: "bg-gray-100", text: "text-gray-800" },
  closed: { bg: "bg-yellow-100", text: "text-yellow-800" },
  archived: { bg: "bg-gray-100", text: "text-gray-500" },
};

export default function AdminEventsPage() {
  const { data } = db.useQuery({ events: { applications: {} } });
  const events = data?.events ?? [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-md bg-yc-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Create Event
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Public Link
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Applicants
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {events.map((event) => {
              const style = statusStyles[event.status] ?? statusStyles.draft;
              const applicantCount = event.applications?.length ?? 0;
              return (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="text-yc-orange hover:underline"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {event.date ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {event.location ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <a
                      href={`/events/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-yc-orange hover:underline"
                    >
                      /events/{event.slug}
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/events/${event.id}/applicants`}
                      className="text-yc-orange hover:underline"
                    >
                      {applicantCount}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
