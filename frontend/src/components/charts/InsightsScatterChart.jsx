import { Scatter } from "react-chartjs-2";
import ChartCard from "../ChartCard.jsx";

const PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function InsightsScatterChart({ data }) {
  if (!data) return null;

  const chartData = {
    datasets: data.series.map((s, i) => ({
      label: s.label,
      data: s.points,
      backgroundColor: PALETTE[i % PALETTE.length],
      pointRadius: 5,
      pointHoverRadius: 7,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
    },
    scales: {
      x: {
        title: { display: true, text: data.xLabel, font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      y: {
        title: { display: true, text: data.yLabel, font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
    },
  };

  return (
    <ChartCard title="Scatter Plot" subtitle={data.title}>
      <Scatter data={chartData} options={options} />
    </ChartCard>
  );
}