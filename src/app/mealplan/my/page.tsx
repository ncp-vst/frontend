"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import SidebarMenu from "@/components/navigation/SidebarMenu";

type MealPlanItem = { id?: number; day_no: number; meal_type: string; item: string };

type MealPlan = {
  id: number;
  title?: string;
  period?: string;
  goals?: string;
  age?: number;
  gender?: string;
  basic_metabolism?: number;
  created_dt?: string;
  items: MealPlanItem[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

const sidebarItems = [
  { href: "/mealplan", label: "식단표 만들기", exact: true },
  { href: "/mealplan/my", label: "나만의 식단표" },
];

const mealTypeOrder: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
const mealTypeLabel: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const periodLabelMap: Record<string, string> = { week: "week", month: "month" };
const goalLabelMap: Record<string, string> = { loss: "loss", gain: "gain", normal: "normal" };

const dateFormatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });

async function fetchMealPlans(): Promise<MealPlan[]> {
  const res = await fetch(apiUrl("/meal-plan"), {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to load meal plans");
  }
  const json = await res.json();
  const rawList = Array.isArray(json?.data) ? json.data : [];
  const plans: MealPlan[] = [];
  for (const entry of rawList) {
    const plan = toMealPlan(entry);
    if (plan) plans.push(plan);
  }
  return plans.sort((a, b) => {
    const createdA = a.created_dt ? Date.parse(a.created_dt) : 0;
    const createdB = b.created_dt ? Date.parse(b.created_dt) : 0;
    return createdB - createdA;
  });
}

function toMealPlan(value: unknown): MealPlan | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "number") return null;
  const items = Array.isArray(obj.items)
    ? (obj.items as unknown[]).map(toMealPlanItem).filter((i): i is MealPlanItem => i !== null)
    : [];
  return {
    id: obj.id,
    title: typeof obj.title === "string" ? obj.title : undefined,
    period: typeof obj.period === "string" ? obj.period : undefined,
    goals: typeof obj.goals === "string" ? obj.goals : undefined,
    age: typeof obj.age === "number" ? obj.age : undefined,
    gender: typeof obj.gender === "string" ? obj.gender : undefined,
    basic_metabolism: typeof obj.basic_metabolism === "number" ? obj.basic_metabolism : undefined,
    created_dt: typeof obj.created_dt === "string" ? obj.created_dt : undefined,
    items,
  };
}

function toMealPlanItem(value: unknown): MealPlanItem | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.day_no !== "number" || typeof obj.meal_type !== "string" || typeof obj.item !== "string") return null;
  return { id: typeof obj.id === "number" ? obj.id : undefined, day_no: obj.day_no, meal_type: obj.meal_type, item: obj.item };
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return dateFormatter.format(new Date(parsed));
}

function groupItemsByDay(items: MealPlanItem[]) {
  if (items.length === 0) return [] as { day: number; meals: MealPlanItem[] }[];
  const map = new Map<number, MealPlanItem[]>();
  for (const item of items) {
    const list = map.get(item.day_no) ?? [];
    list.push(item);
    map.set(item.day_no, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, meals]) => ({
      day,
      meals: meals.slice().sort((a, b) => {
        const orderA = mealTypeOrder[a.meal_type] ?? Number.MAX_SAFE_INTEGER;
        const orderB = mealTypeOrder[b.meal_type] ?? Number.MAX_SAFE_INTEGER;
        return orderA === orderB ? a.meal_type.localeCompare(b.meal_type) : orderA - orderB;
      }),
    }));
}

function summaryParts(plan: MealPlan) {
  const parts: string[] = [];
  if (plan.period) parts.push(`Period: ${periodLabelMap[plan.period] ?? plan.period}`);
  if (plan.goals) parts.push(`Goal: ${goalLabelMap[plan.goals] ?? plan.goals}`);
  if (typeof plan.age === "number") parts.push(`Age: ${plan.age}`);
  if (plan.gender) parts.push(`Gender: ${plan.gender}`);
  if (typeof plan.basic_metabolism === "number") parts.push(`BMR: ${plan.basic_metabolism} kcal`);
  return parts;
}

export default function MyMealPlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchMealPlans()
      .then((data) => {
        if (!active) return;
        setPlans(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggle = (id: number) => setExpandedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <SidebarLayout sidebar={<SidebarMenu title="식단 관리" items={sidebarItems} />}>      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">나만의 식단표</h3>
          <div className="rounded-xl border p-6 text-sm text-gray-600">
            아직 저장된 식단표가 없습니다.
            <Link href="/mealplan" className="ml-2 text-orange-600 underline">식단표 만들기</Link>
          </div>
        {!loading && !error && plans.length > 0 && (
          <div className="space-y-3">
            {plans.map((plan) => {
              const createdLabel = formatDate(plan.created_dt);
              const details = summaryParts(plan);
              const grouped = groupItemsByDay(plan.items);
              const isExpanded = expandedIds.has(plan.id);
              return (
                <div key={plan.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <button type="button" onClick={() => toggle(plan.id)} className="flex w-full items-center justify-between gap-4">
                    <div className="flex-1 text-left">
                      {createdLabel && <div className="text-xs text-gray-500">{createdLabel}</div>}
                      <div className="text-base font-semibold text-gray-800">{plan.title || `Meal Plan #${plan.id}`}</div>
                      {details.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                          {details.map((part) => <span key={part}>{part}</span>)}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-500">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                  </button>
                  {isExpanded && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      {grouped.length === 0 ? (
                        <div className="text-sm text-gray-500">No meal items available.</div>
                      ) : (
                        <div className="space-y-3">
                          {grouped.map(({ day, meals }) => (
                            <div key={`${plan.id}-${day}`}>
                              <div className="text-sm font-semibold text-gray-700">{`Day ${day}`}</div>
                              <ul className="mt-1 space-y-1 text-sm text-gray-700">
                                {meals.map((meal) => (
                                  <li key={`${plan.id}-${day}-${meal.meal_type}-${meal.item}`} className="flex gap-2">
                                    <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">
                                      {mealTypeLabel[meal.meal_type] ?? meal.meal_type}
                                    </span>
                                    <span className="flex-1">{meal.item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}