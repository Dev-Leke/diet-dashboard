import { useState } from "react";

const DIET_LABELS = {
  all: "All Diet Types",
  dash: "DASH",
  keto: "Keto",
  mediterranean: "Mediterranean",
  paleo: "Paleo",
  vegan: "Vegan",
};

export default function ApiActions({ selectedDiet, onGetInsights, insightsLoading }) {
  const [errorMsg, setErrorMsg] = useState(null);
  const [done, setDone] = useState(false);

  const runInsights = async () => {
    setErrorMsg(null);
    try {
      await onGetInsights();
      setDone(true);
    } catch (err) {
      setErrorMsg(err.message ?? "Failed to fetch insights");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={runInsights}
          disabled={insightsLoading}
          className="bg-blue-600 hover:bg-blue-400 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {insightsLoading ? "Fetching..." : "Get Nutritional Insights"}
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {errorMsg}
        </div>
      )}

      {done && !errorMsg && (
        <div className="mt-4 bg-white p-4 shadow-lg rounded-lg border border-gray-100 text-sm text-gray-600">
          Insights refreshed for{" "}
          <span className="font-semibold">{DIET_LABELS[selectedDiet] ?? selectedDiet}</span> — see the charts above.
        </div>
      )}
    </div>
  );
}