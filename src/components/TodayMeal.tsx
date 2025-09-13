"use client";
import { Salad, Drumstick } from "lucide-react";

export default function TodayMeal() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">오늘의 추천 식단</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="group flex cursor-pointer items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
          <Salad className="text-emerald-500" />
          <div>
            <div className="font-semibold">점심 추천</div>
            <p className="text-sm text-gray-500">간단한 단백질 점심 메뉴</p>
          </div>
        </div>
        <div className="group flex cursor-pointer items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
          <Drumstick className="text-sky-500" />
          <div>
            <div className="font-semibold">저녁 추천</div>
            <p className="text-sm text-gray-500">풍성하고 맛있는 저녁 메뉴</p>
          </div>
        </div>
      </div>
    </section>
  );
}