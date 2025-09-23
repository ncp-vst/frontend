"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type Props = {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
};

async function incrementLeftovers(names: string[]) {
  if (!names.length) return;
  await fetch("/api-server/freq-ingrdt/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });
}

function parseIngredients(q: string): string[] {
  return q
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

export default function RecipeSearchForm({
  onSearch,
  placeholder = "예: 양파, 계란, 당근...",
  initialValue = "",
  className = "",
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const submit = async () => {
    const query = value.trim();

    if (!query) {
      onSearch("");
      setValue("");
      return;
    }

    const ingredients = parseIngredients(query);
    await incrementLeftovers(ingredients);
    onSearch(query);
    setValue("");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={placeholder}
        className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
      <button
        onClick={submit}
        className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2 text-white shadow-sm hover:bg-orange-600"
      >
        <Search size={16} /> 요리 찾기
      </button>
    </div>
  );
}
