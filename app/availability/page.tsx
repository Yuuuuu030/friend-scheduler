"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

type PaintMode = "add" | "remove";
type DateInfo = {
  id: string;
  weekday: string;
  day: number;
};
export default function Availability() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [paintMode, setPaintMode] =
    useState<PaintMode>("add");
  const [dragDate, setDragDate] =
    useState("");

  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] =
    useState("");
  const [eventTitle, setEventTitle] =
    useState("");
  const [isClosed, setIsClosed] =
    useState(false);
  const [dates, setDates] =
    useState<DateInfo[]>([]);

  useEffect(() => {
    const generatedDates: DateInfo[] = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date();

      date.setDate(
        date.getDate() + i
      );

      generatedDates.push({
        id: date
          .toISOString()
          .split("T")[0],
        weekday:
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),
        day: date.getDate(),
      });
    }

    setDates(generatedDates);
    const savedName =
      localStorage.getItem("name") || "";

    const savedInviteCode =
      localStorage.getItem("inviteCode") || "";

    const savedEventTitle =
      localStorage.getItem("eventTitle") || "";

    setName(savedName);
    setInviteCode(savedInviteCode);
    setEventTitle(savedEventTitle);

    const initializePage = async () => {
      try {
        const eventRef = doc(
          db,
          "events",
          savedInviteCode
        );

        const eventSnap =
          await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData =
            eventSnap.data();

          setIsClosed(
          eventData.isClosed || false
          );
        }

        const responseRef = doc(
          db,
          "responses",
          `${savedInviteCode}_${savedName}`
        );

        const responseSnap =
          await getDoc(responseRef);

        if (responseSnap.exists()) {
          const data =
            responseSnap.data();

          setSelected(
            data.availability || []
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (
      savedName &&
      savedInviteCode
    ) {
      initializePage();
    }
  }, []);

  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);

  const hours = [
    9, 10, 11, 12,
    13, 14, 15, 16,
    17, 18, 19, 20,
    21, 22, 23,
    "overnight",
  ];

  const getHourLabel = (
    hour: number | string
  ) => {
    if (hour === "overnight") {
      return "通宵";
    }

    return `${hour}:00`;
  };

  const updateSlot = (
    slot: string,
    mode: PaintMode
  ) => {
    setSelected((prev) => {
      if (mode === "add") {
        if (prev.includes(slot)) {
          return prev;
        }

        return [...prev, slot];
      }

      return prev.filter(
        (item) => item !== slot
      );
    });
  };

  const validateSelections = () => {
    const grouped: Record<
      string,
      number[]
    > = {};

    selected.forEach((slot) => {
      const parts = slot.split("-");

      const date =
        parts.slice(0, 3).join("-");

      const value = parts[3];

      const hour =
        value === "overnight"
          ? 24
          : parseInt(value);

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(hour);
    });

    for (const date in grouped) {
      const hours = grouped[date].sort(
        (a, b) => a - b
      );

      let streak = 1;

      for (
        let i = 1;
        i <= hours.length;
        i++
      ) {
        const isConsecutive =
          i < hours.length &&
          hours[i] ===
            hours[i - 1] + 1;

        if (isConsecutive) {
          streak++;
        } else {
          const block = hours.slice(
            i - streak,
            i
          );

          const containsOvernight =
            block.includes(24);

          if (
            !containsOvernight &&
            streak < 3
          ) {
            return false;
          }

          streak = 1;
        }
      }
    }

    return true;
  };

  const renderWeek = (
    title: string,
    weekDates: typeof dates
  ) => (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-3">
        {title}
      </h2>

      <div className="inline-block border rounded-lg overflow-hidden">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="border bg-zinc-800 text-white p-3 min-w-[90px]">
                Time
              </th>

              {weekDates.map((date) => (
                <th
                  key={date.id}
                  className="border bg-zinc-800 text-white p-3 min-w-[80px]"
                >
                  <div className="font-semibold">
                    {date.weekday}
                  </div>

                  <div className="text-sm">
                    {date.day}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {hours.map((hour) => (
              <tr key={String(hour)}>
                <td className="border p-2 text-center font-medium bg-zinc-900 text-white">
                  {getHourLabel(hour)}
                </td>

                {weekDates.map((date) => {
                  const slot =
                    `${date.id}-${hour}`;

                  const isSelected =
                    selected.includes(
                      slot
                    );

                  return (
                    <td
                      key={slot}
                      onMouseDown={() => {
                        if (isClosed) {
                          return;
                        }
                        const mode =
                          isSelected
                            ? "remove"
                            : "add";

                        setDragging(true);
                        setPaintMode(mode);
                        setDragDate(date.id);

                        updateSlot(
                          slot,
                          mode
                        );
                      }}
                      onMouseEnter={() => {
                        if (isClosed) {
                          return;
                        }
                        if (!dragging)
                          return;

                        if (
                          dragDate !==
                          date.id
                        )
                          return;

                        updateSlot(
                          slot,
                          paintMode
                        );
                      }}
                      className={`
                        w-16
                        h-10
                        border
                        cursor-pointer
                        select-none
                        transition-colors
                        ${
                          isSelected
                            ? "bg-green-500"
                            : "bg-white hover:bg-green-100"
                        }
                      `}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <main
      className="p-8"
      onMouseUp={() => {
        setDragging(false);
        setDragDate("");
      }}
      onMouseLeave={() => {
        setDragging(false);
        setDragDate("");
      }}
    >
      <h1 className="text-4xl font-bold mb-2">
        {eventTitle || "Event"}
      </h1>

      {isClosed && (
        <div className="mb-6 p-4 bg-red-600 text-white rounded">
          This event has been closed.
          Availability can no longer be changed.
        </div>
      )}

      <div className="flex items-center gap-4 mb-2">
      <p>
        Logged in as:
        {" "}
        <strong>{name}</strong>
      </p>

      <button
        onClick={() => {
          localStorage.removeItem("name");
          localStorage.removeItem("inviteCode");
          localStorage.removeItem("eventTitle");

          router.push("/");
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
      >
        Logout
      </button>
    </div>

      <p className="mb-6">
        Invite Code:
        {" "}
        <strong>{inviteCode}</strong>
      </p>

      <p className="text-zinc-400 mb-8">
        每個時段至少需要連續 3 小時，
        包含「通宵」的時段則不受此限制。
      </p>

      {renderWeek("Week 1", week1)}

      {renderWeek("Week 2", week2)}

      <div className="flex gap-4">
        <div className="bg-green-600 px-4 py-2 rounded text-white">
          Selected: {selected.length}
        </div>

        <button
          disabled={isClosed}
          onClick={() =>
            setSelected([])
          }
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          Clear All
        </button>

        <button
          onClick={async () => {
            if (isClosed) {
              alert(
                "This event has been closed."
              );
              return;
            }
            if (
              !validateSelections()
            ) {
              alert(
                "每個時段至少需要連續3小時；包含通宵的時段則不受此限制。"
              );
              return;
            }

            try {
              await setDoc(
                doc(
                  db,
                  "responses",
                  `${inviteCode}_${name}`
                ),
                {
                  name,
                  inviteCode,
                  eventTitle,
                  availability: selected,
                  submittedAt:
                    new Date().toISOString(),
                }
              );

              alert(
                "Availability submitted successfully!"
              );
            } catch (error) {
              console.error(error);

              alert(
                "Failed to submit availability."
              );
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          Submit Availability
        </button>
      </div>
    </main>
  );
}