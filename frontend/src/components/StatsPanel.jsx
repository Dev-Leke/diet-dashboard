function StatCard({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4 shadow-lg rounded-lg border border-gray-100 flex-1 min-w-[180px]">
      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function StatsPanel({ meta, loading }) {
  return (
    <div className="flex flex-wrap gap-4">
      <StatCard
        label="Execution time"
        value={loading ? "…" : `${meta?.executionTimeMs ?? 0} ms`}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Record count"
        value={loading ? "…" : meta?.recordCount ?? 0}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        }
      />
      <StatCard
        label="Filter applied"
        value={loading ? "…" : meta?.filterApplied ?? "all"}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M9 12h6M11 16h2" />
          </svg>
        }
      />
      <StatCard
        label="Last updated"
        value={
          loading
            ? "…"
            : meta?.generatedAt
            ? new Date(meta.generatedAt).toLocaleTimeString()
            : "—"
        }
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
      />
    </div>
  );
}