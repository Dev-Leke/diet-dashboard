import { useState } from "react";
import DietDropdown from "./DietDropdown.jsx";

const LABELS = {
  all: "All Diet Types",
  dash: "DASH",
  keto: "Keto",
  mediterranean: "Mediterranean",
  paleo: "Paleo",
  vegan: "Vegan",
};

export default function FilterBar({
  dietTypes,
  selectedDiet,
  onDietChange,
  onRefresh,
  loading,
}) {
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState(false);

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const query = search.trim().toLowerCase();
    if (!query) return;
    const match = dietTypes.find((diet) =>
      (LABELS[diet] ?? diet).toLowerCase().includes(query)
    );
    if (match) {
      setSearchError(false);
      onDietChange(match);
    } else {
      setSearchError(true);
    }
  };

  const handleDropdownChange = (diet) => {
    setSearch("");
    setSearchError(false);
    onDietChange(diet);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchError(false);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by Diet Type, press Enter"
          className={`p-2 border rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            searchError ? "border-red-400" : "border-gray-300"
          }`}
        />

        <DietDropdown
          dietTypes={dietTypes}
          selectedDiet={selectedDiet}
          labels={LABELS}
          onChange={handleDropdownChange}
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-purple-300 hover:bg-purple-400 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {searchError && (
        <p className="text-xs text-red-500 mt-2">
          No diet type matches "{search}". Try dash, keto, mediterranean, paleo, or vegan.
        </p>
      )}
    </div>
  );
}