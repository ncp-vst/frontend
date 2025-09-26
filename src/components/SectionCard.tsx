"use client";
import { ChefHat, Star, StarHalf } from "lucide-react";
import React from "react";

export type Recipe = {
  id?: number;
  name?: string;
  cuisine?: string;
  time?: number;
  level?: string;
  rating?: number;
};

export type FreqIngredient = {
  id: number;
  name: string;
  search_count: number;
};

function Rating({ value }: { value?: number }) {
  const hasValidValue = typeof value === "number" && Number.isFinite(value) && value >= 0;
  const safeValue = hasValidValue ? value : 0;
  const full = Math.floor(safeValue);
  const half = safeValue - full >= 0.5;

  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} size={16} fill="currentColor" />
      ))}
      {half && <StarHalf size={16} fill="currentColor" />}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <Star key={`e-${i}`} size={16} className="text-gray-300" />
      ))}
      <span className="ml-1 text-xs text-gray-500">{hasValidValue ? safeValue.toFixed(1) : "-"}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-gray-600">
      {children}
    </span>
  );
}

export default function SectionCard({
  recipe,
  freqIngredients = [],
}: {
  recipe: Recipe;
  freqIngredients?: FreqIngredient[];
}) {
  const topIngredients = freqIngredients.slice(0, 3);

  return (
    <div className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
        <ChefHat className="text-orange-500" size={18} />
        추천 레시피
      </div>

      {topIngredients.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-xs font-medium text-gray-400">자주 검색한 식재료</div>
          <div className="flex flex-wrap gap-2">
            {topIngredients.map((item) => (
              <Pill key={item.id}>
                <span>{item.name}</span>
                <span className="text-[10px] text-gray-400">x{item.search_count}</span>
              </Pill>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2 text-lg font-semibold">{recipe.name ?? "이름 없음"}</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {recipe.cuisine && <Pill>{recipe.cuisine}</Pill>}
        {typeof recipe.time === "number" && (
          <Pill>조리 시간 {recipe.time}분</Pill>
        )}
        {recipe.level && <Pill>난이도 {recipe.level}</Pill>}
      </div>
      <Rating value={recipe.rating} />
    </div>
  );
}