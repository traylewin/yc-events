"use client";

import db from "@/lib/instant";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import { formatShortDate } from "@/lib/utils";

export default function HomePage() {
  const { data, isLoading } = db.useQuery({
    events: { $: { where: { status: "published" } } },
  });
  const events = data?.events ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          Events
        </h1>
        <p className="text-gray-500 mb-8">Browse upcoming YC events</p>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yc-orange border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            No events published yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="block p-4 rounded-xl border border-gray-200 hover:border-yc-orange/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 group-hover:text-yc-orange transition-colors">
                      {event.title}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-yc-orange transition-colors"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  {(event.date || event.location) && (
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      {event.date && <span>{formatShortDate(event.date)}</span>}
                      {event.location && <span>{event.location}</span>}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
