export default function AdminMetricCard({ eyebrow, value, label, tone = 'cyan' }) {
  const toneStyles = {
    cyan: 'border-blue-300 bg-blue-50 text-blue-900',
    amber: 'border-amber-300 bg-amber-50 text-amber-900',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    rose: 'border-red-300 bg-red-50 text-red-900',
  };

  const headerStyles = {
    cyan: 'bg-blue-200 text-blue-900',
    amber: 'bg-amber-200 text-amber-900',
    emerald: 'bg-emerald-200 text-emerald-900',
    rose: 'bg-red-200 text-red-900',
  };

  return (
    <div
      className={`border flex flex-col shadow-sm ${toneStyles[tone]}`}
    >
      <div className={`px-4 py-2 border-b border-inherit ${headerStyles[tone]}`}>
        <p className="text-xs font-bold uppercase tracking-wider">
          {eyebrow}
        </p>
      </div>
      <div className="p-4 flex-1">
        <div className="text-3xl font-bold">{value}</div>
        <p className="mt-2 text-xs font-semibold uppercase">{label}</p>
      </div>
    </div>
  );
}
