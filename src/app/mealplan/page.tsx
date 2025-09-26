"use client";
import { useMemo, useState } from "react";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import SidebarMenu from "@/components/navigation/SidebarMenu";

type MealPlanItem = {
  day_no: number;
  meal_type: string;
  item: string;
};

const sidebarItems = [
  { href: "/mealplan", label: "식단표 만들기", exact: true },
  { href: "/mealplan/my", label: "나만의 식단표" },
];

const mealTypeToLabel: Record<string, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const mealTypeOrder: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

const isMealPlanItem = (value: unknown): value is MealPlanItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MealPlanItem>;
  return (
    typeof candidate.day_no === "number" &&
    typeof candidate.meal_type === "string" &&
    typeof candidate.item === "string"
  );
};

const toMealPlanArray = (value: unknown): MealPlanItem[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(isMealPlanItem) as MealPlanItem[];
  return items.length > 0 ? items : null;
};

const extractLatestMealPlan = (raw: string): MealPlanItem[] | null => {
  const arrays: MealPlanItem[][] = [];
  let searchStart = 0;

  while (searchStart < raw.length) {
    const startIdx = raw.indexOf("[", searchStart);
    if (startIdx === -1) {
      break;
    }

    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = startIdx; i < raw.length; i += 1) {
      const char = raw[i];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === "\"") {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === "[") {
        depth += 1;
      } else if (char === "]") {
        depth -= 1;
        if (depth === 0) {
          const segment = raw.slice(startIdx, i + 1);
          try {
            const parsed = JSON.parse(segment);
            const items = toMealPlanArray(parsed);
            if (items) {
              arrays.push(items);
            }
          } catch (parseError) {
            console.error("식단 JSON 세그먼트 파싱 실패", parseError, segment);
          }
          searchStart = i + 1;
          break;
        }
      }
    }

    if (depth > 0) {
      break;
    }
  }

  return arrays.length ? arrays[arrays.length - 1] : null;
};

export default function MealPlanPage() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [goal, setGoal] = useState<"loss" | "gain" | "normal">("normal");

  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"" | "남" | "여">("");
  const [bmr, setBmr] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planItems, setPlanItems] = useState<MealPlanItem[]>([]);
  const [fallbackOutput, setFallbackOutput] = useState("");

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");

  const groupedPlan = useMemo(() => {
    if (!planItems.length) {
      return [] as Array<{ day: number; meals: MealPlanItem[] }>;
    }

    const byDay = new Map<number, MealPlanItem[]>();

    for (const item of planItems) {
      const existing = byDay.get(item.day_no);
      if (existing) {
        existing.push(item);
      } else {
        byDay.set(item.day_no, [item]);
      }
    }

    return Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, meals]) => ({
        day,
        meals: [...meals].sort((a, b) => {
          const left = mealTypeOrder[a.meal_type] ?? 99;
          const right = mealTypeOrder[b.meal_type] ?? 99;
          if (left === right) {
            return a.meal_type.localeCompare(b.meal_type);
          }
          return left - right;
        }),
      }));
  }, [planItems]);

  async function handleCreate() {
    setIsLoading(true);
    setError(null);
    setPlanItems([]);
    setFallbackOutput("");

    const ageNumber = age ? Number(age) : undefined;
    const bmrNumber = bmr ? Number(bmr) : undefined;

    const messagePayload: Record<string, string | number> = {
      title: period === "week" ? "주간 식단 계획" : "월간 식단 계획",
      period: period === "week" ? "weekly" : "monthly",
      goals: goal === "loss" ? "weight_loss" : goal === "gain" ? "weight_gain" : "balanced",
    };

    if (typeof ageNumber === "number" && !Number.isNaN(ageNumber)) {
      messagePayload.age = ageNumber;
    }

    const genderCode = gender === "남" ? "male" : gender === "여" ? "female" : undefined;
    if (genderCode) {
      messagePayload.gender = genderCode;
    }

    if (typeof bmrNumber === "number" && !Number.isNaN(bmrNumber)) {
      messagePayload.basic_metabolism = bmrNumber;
    }

    try {
      const response = await fetch("http://49.50.130.15:8000/api/v1/chat/meal-plan-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: JSON.stringify(messagePayload),
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`요청이 실패했습니다. (status: ${response.status})`);
      }

      if (!response.body) {
        throw new Error("브라우저가 스트리밍 응답을 지원하지 않습니다.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let aggregated = "";

      const handleLine = (rawLine: string) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return;
        }

        const withoutPrefix = trimmed.startsWith("data:")
          ? trimmed.slice(5).trim()
          : trimmed;

        if (!withoutPrefix || withoutPrefix === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(withoutPrefix);
          if (parsed?.message) {
            aggregated += String(parsed.message);
          }
        } catch (chunkError) {
          console.error("식단 생성 응답 파싱 실패", chunkError, withoutPrefix);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i += 1) {
          handleLine(lines[i]);
        }

        buffer = lines.length > 0 ? lines[lines.length - 1] : "";
      }

      if (buffer) {
        handleLine(buffer);
      }

      const cleaned = aggregated.trim();
      if (!cleaned) {
        throw new Error("식단 결과를 전달받지 못했습니다.");
      }

      const latestPlan = extractLatestMealPlan(cleaned);
      if (latestPlan) {
        setPlanItems(latestPlan);
        return;
      }

      setFallbackOutput(cleaned);
      setError("식단 결과를 해석하는 데 실패했습니다. 아래 원본 텍스트를 확인해주세요.");
    } catch (requestError) {
      console.error("식단 생성 요청 실패", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "식단 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
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
                disabled={isLoading}
              />
              주간 식단
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={period === "month"}
                onChange={() => setPeriod("month")}
                disabled={isLoading}
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
                disabled={isLoading}
              />
              체중감량
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={goal === "gain"}
                onChange={() => setGoal("gain")}
                disabled={isLoading}
              />
              근육성장
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={goal === "normal"}
                onChange={() => setGoal("normal")}
                disabled={isLoading}
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
              disabled={isLoading}
              className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            {/* 성별: 콤보박스 */}
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "남" | "여" | "")}
              disabled={isLoading}
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
              disabled={isLoading}
              className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="rounded-xl bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {isLoading ? "생성 중..." : "생성하기"}
        </button>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && isLoading && (
          <div className="mt-4 text-sm text-gray-500">식단을 생성하는 중입니다...</div>
        )}

        {groupedPlan.length > 0 && (
          <div className="mt-6 space-y-4">
            {groupedPlan.map(({ day, meals }) => (
              <div
                key={day}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="mb-2 text-base font-semibold">{`${day}일차`}</div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {meals.map((meal) => (
                    <li key={`${day}-${meal.meal_type}`} className="flex gap-2">
                      <span className="w-16 shrink-0 font-medium">
                        {mealTypeToLabel[meal.meal_type] ?? meal.meal_type}
                      </span>
                      <span className="flex-1">{meal.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {fallbackOutput && (
          <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            {fallbackOutput}
          </pre>
        )}
      </div>
    </SidebarLayout>
  );
}
