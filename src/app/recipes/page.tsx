"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTokenStore } from "@/stores/tokenStore";
import GridLayout from "@/components/layouts/GridLayout";
import RecipeSearchForm from "@/components/RecipeSearchForm";
import SectionCard from "@/components/SectionCard";
import LeftoverList from "@/components/LeftoverList";

// Define the shape of each JSON line.
type NdjsonItem = Record<string, unknown>;

// Define the shape of a recipe
type Recipe = {
  id: number;
  name: string;
  cuisine: string;
  time: number;
  level: string;
  rating: number;
};


function RecipePageContent() {
  const router = useRouter();
  const token = useTokenStore((token) => token);
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [recommendRecipes, setRecommendRecipes] = useState<Recipe[]>([]); // State for recipes
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
          headers: {
            "Content-Type": "application/json",
            ...(token.token && { "X-XSRF-TOKEN": token.token }),
          },
          body: JSON.stringify({
            message: q,
            max_tokens: 2000,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error(
            "ReadableStream is not supported or response has no body."
          );
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
              if (jsonObject.message && typeof jsonObject.message === 'string') {
                lastJsonMessage = jsonObject.message; // Always use the last message
              }
            } catch (e) {
              // Ignore parsing errors for individual lines
            }
          }

          buffer = lines[lines.length - 1];

          if (done) {
            try {
              if (lastJsonMessage) {
                // Fix unquoted keys before parsing
                const validJsonString = lastJsonMessage.replace(/(\w+):/g, '"$1":');
                const parsedRecipes = JSON.parse(validJsonString);
                if (Array.isArray(parsedRecipes)) {
                  setRecommendRecipes(parsedRecipes as Recipe[]);
                }
              }
            } catch (e) {
              console.error("Error parsing final JSON string:", e, "\nString was:", lastJsonMessage);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    consumeNdjsonStream();
  }, [q]);

  const handleSearch = (query: string) => {
    router.push(`/recipes?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    const splitAndTrim = (query: string) => {
      if (!query) return [];
      const arr = query.split(",").map(s => s.trim());
      if (arr.length === 1 && arr[0] === "") {
        return [];
      }
      return arr;
    }
    
    const freqIngrdtUpsert = async () => {
      await fetch("/freq-ingrdt/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token.token && { "X-XSRF-TOKEN": token.token }),
        },
        body: JSON.stringify(splitAndTrim(q)),
      });
    };
    
    if (q) {
      freqIngrdtUpsert();
    }
  }, [q, token.token]);

  const results = recommendRecipes;
  const resultsTitle = q ? `추천 요리 결과: ${q}` : "추천 요리 결과";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">레시피 검색</h2>
        <RecipeSearchForm initialValue={q} onSearch={handleSearch} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">{resultsTitle}</h2>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-gray-500">
            <svg className="animate-spin h-8 w-8 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>맛있는 요리를 생각중입니다. 잠시만 기달려주세요.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-gray-500">
            추천 결과가 없습니다.
          </div>
        ) : (
          <GridLayout>
            {results.map((r) => (
              <SectionCard key={r.id} recipe={r} />
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
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading search data...</div>}>
      <RecipePageContent />
    </Suspense>
  );
}
