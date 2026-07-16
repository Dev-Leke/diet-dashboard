export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-100 flex flex-col">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      <div className="flex-1 min-h-[220px] relative mt-3">{children}</div>
    </div>
  );
}