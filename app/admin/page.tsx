"use client";

import Link from "next/link";
import db from "@/lib/instant";

export default function AdminDashboardPage() {
  const { data } = db.useQuery({ events: {}, applications: {} });
  const events = data?.events ?? [];
  const applications = data?.applications ?? [];
  const pendingCount = applications.filter((a) => a.status === "applied").length;

  const recentEvents = [...events].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Events</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {events.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Applications</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {applications.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pending Review</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {pendingCount}
          </p>
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Events
        </h2>
        <ul className="space-y-2">
          {recentEvents.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}/applicants`}
                className="text-yc-orange hover:underline"
              >
                {event.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
