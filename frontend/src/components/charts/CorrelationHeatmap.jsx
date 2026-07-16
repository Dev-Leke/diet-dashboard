import { Fragment } from "react";
import ChartCard from "../ChartCard.jsx";

function colorForValue(value) {

  const clamped = Math.max(-1, Math.min(1, value));
  if (clamped >= 0) {
    const g = Math.round(255 - clamped * 120);
    const b = Math.round(255 - clamped * 60);
    return `rgb(${g}, ${g}, ${b})`;
  }
  const mag = Math.abs(clamped);
  const g = Math.round(255 - mag * 120);
  const b = Math.round(255 - mag * 120);
  return `rgb(255, ${g}, ${b})`;
}

export default function CorrelationHeatmap({ data }) {
  if (!data) return null;

  const { labels, matrix } = data;

  return (
    <ChartCard title="Heatmap" subtitle={data.title}>
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${labels.length}, 1fr)` }}>
        <div />
        {labels.map((label) => (
          <div key={label} className="text-[10px] text-gray-500 text-center px-1 pb-1">
            {label}
          </div>
        ))}
        {matrix.map((row, i) => (
          <Fragment key={labels[i]}>
            <div className="text-[10px] text-gray-500 flex items-center pr-1">{labels[i]}</div>
            {row.map((value, j) => (
              <div
                key={`${labels[i]}-${labels[j]}`}
                className="aspect-square flex items-center justify-center text-[11px] font-medium text-gray-700 rounded"
                style={{ backgroundColor: colorForValue(value) }}
                title={`${labels[i]} vs ${labels[j]}: ${value}`}
              >
                {value.toFixed(2)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </ChartCard>
  );
}