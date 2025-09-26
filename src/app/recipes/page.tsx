"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GridLayout from "@/components/layouts/GridLayout";
import RecipeSearchForm from "@/components/RecipeSearchForm";
import SectionCard, { FreqIngredient } from "@/components/SectionCard";
import LeftoverList from "@/components/LeftoverList";

type NdjsonItem = Record<string, unknown>;

type Recipe = {
  id?: number;
  name?: string;
  cuisine?: string;
  time?: number;
  level?: string;
  rating?: number;
};

type FreqIngredientResult = {
  rows: FreqIngredient[];
  error?: string;
};

async function fetchFreqIngredients(): Promise<FreqIngredientResult> {
  try {
    const res = await fetch("/freq-ingrdt", { cache: "no-store" });
    if (!res.ok) {
      return {
        rows: [],
        error: `자주 검색한 식재료를 불러오지 못했습니다. (status: ${res.status} ${res.statusText})`,
      };
    }

    const json = (await res.json()) as FreqIngredient[];
    return { rows: json };
  } catch (error) {
    return {
      rows: [],
      error:
        error instanceof Error
          ? error.message
          : "자주 검색한 식재료를 불러오는 중 문제가 발생했습니다.",
    };
  }
}

function RecipePageContent() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [recommendRecipes, setRecommendRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [freqIngredients, setFreqIngredients] = useState<FreqIngredient[]>([]);
  const [freqError, setFreqError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadFreqIngredients = useCallback(async () => {
    const { rows, error } = await fetchFreqIngredients();
    setFreqIngredients(rows);
    setFreqError(error ?? null);
  }, []);

  useEffect(() => {
    loadFreqIngredients().catch(console.error);
  }, [loadFreqIngredients]);

  useEffect(() => {
    if (!q) {
      setRecommendRecipes([]);
      return;
    }

    const consumeNdjsonStream = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/clova/api/v1/chat/recipe-recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: q,
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
        let lastJsonMessage = "";

        const normalizeLine = (raw: string): string | null => {
          const trimmed = raw.trim();
          if (!trimmed) return null;
          const withoutPrefix = trimmed.startsWith("data:")
            ? trimmed.slice(5).trim()
            : trimmed;
          if (!withoutPrefix || withoutPrefix === "[DONE]") return null;
          return withoutPrefix;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (value) {
            buffer += decoder.decode(value, { stream: true });
          }

          const lines = buffer.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (!line.startsWith("data:")) continue;

            const candidate = normalizeLine(line);

            if (!candidate) continue;

            try {
              const jsonObject: NdjsonItem = JSON.parse(candidate);
              if (jsonObject.message && typeof jsonObject.message === "string") {
                lastJsonMessage = jsonObject.message;
              }
            } catch (e) {
              // 개별 줄 파싱 에러는 무시
            }
          }

          buffer = lines[lines.length - 1];

          if (done) {
            try {
              if (lastJsonMessage) {
                const validJsonString = lastJsonMessage.replace(/(\w+):/g, '"$1":');
                const parsedRecipes = JSON.parse(validJsonString);
                if (Array.isArray(parsedRecipes)) {
                  setRecommendRecipes(parsedRecipes as Recipe[]);
                }
              }
            } catch (e) {
              console.error("최종 JSON 문자열 파싱 오류", e, "\n문자열:", lastJsonMessage);
            }
            break;
          }
        }
      } catch (error) {
        console.error("레시피 추천 요청 실패", error);
      } finally {
        setIsLoading(false);
      }
    };

    consumeNdjsonStream();
  }, [q]);

  const handleSearch = (query: string) => {
    window.location.search = `q=${encodeURIComponent(query)}`;
  };

  const handleFreqIngredientsUpdate = (rows: FreqIngredient[]) => {
    setFreqIngredients(rows);
    setFreqError(null);
    setRefreshKey((prev) => prev + 1);
  };

  const results = recommendRecipes;
  const resultsTitle = q ? `추천 레시피 결과: ${q}` : "추천 레시피 결과";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">레시피 검색</h2>
        <RecipeSearchForm
          initialValue={q}
          onSearch={handleSearch}
          onFreqIngredientsUpdate={handleFreqIngredientsUpdate}
        />
        {freqError && (
          <p className="mt-2 text-sm text-red-500">{freqError}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">{resultsTitle}</h2>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-gray-500">
            <svg className="mb-2 h-8 w-8 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>추천 레시피를 생성하는 중입니다. 잠시만 기다려주세요.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-gray-500">
            추천 결과가 없습니다.
          </div>
        ) : (
          <GridLayout>
            {results.map((r, index) => (
              <SectionCard
                key={`${r.id ?? "recipe"}-${index}`}
                recipe={r}
                freqIngredients={freqIngredients}
              />
            ))}
          </GridLayout>
        )}
      </section>

      <LeftoverList refreshKey={refreshKey} />
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">검색 데이터를 불러오는 중입니다...</div>}>
      <RecipePageContent />
    </Suspense>
  );
}