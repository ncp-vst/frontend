"use client";
import { Star, StarHalf, ChefHat } from "lucide-react";
import React from "react";

export type Recipe = {
  id: number;
  name: string;
  cuisine: string; // 한식/양식 등
  time: number;    // 분
  level: string;   // 쉬움/보통/어려움
  rating: number;  // 0~5
};

function Rating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} size={16} fill="currentColor" />
      ))}
      {half && <StarHalf size={16} fill="currentColor" />}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <Star key={`e-${i}`} size={16} className="text-gray-300" />
      ))}
      <span className="ml-1 text-xs text-gray-500">{value.toFixed(1)}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600">
      {children}
    </span>
  );
}

export default function SectionCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
        <ChefHat className="text-orange-500" size={18} />
        추천 요리
      </div>
      <div className="mb-2 text-lg font-semibold">{recipe.name}</div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Pill>{recipe.cuisine}</Pill>
        <Pill>{recipe.time}분</Pill>
        <Pill>{recipe.level}</Pill>
      </div>
      <Rating value={recipe.rating} />
    </div>
  );
}