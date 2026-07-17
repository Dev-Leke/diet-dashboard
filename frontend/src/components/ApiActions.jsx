import { useState } from "react";
import { fetchRecipes, fetchClusters } from "../api/dataSource.js";

const DIET_LABELS = {
  all: "All Diet Types",
  vegan: "Vegan",
  keto: "Keto",
  paleo: "Paleo",
  vegetarian: "Vegetarian",
  omnivore: "Omnivore",
};

const PAGE_SIZE = 10;

export default function ApiActions({ selectedDiet, onGetInsights, insightsLoading }) {
  const [busyAction, setBusyAction] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [recipesPage, setRecipesPage] = useState(1);

  const runInsights = async () => {
    setBusyAction("insights");
    setErrorMsg(null);
    try {
      await onGetInsights();
      setResult({ type: "insights" });
    } catch (err) {
      setErrorMsg(err.message ?? "Failed to fetch insights");
    } finally {
      setBusyAction(null);
    }
  };

  const runRecipes = async () => {
    setBusyAction("recipes");
    setErrorMsg(null);
    try {
      const data = await fetchRecipes(selectedDiet);
      setResult({ type: "recipes", data });
      setRecipesPage(1);
    } catch (err) {
      setErrorMsg(err.message ?? "Failed to fetch recipes");
    } finally {
      setBusyAction(null);
    }
  };

  const runClusters = async () => {
    setBusyAction("clusters");
    setErrorMsg(null);
    try {
      const data = await fetchClusters(selectedDiet);
      setResult({ type: "clusters", data });
    } catch (err) {
      setErrorMsg(err.message ?? "Failed to fetch clusters");
    } finally {
      setBusyAction(null);
    }
  };

  const busy = busyAction !== null || insightsLoading;

  const totalRecipes = result?.type === "recipes" ? result.data.recipes.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalRecipes / PAGE_SIZE));
  const pageRecipes =
    result?.type === "recipes"
      ? result.data.recipes.slice((recipesPage - 1) * PAGE_SIZE, recipesPage * PAGE_SIZE)
      : [];

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={runInsights}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-400 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {busyAction === "insights" ? "Fetching..." : "Get Nutritional Insights"}
        </button>
        <button
          type="button"
          onClick={runRecipes}
          disabled={busy}
          className="bg-green-300 hover:bg-green-400 disabled:bg-green-300 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {busyAction === "recipes" ? "Fetching..." : "Get Recipes"}
        </button>
        <button
          type="button"
          onClick={runClusters}
          disabled={busy}
          className="bg-purple-300 hover:bg-purple-400 disabled:bg-purple-300 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {busyAction === "clusters" ? "Fetching..." : "Get Clusters"}
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {errorMsg}
        </div>
      )}

      {result?.type === "insights" && !errorMsg && (
        <div className="mt-4 bg-white p-4 shadow-lg rounded-lg border border-gray-100 text-sm text-gray-600">
          Insights refreshed for <span className="font-semibold">{DIET_LABELS[selectedDiet] ?? selectedDiet}</span> — see the charts above.
        </div>
      )}

      {result?.type === "recipes" && !errorMsg && (
        <div className="mt-4 bg-white p-4 shadow-lg rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600 mb-3">
            {totalRecipes} recipe{totalRecipes === 1 ? "" : "s"} for{" "}
            <span className="font-semibold">{DIET_LABELS[selectedDiet] ?? selectedDiet}</span>
            {" "}({result.data.meta.executionTimeMs} ms)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Diet</th>
                  <th className="py-2 pr-3">Protein</th>
                  <th className="py-2 pr-3">Carbs</th>
                  <th className="py-2 pr-3">Fat</th>
                  
                </tr>
              </thead>
              <tbody>
                {pageRecipes.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3">{DIET_LABELS[r.dietType] ?? r.dietType}</td>
                    <td className="py-2 pr-3">{r.protein}g</td>
                    <td className="py-2 pr-3">{r.carbs}g</td>
                    <td className="py-2 pr-3">{r.fat}g</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRecipesPage((p) => Math.max(1, p - 1))}
                disabled={recipesPage === 1}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:hover:bg-gray-300 text-sm"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRecipesPage(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === recipesPage
                      ? "bg-purple-300 text-white"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRecipesPage((p) => Math.min(totalPages, p + 1))}
                disabled={recipesPage === totalPages}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:hover:bg-gray-300 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {result?.type === "clusters" && !errorMsg && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            {result.data.clusters.length} cluster{result.data.clusters.length === 1 ? "" : "s"} for{" "}
            <span className="font-semibold">{DIET_LABELS[selectedDiet] ?? selectedDiet}</span>
            {" "}({result.data.meta.executionTimeMs} ms)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.data.clusters.map((cluster) => (
              <div key={cluster.id} className="bg-white p-4 shadow-lg rounded-lg border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">{cluster.label}</h4>
                <p className="text-xs text-gray-500 mb-2">{cluster.recipeCount} recipes</p>
                <p className="text-xs text-gray-600">Protein: {cluster.avgProtein}g</p>
                <p className="text-xs text-gray-600">Carbs: {cluster.avgCarbs}g</p>
                <p className="text-xs text-gray-600">Fat: {cluster.avgFat}g</p>
                
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}