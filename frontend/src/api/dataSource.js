
const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL || "";

const CONFIG = {
  useMock: !FUNCTION_URL,
  mockUrl: "/data.json",
  functionUrl: FUNCTION_URL,
};

const DIET_LABELS = {
  all: "All Diet Types",
  vegan: "Vegan",
  keto: "Keto",
  paleo: "Paleo",
  vegetarian: "Vegetarian",
  omnivore: "Omnivore",
};


export async function fetchInsights(dietFilter = "all") {
  return callAction("insights", dietFilter);
}

/** Raw recipe records for the given diet filter. */
export async function fetchRecipes(dietFilter = "all") {
  return callAction("recipes", dietFilter);
}

/** Cluster analysis (k-means over protein/carbs/fat) for the given diet filter. */
export async function fetchClusters(dietFilter = "all") {
  return callAction("clusters", dietFilter);
}

async function callAction(action, dietFilter) {
  if (CONFIG.useMock) {
    return runMockAction(action, dietFilter);
  }

  const url = new URL(CONFIG.functionUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("diet", dietFilter);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function runMockAction(action, dietFilter) {
  const res = await fetch(CONFIG.mockUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mock fetch failed: ${res.status} ${res.statusText}`);
  }
  const full = await res.json();

  // simulate realistic network + compute latency so stats/results feel alive
  const executionTimeMs = 25 + Math.round(Math.random() * 60);
  await new Promise((resolve) => setTimeout(resolve, executionTimeMs));

  const filteredRecipes = filterRecipesByDiet(full.recipes, dietFilter);
  const meta = buildMeta(full.meta, dietFilter, filteredRecipes.length, executionTimeMs);

  if (action === "recipes") {
    return { meta, recipes: filteredRecipes };
  }

  if (action === "clusters") {
    return { meta, clusters: computeClusters(filteredRecipes) };
  }

  // action === "insights"
  const charts = applyDietFilterToCharts(full.charts, dietFilter);
  charts.scatter = computeScatter(filteredRecipes);
  charts.heatmap = computeHeatmap(filteredRecipes);

  return {
    meta,
    filters: full.filters,
    charts,
  };
}

function buildMeta(baseMeta, dietFilter, recordCount, executionTimeMs) {
  return {
    ...baseMeta,
    recordCount,
    executionTimeMs,
    filterApplied: dietFilter || "all",
    generatedAt: new Date().toISOString(),
  };
}

function filterRecipesByDiet(recipes, dietFilter) {
  if (!dietFilter || dietFilter === "all") return recipes;
  return recipes.filter(
    (r) => r.dietType.toLowerCase() === dietFilter.toLowerCase()
  );
}

function applyDietFilterToCharts(charts, dietFilter) {
  const { bar, line, pie } = charts;

  if (!dietFilter || dietFilter === "all") {
    return {
      bar: { ...bar },
      line: { ...line },
      pie: { ...pie },
    };
  }

  const idx = bar.labels.findIndex(
    (label) => label.toLowerCase() === dietFilter.toLowerCase()
  );
  if (idx === -1) {
    return applyDietFilterToCharts(charts, "all");
  }

  return {
    bar: {
      ...bar,
      labels: [bar.labels[idx]],
      datasets: bar.datasets.map((ds) => ({ ...ds, data: [ds.data[idx]] })),
    },
    line: {
      ...line,
      labels: [line.labels[idx]],
      datasets: line.datasets.map((ds) => ({ ...ds, data: [ds.data[idx]] })),
    },
    pie: {
      ...pie,
      labels: [pie.labels[idx]],
      data: [pie.data[idx]],
    },
  };
}

function computeScatter(recipes) {
  const dietTypes = [...new Set(recipes.map((r) => r.dietType))];
  const series = dietTypes.map((diet) => ({
    dietType: diet,
    label: DIET_LABELS[diet] ?? diet,
    points: recipes
      .filter((r) => r.dietType === diet)
      .map((r) => ({ x: r.protein, y: r.carbs })),
  }));

  return {
    title: "Protein vs Carbs by Recipe",
    xLabel: "Protein (g)",
    yLabel: "Carbs (g)",
    series,
  };
}


const CORRELATION_FIELDS = ["protein", "carbs", "fat"];
const CORRELATION_LABELS = ["Protein", "Carbs", "Fat",];

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return 0;
  return cov / Math.sqrt(varX * varY);
}

function computeHeatmap(recipes) {
  const matrix = CORRELATION_FIELDS.map((f1) =>
    CORRELATION_FIELDS.map((f2) =>
      Math.round(
        pearson(
          recipes.map((r) => r[f1]),
          recipes.map((r) => r[f2])
        ) * 100
      ) / 100
    )
  );

  return {
    title: "Nutrient Correlations",
    labels: CORRELATION_LABELS,
    matrix,
  };
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

  let assignments = new Array(n).fill(0);
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