const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL || "";

const CONFIG = {
  useMock: !FUNCTION_URL,
  mockUrl: "/data.json",
  functionUrl: FUNCTION_URL,
};

const DIET_LABELS = {
  all: "All Diet Types",
  dash: "DASH",
  keto: "Keto",
  mediterranean: "Mediterranean",
  paleo: "Paleo",
  vegan: "Vegan",
};

if (import.meta.env.PROD && CONFIG.useMock) {
  console.error("VITE_FUNCTION_URL missing — serving MOCK data");
}

function label(diet) {
  return DIET_LABELS[diet] ?? diet;
}

export async function fetchInsights(dietFilter = "all") {
  if (CONFIG.useMock) {
    const res = await fetch(CONFIG.mockUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Mock fetch failed: ${res.status}`);
    return res.json();
  }

  const url = new URL(CONFIG.functionUrl);
  if (dietFilter && dietFilter !== "all") {
    url.searchParams.set("diet", dietFilter);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  const api = await res.json();
  return adapt(api);
}

function adapt(api) {
  const macros = api.charts?.avgMacrosByDietType ?? [];
  const cuisines = api.charts?.cuisineDistribution ?? [];
  const topRecipes = api.charts?.top5ProteinRecipes ?? [];

  const bar = {
    title: "Average Macronutrients by Diet Type (g)",
    labels: macros.map((m) => label(m.label)),
    datasets: [
      { label: "Protein", data: macros.map((m) => m.protein) },
      { label: "Carbs", data: macros.map((m) => m.carbs) },
      { label: "Fat", data: macros.map((m) => m.fat) },
    ],
  };

  const pie = {
    title: "Recipe Count by Cuisine",
    labels: cuisines.map((c) => c.label),
    data: cuisines.map((c) => c.value),
  };

  const dietsInScatter = [...new Set(topRecipes.map((r) => r.diet))];
  const scatter = {
    title: "Top Protein Recipes by Diet",
    xLabel: "Protein (g)",
    yLabel: "Diet",
    series: dietsInScatter.map((diet) => ({
      label: label(diet),
      points: topRecipes
        .filter((r) => r.diet === diet)
        .map((r) => ({ x: r.protein, y: dietsInScatter.indexOf(diet) + 1 })),
    })),
  };

  const dietTypes = ["all", ...(api.meta?.valid_diets ?? [])];

  return {
    meta: {
      recordCount: api.meta?.record_count ?? 0,
      executionTimeMs: api.meta?.execution_ms ?? 0,
      filterApplied: api.meta?.filter_applied ?? "all",
      generatedAt: api.meta?.generated_at ?? new Date().toISOString(),
    },
    filters: { dietTypes },
    insights: api.insights ?? {},
    charts: { bar, pie, scatter },
  };
}