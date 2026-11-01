"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function AdminEventPage() {
  const params = useParams();
  const router = useRouter();

  const inviteCode =
    typeof params.inviteCode === "string"
      ? params.inviteCode
      : "";

  const [eventTitle, setEventTitle] =
    useState("");

  const [participants, setParticipants] =
    useState<string[]>([]);

  const [participantEditor, setParticipantEditor] =
    useState("");

  const [editingParticipants, setEditingParticipants] =
    useState(false);

  const [submittedUsers, setSubmittedUsers] =
    useState<string[]>([]);

  const [isClosed, setIsClosed] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventRef = doc(
          db,
          "events",
          inviteCode
        );

        const eventSnap =
          await getDoc(eventRef);

        if (!eventSnap.exists()) {
          alert("Event not found");

          router.push("/admin");

          return;
        }

        const eventData =
          eventSnap.data();

        setEventTitle(
          eventData.title || ""
        );

        const participantList =
          eventData.participants || [];

        setParticipants(
          participantList
        );

        setParticipantEditor(
          participantList.join("\n")
        );

        setIsClosed(
          eventData.isClosed || false
        );

        const responseSnap =
          await getDocs(
            collection(db, "responses")
          );

        const submitted =
          responseSnap.docs
            .map((doc) => doc.data())
            .filter(
              (item) =>
                item.inviteCode ===
                inviteCode
            )
            .map(
              (item) => item.name
            );

        setSubmittedUsers(submitted);
      } catch (error) {
        console.error(error);

        alert(
          "Failed to load event."
        );
      } finally {
        setLoading(false);
      }
    };

    if (inviteCode) {
      loadData();
    }
  }, [inviteCode, router]);

  if (loading) {
    return (
      <main className="p-8">
        Loading...
      </main>
    );
  }

  const submittedCount =
    submittedUsers.length;

  const totalCount =
    participants.length;

  const completionRate =
    totalCount === 0
      ? 0
      : Math.round(
          (submittedCount /
            totalCount) *
            100
        );

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            {eventTitle}
          </h1>

          <div className="mt-2 flex items-center gap-3">
            <span>
              Invite Code:
            </span>

            <strong>
              {inviteCode}
            </strong>

            <button
              onClick={async () => {
                await navigator.clipboard.writeText(
                  inviteCode
                );

                alert("Invite code copied!");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        <div
          className={`px-4 py-2 rounded text-white ${
            isClosed
              ? "bg-red-600"
              : "bg-green-600"
          }`}
        >
          {isClosed
            ? "Closed"
            : "Open"}
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-3">
          Response Rate
        </h2>

        <div className="text-4xl font-bold">
          {submittedCount}
          {" / "}
          {totalCount}
        </div>

        <div className="mt-2 text-lg">
          {completionRate}%
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Participants
        </h2>

        {!editingParticipants && (
          <button
            onClick={() =>
              setEditingParticipants(true)
            }
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Edit Participants
          </button>
        )}
      </div>

      {editingParticipants ? (
        <div className="border rounded-lg p-4 mb-10">
          <textarea
            value={participantEditor}
            onChange={(e) =>
              setParticipantEditor(
                e.target.value
              )
            }
            rows={10}
            className="w-full border rounded p-3"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={async () => {
                try {
                  const updatedParticipants =
                    participantEditor
                      .split("\n")
                      .map((p) =>
                        p.trim()
                      )
                      .filter(
                        (p) => p !== ""
                      );

                  await updateDoc(
                    doc(
                      db,
                      "events",
                      inviteCode
                    ),
                    {
                      participants:
                        updatedParticipants,
                    }
                  );

                  setParticipants(
                    updatedParticipants
                  );

                  setEditingParticipants(
                    false
                  );

                  alert(
                    "Participants updated."
                  );
                } catch (
                  error
                ) {
                  console.error(
                    error
                  );

                  alert(
                    "Failed to update participants."
                  );
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Save
            </button>

            <button
              onClick={() => {
                setParticipantEditor(
                  participants.join(
                    "\n"
                  )
                );

                setEditingParticipants(
                  false
                );
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-10">
          {participants.map(
            (participant) => {
              const submitted =
                submittedUsers.includes(
                  participant
                );

              return (
                <div
                  key={participant}
                  className="border rounded p-4"
                >
                  {submitted
                    ? "✅"
                    : "❌"}{" "}
                  {participant}
                </div>
              );
            }
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() =>
            router.push(
              `/results/${inviteCode}`
            )
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Open Results
        </button>

        <button
          onClick={async () => {
            const confirmed =
              confirm(
                "Close this event?"
              );

            if (!confirmed) {
              return;
            }

            try {
              await updateDoc(
                doc(
                  db,
                  "events",
                  inviteCode
                ),
                {
                  isClosed: true,
                }
              );

              setIsClosed(true);

              alert(
                "Event closed successfully."
              );
            } catch (error) {
              console.error(
                error
              );

              alert(
                "Failed to close event."
              );
            }
          }}
          disabled={isClosed}
          className={`px-4 py-2 rounded text-white ${
            isClosed
              ? "bg-gray-500"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isClosed
            ? "Event Closed"
            : "End Event"}
        </button>

        <button
          onClick={async () => {
            const confirmed =
              confirm(
                `Delete event "${eventTitle}"?\n\nThis cannot be undone.`
              );

            if (!confirmed) {
              return;
            }

            try {
              const responseSnap =
                await getDocs(
                  collection(
                    db,
                    "responses"
                  )
                );

              const deletions =
                responseSnap.docs
                  .filter(
                    (
                      docSnap
                    ) => {
                      const data =
                        docSnap.data();

                      return (
                        data.inviteCode ===
                        inviteCode
                      );
                    }
                  )
                  .map(
                    (
                      docSnap
                    ) =>
                      deleteDoc(
                        docSnap.ref
                      )
                  );

              await Promise.all(
                deletions
              );

              await deleteDoc(
                doc(
                  db,
                  "events",
                  inviteCode
                )
              );

              alert(
                "Event deleted successfully."
              );

              router.push(
                "/admin"
              );
            } catch (
              error
            ) {
              console.error(
                error
              );

              alert(
                "Failed to delete event."
              );
            }
          }}
          className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded"
        >
          Delete Event
        </button>

        <button
          onClick={() =>
            router.push("/admin")
          }
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          Back
        </button>
      </div>
    </main>
  );
}