"use client";
import { useEffect, useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";

type Row = { id: number; name: string; search_count: number };

async function fetchLeftovers(): Promise<Row[]> {
  const res = await fetch("/freq-ingrdt", { cache: "no-store" });
  if (!res.ok) throw new Error("불러오기 실패");
  return res.json();
}

async function deleteById(id: number) {
  await fetch(`/freq-ingrdt/delete/${id}`, { method: "DELETE" });
}

async function resetAll() {
  await fetch("/freq-ingrdt/reset", { method: "DELETE" });
}

export default function LeftoverList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchLeftovers();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  // 검색 시 상위 컴포넌트에서 refreshKey를 늘리면 리스트 갱신
  useEffect(() => {
    if (refreshKey > 0) load().catch(console.error);
  }, [refreshKey]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-700">자주 남는 식재료 TOP 10</h3>
        <button
          onClick={async () => {
            await resetAll();
            await load();
          }}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          <RotateCcw size={16} /> 전체 삭제
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중…</div>
        ) : (
          <ul className="grid grid-flow-col grid-rows-5 gap-2">
            {rows.map((r, idx) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{idx + 1}. {r.name} ({r.search_count})</span>
                <button
                  onClick={async () => {
                    await deleteById(r.id);
                    await load();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
