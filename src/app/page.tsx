"use client";
import DesktopLayout from "@/components/layouts/DesktopLayout";
import TodayMeal from "@/components/TodayMeal";
import RecipeSearchForm from "@/components/RecipeSearchForm";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";

export default function HomePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  console.log(user);
  return (
    <DesktopLayout>
      <div className="mb-6 rounded-2xl bg-orange-400 p-5 text-white shadow-sm">
        <p className="text-sm opacity-90">가을 특별전 · 잔재료 모아 요리 완성!</p>
        <div className="mt-1 text-lg font-semibold">9월 이벤트</div>
      </div>
      <TodayMeal />
      <section className="mt-8 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm text-gray-600">냉장고 재료로 요리 찾기</div>
        <RecipeSearchForm onSearch={(q) => q && router.push(`/recipes?q=${encodeURIComponent(q)}`)} />
      </section>
    </DesktopLayout>
  );
}
