import { Pie } from "react-chartjs-2";
import ChartCard from "../ChartCard.jsx";

const PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function InsightsPieChart({ data }) {
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.data,
        backgroundColor: data.labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
    },
  };

  return (
    <ChartCard title="Pie Chart" subtitle={data.title}>
      <Pie data={chartData} options={options} />
    </ChartCard>
  );
}