"use client";
import { useState, useEffect } from "react";
import { Trash2, PlusCircle, RotateCcw } from "lucide-react";

const defaultLeftovers = [
  "양파", "대파", "당근", "계란", "미나리",
  "감자", "표고버섯", "햄", "브로콜리", "치즈"
];
/*
async function fetchLeftovers(): Promise<string[]> {
  const res = await fetch("/api/leftovers");
  if (!res.ok) throw new Error("불러오기 실패");
  return res.json();
}

async function addLeftover(name: string) {
  await fetch("/api/leftovers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

async function deleteLeftover(id: number) {
  await fetch(`/api/leftovers/${id}`, { method: "DELETE" });
}

async function resetLeftovers() {
  await fetch("/api/leftovers/reset", { method: "POST" });
}

export default function LeftoverList() {
  const [leftovers, setLeftovers] = useState<{ id: number; name: string }[]>([]);
  const [newItem, setNewItem] = useState("");

  // 최초 로드 시 DB에서 불러오기
  useEffect(() => {
    fetchLeftovers().then(setLeftovers).catch(console.error);
  }, []);
*/
export default function LeftoverList() {
  const [leftovers, setLeftovers] = useState<string[]>(() => {
    const saved = localStorage.getItem("leftovers");
    return saved ? JSON.parse(saved) : defaultLeftovers;
  });
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    localStorage.setItem("leftovers", JSON.stringify(leftovers));
  }, [leftovers]);

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">자주 남는 식재료 TOP 10</h3>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            localStorage.removeItem("leftovers");
            setLeftovers(defaultLeftovers);
          }}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          <RotateCcw size={16} /> 리셋
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <ul className="grid grid-flow-col grid-rows-5 gap-2">
          {leftovers.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{idx + 1}. {item}</span>
              <button
                onClick={() => setLeftovers((prev) => prev.filter((_, i) => i !== idx))}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                <Trash2 size={14} /> 삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
