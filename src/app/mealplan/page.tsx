// src/app/mealplan/page.tsx
"use client";
import { useState } from "react";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import SidebarMenu from "@/components/navigation/SidebarMenu";

const sidebarItems = [
  { href: "/mealplan", label: "식단표 만들기", exact: true },
  { href: "/mealplan/my", label: "나만의 식단표" },
];

export default function MealPlanPage() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [goal, setGoal] = useState<"loss" | "gain" | "normal">("normal");

  // 폼 상태
  const [age, setAge] = useState<string>("");                // 숫자만
  const [gender, setGender] = useState<"" | "남" | "여">(""); // 콤보박스
  const [bmr, setBmr] = useState<string>("");                // 기초대사량(kcal, 숫자만)

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");

  function handleCreate() {
    const summary = `식단표 생성
    기간: ${period === "week" ? "주간" : "월간"}
    목적: ${goal === "loss" ? "체중감량" : goal === "gain" ? "근육성장" : "일반식"}
    나이: ${age || "-"} / 성별: ${gender || "-"} / 기초대사량: ${bmr ? `${bmr} kcal` : "-"}`;
    alert(summary);
  }

  return (
    <SidebarLayout sidebar={<SidebarMenu title="식단 관리" items={sidebarItems} />}>
      <div>
        <h3 className="mb-4 text-lg font-semibold">식단표 만들기</h3>

        {/* 기간 선택 */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium">기간 선택</div>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={period === "week"}
                onChange={() => setPeriod("week")}
              />
              주간 식단
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={period === "month"}
                onChange={() => setPeriod("month")}
              />
              월간 식단
            </label>
          </div>
        </div>

        {/* 식단 목적 */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium">식단 목적</div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={goal === "loss"}
                onChange={() => setGoal("loss")}
              />
              체중감량
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={goal === "gain"}
                onChange={() => setGoal("gain")}
              />
              근육성장
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={goal === "normal"}
                onChange={() => setGoal("normal")}
              />
              일반식
            </label>
          </div>
        </div>

        {/* 개인 정보 (선택) */}
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium">개인 정보 (선택)</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* 나이: 숫자만 */}
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={120}
              placeholder="나이"
              value={age}
              onChange={(e) => setAge(onlyDigits(e.target.value))}
              className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            {/* 성별: 콤보박스 */}
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "남" | "여" | "")}
              className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">성별</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>

            {/* 활동량 → 기초대사량(kcal): 숫자만 */}
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1000}
              max={5000}
              step={1}
              placeholder="기초대사량 (kcal)"
              value={bmr}
              onChange={(e) => setBmr(onlyDigits(e.target.value))}
              className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="rounded-xl bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        >
          생성하기
        </button>
      </div>
    </SidebarLayout>
  );
}
