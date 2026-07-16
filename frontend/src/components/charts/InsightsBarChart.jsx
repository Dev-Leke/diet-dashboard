import { Bar } from "react-chartjs-2";
import ChartCard from "../ChartCard.jsx";

const PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function InsightsBarChart({ data }) {
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: PALETTE[i % PALETTE.length],
      borderRadius: 4,
      maxBarThickness: 36,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#f1f5f9" }, beginAtZero: true },
    },
  };

  return (
    <ChartCard title="Bar Chart" subtitle={data.title}>
      <Bar data={chartData} options={options} />
    </ChartCard>
  );
}