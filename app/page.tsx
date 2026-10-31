"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {
    if (
      name.trim() === "Yu" &&
      inviteCode.trim() === "mahjongmaster"
    ) {
      router.push("/admin");
      return;
    }
    const cleanName = name.trim();
    const cleanCode =
      inviteCode.trim().toUpperCase();

    if (!cleanName) {
      alert("Please enter your name.");
      return;
    }

    if (!cleanCode) {
      alert("Please enter an invite code.");
      return;
    }

    try {
      setLoading(true);

      const eventRef = doc(
        db,
        "events",
        cleanCode
      );

      const eventSnap =
        await getDoc(eventRef);

      if (!eventSnap.exists()) {
        alert("Invalid invite code.");
        return;
      }

      const eventData =
        eventSnap.data();

      const participants =
        eventData.participants || [];

      const invited =
        participants.includes(
          cleanName
        );

      if (!invited) {
        alert(
          "You are not invited to this event."
        );
        return;
      }

      localStorage.setItem(
        "name",
        cleanName
      );

      localStorage.setItem(
        "inviteCode",
        cleanCode
      );

      localStorage.setItem(
        "eventTitle",
        eventData.title || ""
      );

      router.push("/availability");
    } catch (error) {
      console.error(error);

      alert(
        "Failed to verify invite."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border p-6 shadow">
        <h1 className="mb-6 text-4xl font-bold">
          Friend Scheduler
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full rounded border p-3"
          />

          <input
            type="text"
            placeholder="Invite Code"
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(
                e.target.value
              )
            }
            className="w-full rounded border p-3"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:bg-gray-500"
          >
            {loading
              ? "Checking..."
              : "Enter"}
          </button>
        </div>
      </div>
    </main>
  );
}