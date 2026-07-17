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

function label(diet) {
  return DIET_LABELS[diet] ?? diet;
}

export async function fetchInsights(dietFilter = "all") {
  if (CONFIG.useMock) {
    const res = await fetch(CONFIG.mockUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Mock fetch failed: ${res.status}`);
    return res.json();
  }

  const api = await callAction("insights", dietFilter);
  return adapt(api);
}

export async function fetchRecipes(dietFilter = "all") {
  const api = await callAction("recipes", dietFilter);
  return {
    meta: adaptMeta(api.meta),
    recipes: api.recipes ?? [],
  };
}

export async function fetchClusters(dietFilter = "all") {
  const api = await callAction("clusters", dietFilter);
  return {
    meta: adaptMeta(api.meta),
    clusters: api.clusters ?? [],
  };
}

async function callAction(action, dietFilter) {
  if (CONFIG.useMock) {
    return runMockAction(action, dietFilter);
  }

  const url = new URL(CONFIG.functionUrl);
  url.searchParams.set("action", action);
  if (dietFilter && dietFilter !== "all") {
    url.searchParams.set("diet", dietFilter);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function filterRecipesByDiet(recipes, dietFilter) {
  if (!dietFilter || dietFilter === "all") return recipes;
  return recipes.filter((r) => r.dietType.toLowerCase() === dietFilter.toLowerCase());
}

function computeClusters(recipes, k = 3) {
  if (recipes.length === 0) return [];

  const points = recipes.map((r) => [r.protein, r.carbs, r.fat]);
  const n = points.length;
  const kEff = Math.min(k, n);

  const sortedIdx = [...points.keys()].sort((a, b) => points[a][0] - points[b][0]);
  let centroids = Array.from({ length: kEff }, (_, i) => {
    const idx = sortedIdx[Math.floor((i + 0.5) * (n / kEff))];
    return [...points[idx]];
  });

  let assignments = Array.from({ length: n }, () => 0);
  for (let iter = 0; iter < 15; iter++) {
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < kEff; c++) {
        const dist = squaredDistance(points[i], centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      assignments[i] = best;
    }

    const sums = Array.from({ length: kEff }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sums[c][0] += points[i][0];
      sums[c][1] += points[i][1];
      sums[c][2] += points[i][2];
      sums[c][3] += 1;
    }
    centroids = sums.map((s, c) => (s[3] > 0 ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centroids[c]));
  }

  const clusters = [];
  for (let c = 0; c < kEff; c++) {
    const members = recipes.filter((_, i) => assignments[i] === c);
    if (!members.length) continue;
    const avg = (field) =>
      Math.round(members.reduce((sum, r) => sum + r[field], 0) / members.length);
    clusters.push({
      id: c,
      recipeCount: members.length,
      avgProtein: avg("protein"),
      avgCarbs: avg("carbs"),
      avgFat: avg("fat"),
      dietTypes: [...new Set(members.map((r) => r.dietType))],
    });
  }

  clusters.sort((a, b) => b.avgProtein - a.avgProtein);
  const names = ["High-Protein / Low-Carb", "Balanced Macro Profile", "High-Carb / Low-Protein"];
  clusters.forEach((cl, i) => {
    cl.label = names[i] ?? `Cluster ${i + 1}`;
  });

  return clusters;
}

function squaredDistance(a, b) {
  return a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0);
}

async function runMockAction(action, dietFilter) {
  const res = await fetch(CONFIG.mockUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Mock fetch failed: ${res.status} ${res.statusText}`);
  const full = await res.json();

  const executionTimeMs = 25 + Math.round(Math.random() * 60);
  await new Promise((resolve) => setTimeout(resolve, executionTimeMs));

  const filteredRecipes = filterRecipesByDiet(full.recipes ?? [], dietFilter);
  const meta = {
    record_count: filteredRecipes.length,
    filter_applied: dietFilter || "all",
    execution_ms: executionTimeMs,
    generated_at: new Date().toISOString(),
    valid_diets: full.meta?.valid_diets ?? [],
  };

  return action === "recipes"
    ? { meta, recipes: filteredRecipes }
    : { meta, clusters: computeClusters(filteredRecipes) };
}

function adaptMeta(meta) {
  return {
    recordCount: meta?.record_count ?? 0,
    executionTimeMs: meta?.execution_ms ?? 0,
    filterApplied: meta?.filter_applied ?? "all",
    generatedAt: meta?.generated_at ?? new Date().toISOString(),
  };
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