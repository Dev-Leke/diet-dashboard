import { useEffect, useRef, useState } from "react";

export default function DietDropdown({ dietTypes, selectedDiet, labels, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = labels[selectedDiet] ?? selectedDiet;

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full sm:w-auto flex items-center justify-between gap-3 p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]"
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
          {dietTypes.map((diet) => {
            const isSelected = diet === selectedDiet;
            return (
              <li key={diet}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(diet);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  {labels[diet] ?? diet}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}