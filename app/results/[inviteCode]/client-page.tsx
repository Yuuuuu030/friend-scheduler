"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

type ResponseData = {
  name: string;
  inviteCode: string;
  availability: string[];
};

type BestTimeRange = {
  label: string;
  count: number;
  length: number;
  score: number;
};

export default function ResultsPage() {
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

  const [submittedUsers, setSubmittedUsers] =
    useState<string[]>([]);

  const [bestTimes, setBestTimes] =
    useState<BestTimeRange[]>([]);

  const [slotCounter, setSlotCounter] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(true);
  
  const buildLabel = (
    startDate: string,
    startHour: number,
    endDate: string,
    endHour: number
  ) => {
    const start =
      new Date(startDate);

    const startText =
      `${start.getDate()}/${start.getMonth() + 1}`;

    if (
      endHour === 24
    ) {
      if (
        startHour === 24
      ) {
        return `${startText} Overnight`;
      }

      return `${startText} ${String(
        startHour
      ).padStart(
        2,
        "0"
      )}:00 - Overnight`;
    }

    return `${startText} ${String(
      startHour
    ).padStart(
      2,
      "0"
    )}:00 - ${String(
      endHour
    ).padStart(
      2,
      "0"
    )}:00`;
  };

  useEffect(() => {
    const loadData = async () => {
      let participantCount = 0;
      try {
        const eventRef = doc(
          db,
          "events",
          inviteCode
        );

        const eventSnap =
          await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData =
            eventSnap.data();

          participantCount =
            (
              eventData.participants || []
            ).length;

          setEventTitle(
            eventData.title || ""
          );

          setParticipants(
            eventData.participants || []
          );
        }

        const responsesSnap =
          await getDocs(
            collection(db, "responses")
          );

        const responses =
          responsesSnap.docs
            .map(
              (doc) =>
                doc.data() as ResponseData
            )
            .filter(
              (item) =>
                item.inviteCode ===
                inviteCode
            );

        setSubmittedUsers(
          responses.map(
            (item) => item.name
          )
        );

        const counter: Record<
          string,
          number
        > = {};

        responses.forEach(
          (response) => {
            (
              response.availability || []
            ).forEach((slot) => {
              counter[slot] =
                (counter[slot] || 0) + 1;
            });
          }
        );

        setSlotCounter(counter);
        const ranges: BestTimeRange[] = [];

          type SlotInfo = {
            date: string;
            hour: number;
            count: number;
          };

        const allSlots: SlotInfo[] = [];

        Object.entries(counter).forEach(
          ([slot, count]) => {
            const parts =
              slot.split("-");

            const date =
              parts.slice(0, 3).join("-");

            const value =
              parts[3];

            const hour =
              value === "overnight"
                ? 24
                : Number(value);

            allSlots.push({
              date,
              hour,
              count,
            });
          }
        );

        allSlots.sort((a, b) => {
          const dateDiff =
            new Date(a.date).getTime() -
            new Date(b.date).getTime();

          if (dateDiff !== 0) {
            return dateDiff;
          }

          return a.hour - b.hour;
        });

        for (
          let targetCount = participantCount;
          targetCount >= 1;
          targetCount--
        ) {
          let start = -1;

          for (
            let i = 0;
            i <= allSlots.length;
            i++
          ) {
            let valid = false;

            if (
              i < allSlots.length &&
              allSlots[i].count >= targetCount
            ) {
              if (start === -1) {
                valid = true;
              } else {
                const previous =
                  allSlots[i - 1];

                const current =
                  allSlots[i];

                const sameDayConsecutive =
                  current.date === previous.date &&
                  (
                    current.hour ===
                      previous.hour + 1 ||
                    (
                      previous.hour === 23 &&
                      current.hour === 24
                    )
                  );

                const overnightToNextDay =
                  previous.hour === 24 &&
                  current.hour === 9 &&
                  (
                    new Date(
                      current.date
                    ).getTime() -
                    new Date(
                      previous.date
                    ).getTime()
                  ) === 86400000;

                valid =
                  sameDayConsecutive ||
                  overnightToNextDay;
              }
            }

            if (
              valid &&
              start === -1
            ) {
              start = i;
            }

            if (
              (!valid ||
                i === allSlots.length) &&
              start !== -1
            ) {
              const end = i - 1;

              const startSlot =
                allSlots[start];

              const endSlot =
                allSlots[end];

              let length = 0;

              for (
                let j = start;
                j <= end;
                j++
              ) {
                length +=
                  allSlots[j].hour === 24
                    ? 8
                    : 1;
              }

              const slotCount =
                end - start + 1;

              const containsOvernight =
                startSlot.hour === 24 ||
                endSlot.hour === 24;

              const qualifies =
                slotCount >= 3 ||
                containsOvernight;

              if (qualifies) {
                const startDate =
                  new Date(
                    startSlot.date
                  );

                const endDate =
                  new Date(
                    endSlot.date
                  );
        
                const startText =
                  `${startDate.getDate()}/${startDate.getMonth() + 1}`;
        
                const endText =
                  `${endDate.getDate()}/${endDate.getMonth() + 1}`;
        
                let label = "";
        
                if (
                  startSlot.date === endSlot.date
                ) {
                  label =
                    buildLabel(
                      startSlot.date,
                      startSlot.hour,
                      endSlot.date,
                      endSlot.hour
                    );
                } else {
                  const startHourText =
                    startSlot.hour === 24
                      ? "Overnight"
                      : `${String(
                          startSlot.hour
                        ).padStart(2, "0")}:00`;
        
                  const endHourText =
                    endSlot.hour === 24
                      ? "Overnight"
                      : `${String(
                          endSlot.hour
                        ).padStart(2, "0")}:00`;
        
                  label =
                    `${startText} ${startHourText} - ${endText} ${endHourText}`;
                }
        
                ranges.push({
                  label,
                  count: targetCount,
                  length,
                  score:
                    targetCount * 1000 +
                    length,
                });
              }
        
              start = -1;
              if (
                i < allSlots.length &&
                allSlots[i].count >= targetCount
              ) {
                start = i;
              }
            }
          }
        }

        ranges.sort((a, b) => {
          if (b.count !== a.count) {
            return (
              b.count - a.count
            );
          }

          return (
            b.length - a.length
          );
        });

        const uniqueRanges =
          ranges.filter(
            (item, index, arr) =>
              index ===
              arr.findIndex(
                (x) =>
                  x.label === item.label
              )
          );

        setBestTimes(
          uniqueRanges.slice(0, 3)
        );

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (inviteCode) {
      loadData();
    }
  }, [inviteCode]);

  const heatmapDates =
    useMemo(() => {
      const dates =
        new Set<string>();

      Object.keys(
        slotCounter
      ).forEach((slot) => {
        const parts =
          slot.split("-");

        dates.add(
          parts
            .slice(0, 3)
            .join("-")
        );
      });

      return Array.from(
        dates
      ).sort();
    }, [slotCounter]);

  const heatmapHours = [
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "overnight",
  ];

  const getCellClass = (
    count: number
  ) => {
    if (count === 0)
      return "bg-gray-200 text-black";

    if (count === 1)
      return "bg-green-200 text-black";

    if (count === 2)
      return "bg-green-500 text-white";

    return "bg-green-800 text-white";
  };

  const getCount = (
    date: string,
    hour: string
  ) => {
    const key =
      hour === "overnight"
        ? `${date}-overnight`
        : `${date}-${Number(hour)}`;

    return (
      slotCounter[key] || 0
    );
  };

  if (loading) {
    return (
      <main className="p-8">
        Loading...
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">
          {eventTitle}
        </h1>

        <button
          onClick={() =>
            router.push(
              `/admin/${inviteCode}`
            )
          }
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          ← Event Dashboard
        </button>
      </div>

      <p className="mb-8">
        Invite Code:{" "}
        <strong>
          {inviteCode}
        </strong>
      </p>

      <h2 className="text-2xl font-bold mb-4">
        Participants
      </h2>

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

      <h2 className="text-2xl font-bold mb-4">
        🏆 Top 3 Recommendations
      </h2>

      <div className="space-y-3 mb-12">
        {bestTimes
          .slice(0, 3)
          .map((item, index) => (
            <div
              key={
                item.label +
                index
              }
              className="border rounded p-4"
            >
              <div className="font-bold text-lg">
                {index === 0
                  ? "🏆 #1"
                  : index === 1
                  ? "🥈 #2"
                  : "🥉 #3"}
              </div>

              <div className="mt-2 text-lg">
                {item.label}
              </div>

              <div>
                {item.count}/
                {
                  participants.length
                }{" "}
                available
              </div>

              <div className="text-sm text-zinc-500">
                {item.length} hours
              </div>
            </div>
          ))}

        {bestTimes.length === 0 && (
          <div className="border rounded p-4">
            No common
            availability found.
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4">
        🔥 Heatmap
      </h2>

      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-200 border" />
          0人
        </div>

        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-200 border" />
          1人
        </div>

        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 border" />
          2人
        </div>

        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-800 border" />
          3+人
        </div>
      </div>

      <div className="overflow-auto mb-12">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-zinc-800 text-white">
                Time
              </th>

              {heatmapDates.map(
                (date) => (
                  <th
                    key={date}
                    className="border p-2 bg-zinc-800 text-white"
                  >
                    {date}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {heatmapHours.map(
              (hour) => (
                <tr key={hour}>
                  <td className="border p-2 font-medium">
                    {hour ===
                    "overnight"
                      ? "通宵"
                      : `${hour}:00`}
                  </td>

                  {heatmapDates.map(
                    (date) => {
                      const count =
                        getCount(
                          date,
                          hour
                        );

                      return (
                        <td
                          key={`${date}-${hour}`}
                          className={`border p-3 text-center font-bold ${getCellClass(
                            count
                          )}`}
                        >
                          {count}
                        </td>
                      );
                    }
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-4">
        <p>
          Submitted:{" "}
          <strong>
            {
              submittedUsers.length
            }
          </strong>
        </p>

        <p>
          Total Participants:{" "}
          <strong>
            {
              participants.length
            }
          </strong>
        </p>
      </div>
    </main>
  );
}