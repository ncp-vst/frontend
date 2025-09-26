"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

type Row = { id: number; name: string; search_count: number };

type FetchResult = {
  rows: Row[];
  error?: string;
};

async function fetchLeftovers(): Promise<FetchResult> {
  try {
    const res = await fetch("/freq-ingrdt", { cache: "no-store" });
    if (!res.ok) {
      return {
        rows: [],
        error: `자주 검색한 식재료 목록을 불러오지 못했습니다. (status: ${res.status} ${res.statusText})`,
      };
    }

    const json = (await res.json()) as Row[];
    return { rows: json };
  } catch (error) {
    return {
      rows: [],
      error:
        error instanceof Error ? error.message : "목록을 불러오는 중 문제가 발생했습니다.",
    };
  }
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { rows: data, error } = await fetchLeftovers();
      setRows(data);
      if (error) {
        setErrorMessage(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {
      setErrorMessage("목록을 불러오는 중 문제가 발생했습니다.");
    });
  }, []);

  useEffect(() => {
    if (refreshKey > 0) {
      load().catch(() => {
        setErrorMessage("목록을 불러오는 중 문제가 발생했습니다.");
      });
    }
  }, [refreshKey]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-700">자주 검색한 식재료 TOP 10</h3>
        <button
          onClick={async () => {
            await resetAll();
            await load();
          }}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          <RotateCcw size={16} /> 전체 초기화
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중입니다...</div>
        ) : errorMessage ? (
          <div className="text-sm text-red-500">{errorMessage}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500">아직 데이터가 없습니다.</div>
        ) : (
          <ul className="grid grid-flow-col grid-rows-5 gap-2">
            {rows.map((r, idx) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{`${idx + 1}. ${r.name} (${r.search_count}회)`}</span>
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
