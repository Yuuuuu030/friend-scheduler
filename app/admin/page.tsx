"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";

import {
  collection,
  getDocs,
} from "firebase/firestore";

type EventData = {
  inviteCode: string;
  title: string;
  participants: string[];
};

export default function AdminPage() {
  const router = useRouter();

  const [events, setEvents] =
    useState<EventData[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "events")
        );

        const data = snapshot.docs.map(
          (doc) => ({
            inviteCode: doc.id,
            ...(doc.data() as {
              title: string;
              participants: string[];
            }),
          })
        );

        setEvents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        Loading...
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
      <h1 className="text-4xl font-bold">
        Admin Dashboard
      </h1>

      <button
        onClick={() => {
          router.push("/");
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
      
      <button
        onClick={() =>
          router.push(
            "/create-event"
          )
        }
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-6"
      >
        Create Event
      </button>


      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.inviteCode}
            className="border rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold">
              {event.title}
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <span>Invite Code:</span>

              <strong>
                {event.inviteCode}
              </strong>

              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    event.inviteCode
                  );

                  alert("Invite code copied!");
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
               Copy
              </button>
            </div>

            <p className="mt-2">
              Participants:
              {" "}
              {event.participants.length}
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() =>
                  router.push(
                    `/admin/${event.inviteCode}`
                  )
                }
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Open Dashboard
              </button>

              <button
                onClick={() =>
                  router.push(
                    `/results/${event.inviteCode}`
                  )
                }
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                View Results
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}