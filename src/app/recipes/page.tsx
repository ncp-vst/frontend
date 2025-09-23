"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [term, setTerm] = useState(q);
  const [recommendRecipes, setRecommendRecipes] = useState<Recipe[]>([]); // State for recipes
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!q) {
      setRecommendRecipes([]);
      return;
    }

    const consumeNdjsonStream = async () => {
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
        let lastValidJsonString = ""; // To store the last valid JSON string

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
          if (done) {
            try {
              // At the end, parse the last valid string we received.
              if (lastValidJsonString) {
                const parsedRecipes = JSON.parse(lastValidJsonString);
                if (Array.isArray(parsedRecipes)) {
                  setRecommendRecipes(parsedRecipes as Recipe[]);
                }
              }
            } catch (e) {
              // Error parsing final JSON string
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const candidate = normalizeLine(lines[i]);
            if (!candidate) {
              continue;
            }

            try {
              const jsonObject: NdjsonItem = JSON.parse(candidate);
              const recipePayload = jsonObject.message;

              if (typeof recipePayload === "string") {
                // Transform the string to valid JSON by quoting unquoted property names
                const validJsonString = recipePayload.replace(/(\w+):/g, '"$1":');
                
                try {
                  const parsed = JSON.parse(validJsonString);
                  if (Array.isArray(parsed)) {
                    lastValidJsonString = validJsonString;
                  }
                } catch (e) {
                  // recipePayload is a string but not a valid JSON array even after quoting property names.
                  // This might happen if the content is not meant to be a JSON array.
                }
              } else if (Array.isArray(recipePayload)) {
                lastValidJsonString = JSON.stringify(recipePayload);
              }
            } catch (e) {
              // The line itself wasn't valid JSON, ignore.
            }
          }
          buffer = lines[lines.length - 1];
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    consumeNdjsonStream();
  }, [q]);

  const handleSearch = (query: string) => {
    // To trigger the useEffect, we need to update the URL's query parameter 'q'.
    window.location.search = `q=${encodeURIComponent(query)}`;
  };

  const results = term
    ? recommendRecipes.filter((r) => r.name.includes(term) || term.split(',').some((t) => r.name.includes(t.trim())))
    : recommendRecipes;

  const resultsTitle = term ? `추천 요리 결과: ${term}` : "추천 요리 결과";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">레시피 검색</h2>
        <RecipeSearchForm initialValue={term} onSearch={handleSearch} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">{resultsTitle}</h2>
        {results.length === 0 ? (
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
