"use client";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import SidebarMenu from "@/components/navigation/SidebarMenu";

const sidebarItems = [
  { href: "/mealplan", label: "식단표 만들기", exact: true },
  { href: "/mealplan/my", label: "나만의 식단표" },
];

export default function MyMealPlansPage() {
  return (
    <SidebarLayout sidebar={<SidebarMenu title="식단 관리" items={sidebarItems} />}>      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">나만의 식단표</h3>
        <div className="rounded-xl border p-6 text-sm text-gray-600">
          아직 저장된 식단표가 없습니다.
          <Link href="/mealplan" className="ml-2 text-orange-600 underline">식단표 만들기</Link>
        </div>
      </div>
    </SidebarLayout>
  );
}