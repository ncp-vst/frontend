"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import GridLayout from "@/components/layouts/GridLayout";
import RecipeSearchForm from "@/components/RecipeSearchForm";
import SectionCard from "@/components/SectionCard";
import LeftoverList from "@/components/LeftoverList";

let recommendRecipes = [
  { id: 1, name: "양파 볶음", cuisine: "한식", time: 15, level: "쉬움", rating: 4.8 },
  { id: 2, name: "야채 스프", cuisine: "양식", time: 30, level: "보통", rating: 4.5 },
  { id: 3, name: "양파 무침", cuisine: "한식", time: 10, level: "쉬움", rating: 4.3 },
];

// Define the shape of each JSON line. 모르면 unknown으로 둬도 OK.
type NdjsonItem = Record<string, unknown>;

export async function consumeNdjsonStream(query: string): Promise<void> {
  try {
    // 추천 요리 초기화
    recommendRecipes = [];

    const response = await fetch("/clova/api/v1/chat/recipe-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: query,
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream is not supported or response has no body.");
    }

    const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const normalizeLine = (raw: string): string | null => {
      const trimmed = raw.trim();
      if (!trimmed) {
        return null;
      }

      const withoutPrefix = trimmed.startsWith("data:")
        ? trimmed.slice(5).trim()
        : trimmed;

      if (!withoutPrefix || withoutPrefix === "[DONE]") {
        return null;
      }

      return withoutPrefix;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream finished.");
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
	  const recipe = jsonObject.message;

	  try {
	      recommendRecipes = JSON.parse(JSON.stringify(recipe));
	  } catch (e) {
	    // 아무 작업 안함
	  }

          // TODO: handle(jsonObject)
        } catch (e) {
          console.error("Error parsing JSON:", e, "Line:", candidate);
        }
      }

      buffer = lines[lines.length - 1];
    }

    const finalCandidate = normalizeLine(buffer);
    if (finalCandidate) {
      try {
        const jsonObject: NdjsonItem = JSON.parse(finalCandidate);
        console.log("Received final object:", jsonObject);
      } catch (e) {
        console.error("Error parsing final JSON:", e, "Line:", finalCandidate);
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}


function RecipePageContent() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [term, setTerm] = useState(q);
  const [refreshKey, setRefreshKey] = useState(0);

  // 요리 추천 실행
  consumeNdjsonStream(q);

  const handleSearch = (query: string) => {
    setTerm(query);
    setRefreshKey((prev) => prev + 1);
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
