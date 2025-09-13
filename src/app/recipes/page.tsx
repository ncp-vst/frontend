"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GridLayout from "@/components/layouts/GridLayout";
import RecipeSearchForm from "@/components/RecipeSearchForm";
import SectionCard from "@/components/SectionCard";
import LeftoverList from "@/components/LeftoverList";

const mockRecipes = [
	  { id: 1, name: "양파 볶음", cuisine: "한식", time: 15, level: "쉬움", rating: 4.8 },
	    { id: 2, name: "야채 스프", cuisine: "양식", time: 30, level: "보통", rating: 4.5 },
	      { id: 3, name: "양파 무침", cuisine: "한식", time: 10, level: "쉬움", rating: 4.3 },
];

function RecipePageInner() {
	  const params = useSearchParams();
	    const q = params.get("q") || "";
	      const [term, setTerm] = useState(q);

	        const results = term
		    ? mockRecipes.filter(
			            (r) =>
				              r.name.includes(term) ||
						                term.split(",").some((t) => r.name.includes(t.trim()))
					            )
						        : mockRecipes;

							  return (
								      <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
								            <section>
									            <h2 className="mb-3 text-sm font-semibold text-gray-700">레시피 검색</h2>
										            <RecipeSearchForm initialValue={term} onSearch={(query) => setTerm(query)} />
											          </section>

												        <section>
													        <h2 className="mb-3 text-sm font-semibold text-gray-700">추천 요리 결과</h2>
														        <GridLayout>
															          {results.map((r) => (
																	              <SectionCard key={r.id} recipe={r} />
																		                ))}
																				        </GridLayout>
																					      </section>

																					            <LeftoverList />
																						        </div>
																							  );
}

export default function RecipePage() {
	  return (
		      <Suspense fallback={<div>Loading recipes...</div>}>
		            <RecipePageInner />
			        </Suspense>
				  );
}

