import { useCallback, useEffect, useState } from "react";
import "./chartSetup";
import { fetchInsights } from "./api/dataSource.js";
import Header from "./components/Header.jsx";
import FilterBar from "./components/FilterBar.jsx";
import ApiActions from "./components/ApiActions.jsx";
import InsightsBarChart from "./components/charts/InsightsBarChart.jsx";
import InsightsScatterChart from "./components/charts/InsightsScatterChart.jsx";
import CorrelationHeatmap from "./components/charts/CorrelationHeatmap.jsx";
import InsightsPieChart from "./components/charts/InsightsPieChart.jsx";

function App() {
  const [selectedDiet, setSelectedDiet] = useState("all");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (diet) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInsights(diet);
      setPayload(data);
    } catch (err) {
      setError(err.message ?? "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedDiet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDietChange = (diet) => {
    setSelectedDiet(diet);
    load(diet);
  };

  const handleRefresh = () => load(selectedDiet);

  const dietTypes = payload?.filters?.dietTypes ?? ["all"];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="container mx-auto p-6">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Explore Nutritional Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InsightsBarChart data={payload?.charts?.bar} />
            <InsightsScatterChart data={payload?.charts?.scatter} />
            <CorrelationHeatmap data={payload?.charts?.heatmap} />
            <InsightsPieChart data={payload?.charts?.pie} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Filters and Data Interaction</h2>
          <FilterBar
            dietTypes={dietTypes}
            selectedDiet={selectedDiet}
            onDietChange={handleDietChange}
            onRefresh={handleRefresh}
            loading={loading}
          />
        </section>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
            Couldn&apos;t load insights: {error}
          </div>
        )}

        <section>
          <h2 className="text-2xl font-semibold mb-4">API Data Interaction</h2>
          <ApiActions
            selectedDiet={selectedDiet}
            onGetInsights={handleRefresh}
            insightsLoading={loading}
          />
        </section>
      </main>

      <footer className="bg-purple-300 p-4 text-white text-center mt-10">
        <p>&copy; 2026 Nutritional Insights. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;