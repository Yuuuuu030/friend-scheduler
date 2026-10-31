"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CreateEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [participantsText, setParticipantsText] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [createdCode, setCreatedCode] =
    useState("");

  const generateCode = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
      code +=
        chars[
          Math.floor(
            Math.random() * chars.length
          )
        ];
    }

    return code;
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Please enter event name");
      return;
    }

    const participants =
      participantsText
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p !== "");

    if (participants.length === 0) {
      alert(
        "Please enter participants"
      );
      return;
    }

    try {
      setLoading(true);

      let inviteCode =
        generateCode();

      await setDoc(
        doc(
          db,
          "events",
          inviteCode
        ),
        {
          title,
          participants,
          createdAt:
            new Date().toISOString(),
        }
      );

      router.back();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to create event."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">
          Create Event
        </h1>

        <button
          onClick={() => router.back()}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block mb-2 font-semibold">
            Event Name
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            placeholder="mahjong"
            className="w-full border rounded p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Participants
          </label>

          <textarea
            value={
              participantsText
            }
            onChange={(e) =>
              setParticipantsText(
                e.target.value
              )
            }
            placeholder={`One participant per line`}
            rows={8}
            className="w-full border rounded p-3"
          />
        </div>

        <button
          onClick={
            handleCreate
          }
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          {loading
            ? "Creating..."
            : "Create Event"}
        </button>
      </div>
    </main>
  );
}